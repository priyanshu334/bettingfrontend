"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore"; // Adjusted path as needed

interface Player {
  name: string;
  wickets: number;
  id?: number;
  teamName?: string;
}

interface PlayerWicketsCardProps {
  heading: string;
  players: Player[];
  matchId: number;
}

interface BetResponse {
  message: string;
  newBalance?: number;
  error?: string;
  bet?: any;
}

const PlayerWicketsCard: React.FC<PlayerWicketsCardProps> = ({ 
  heading, 
  players, 
  matchId
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Get authentication data from the auth store
  const { user, token, updateUserBalance, isAuthenticated } = useAuthStore();

  const openBetModal = (player: Player) => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to place bets");
      return;
    }
    setSelectedPlayer(player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !user || !matchId || !isAuthenticated) {
      toast.error("Authentication required");
      return;
    }

    setIsProcessing(true);

    try {
      toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playerwicket/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: user._id,
            matchId,
            teamName: selectedPlayer.teamName,
            playerName: selectedPlayer.name,
            predictedWickets: selectedPlayer.wickets,
            betAmount: amount
          })
        }).then(async (response) => {
          const data: BetResponse = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to place bet");
          }
          
          // Update user balance in the store if bet was successful
          if (data.newBalance !== undefined) {
            updateUserBalance(data.newBalance);
          }
          
          return data;
        }),
        {
          loading: 'Placing your wickets bet...',
          success: (data) => {
            closeModal();
            return `${data.message}. New balance: ₹${data.newBalance}`;
          },
          error: (error) => error.message || "Wickets bet placement failed",
        }
      );
    } catch (error) {
      console.error("Bet Error:", error);
      toast.error("Bet Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg w-full overflow-hidden border border-gray-200">
        {/* Heading */}
        <div className="bg-purple-200 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-3 text-sm font-semibold border-b border-gray-300 text-center">
          <div className="text-left px-4 py-2 bg-gray-50 col-span-1">Player</div>
          <div className="bg-purple-500 text-white py-2 hidden md:block">Wickets</div>
          <div className="bg-gray-100 py-2">Bet</div>
        </div>

        {/* Player Rows */}
        {players.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-3 border-b border-gray-100 items-center text-sm text-gray-700 text-center"
          >
            <div className="text-left px-4 py-3 font-medium capitalize">{player.name}</div>
            <div className="py-3 hidden md:block text-purple-700 font-semibold">
              {player.wickets}
            </div>
            <div className="py-3">
              <button
                onClick={() => openBetModal(player)}
                className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold hover:bg-blue-200 transition"
              >
                100
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-pink-100 rounded-lg shadow-xl w-[90%] max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-lg font-bold text-gray-700 hover:text-red-600"
              disabled={isProcessing}
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center text-red-900">Place Wickets Bet</h2>
            <div className="text-sm text-gray-700 mb-2">
              Player: <span className="font-medium">{selectedPlayer.name}</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              Team: <span className="font-medium">{selectedPlayer.teamName || 'N/A'}</span>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              Predicted Wickets: <span className="font-medium">{selectedPlayer.wickets}</span>
            </div>

            <div className="text-sm text-gray-700 mb-2">
              Your Balance: <span className="font-medium">₹{user?.money || 0}</span>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              min={100}
              max={user?.money || 200000}
              disabled={isProcessing}
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1000, 2000, 5000, 10000, 20000, 25000, 50000, 75000, 90000, 95000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(Math.min((user?.money || 0), amount + val))}
                  className="bg-orange-300 text-white py-2 rounded font-semibold text-sm hover:bg-orange-400 disabled:opacity-50"
                  disabled={isProcessing || (amount + val) > (user?.money || 0)}
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handlePlaceBet}
                className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 font-semibold disabled:opacity-50"
                disabled={isProcessing || amount > (user?.money || 0)}
              >
                {isProcessing ? 'Processing...' : 'Place Bet'}
              </button>
              <button
                onClick={closeModal}
                className="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600 font-semibold disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerWicketsCard;