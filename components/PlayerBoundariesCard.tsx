"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore"; // Adjust path as needed

interface Player {
  name: string;
  boundaries: number;
  id?: number;
  teamName?: string;
}

interface PlayerBoundariesCardProps {
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

const PlayerBoundariesCard: React.FC<PlayerBoundariesCardProps> = ({ 
  heading, 
  players, 
  matchId
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Get user authentication data from store
  const { user, token, updateUserBalance } = useAuthStore();
  const userId = user?._id;

  const openBetModal = (player: Player) => {
    setSelectedPlayer(player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !userId || !matchId) {
      toast.error("Missing information", { 
        description: "User, match or player information is missing" 
      });
      return;
    }

    setIsProcessing(true);

    try {
      toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boundarybet/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            matchId,
            teamName: selectedPlayer.teamName,
            playerName: selectedPlayer.name,
            predictedBoundaries: selectedPlayer.boundaries,
            betAmount: amount
          })
        }).then(async (response) => {
          const data: BetResponse = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to place bet");
          }
          
          // Update user balance in store if provided in response
          if (data.newBalance !== undefined) {
            updateUserBalance(data.newBalance);
          }
          
          return data;
        }),
        {
          loading: 'Placing your boundary bet...',
          success: (data) => {
            closeModal();
            return `${data.message}. New balance: ₹${data.newBalance?.toLocaleString() || user?.money.toLocaleString()}`;
          },
          error: (error) => error.message || "Boundary bet placement failed",
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
        <div className="bg-blue-200 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-2 md:grid-cols-3 text-sm font-semibold border-b border-gray-300 text-center">
          <div className="text-left px-4 py-2 bg-gray-50 col-span-1">Player</div>
          <div className="bg-blue-500 text-white py-2 hidden md:block">Boundaries</div>
          <div className="bg-gray-100 py-2">Bet</div>
        </div>

        {/* Player Rows */}
        {players.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-2 md:grid-cols-3 border-b border-gray-100 items-center text-sm text-gray-700 text-center"
          >
            <div className="text-left px-4 py-3 font-medium capitalize">{player.name}</div>
            <div className="py-3 hidden md:block text-blue-700 font-semibold">
              {player.boundaries}
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

      {/* Improved Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Place Boundary Bet</h2>
              <button
                onClick={closeModal}
                className="text-white text-xl hover:text-red-200"
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-gray-700 mb-2">
                  <div className="font-medium">Player:</div>
                  <div className="font-bold text-blue-700">{selectedPlayer.name}</div>
                  
                  <div className="font-medium">Team:</div>
                  <div className="font-bold text-blue-700">{selectedPlayer.teamName || 'N/A'}</div>
                  
                  <div className="font-medium">Predicted Boundaries:</div>
                  <div className="font-bold text-blue-700">{selectedPlayer.boundaries}</div>
                </div>
              </div>

              {/* Current Balance */}
              <div className="text-sm text-gray-600 mb-4">
                Current Balance: <span className="font-bold text-green-600">₹{user?.money.toLocaleString() || 0}</span>
              </div>

              {/* Bet Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bet Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={100}
                    max={200000}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="bg-gray-50 p-3 rounded-lg mb-6">
                <div className="text-sm text-gray-600 mb-2">Quick Add:</div>
                <div className="grid grid-cols-5 gap-2">
                  {[100, 500, 1000, 2000, 5000, 10000, 25000, 50000, 75000, 100000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(amount + val)}
                      className="bg-blue-100 text-blue-700 py-1 px-2 rounded font-medium text-xs hover:bg-blue-200 disabled:opacity-50"
                      disabled={isProcessing}
                    >
                      {val >= 1000 ? `+${val/1000}k` : `+${val}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet Summary */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="text-lg font-semibold text-gray-800 mb-1">Bet Summary</div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Your Bet:</span>
                  <span className="text-xl font-bold text-green-600">₹{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-700">Potential Win:</span>
                  <span className="font-bold text-green-600">₹{(amount * 2).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                <button
                  onClick={handlePlaceBet}
                  className="bg-green-600 text-white w-2/3 py-3 rounded hover:bg-green-700 font-semibold disabled:opacity-50 transition"
                  disabled={isProcessing || amount <= 0 || (user?.money || 0) < amount}
                >
                  {isProcessing ? 'Processing...' : 'Place Bet'}
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-700 w-1/3 py-3 rounded hover:bg-gray-400 font-semibold disabled:opacity-50 transition"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>

              {/* Error message if user doesn't have enough balance */}
              {(user?.money || 0) < amount && (
                <div className="mt-3 text-sm text-red-600">
                  Insufficient balance. Please enter a lower amount.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerBoundariesCard;