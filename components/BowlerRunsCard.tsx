"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore"; // Adjust the import path as needed

interface Player {
  name: string;
  runsConceded: number;
  id?: number;
  teamName?: string;
}

interface BowlerRunsCardProps {
  heading: string;
  players: Player[];
  matchId: number;
  userId: string;
}

interface BetResponse {
  message: string;
  newBalance?: number;
  error?: string;
  bet?: any;
}

const BowlerRunsCard: React.FC<BowlerRunsCardProps> = ({ 
  heading, 
  players, 
  matchId,
  userId 
}) => {
  const { token, user, isAuthenticated } = useAuthStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleBetClick = (player: Player) => {
    setSelectedPlayer(player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !userId || !matchId) return;
    if (!isAuthenticated || !token) {
      toast.error("Please login to place bets");
      return;
    }

    setIsProcessing(true);

    try {
      toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bowlerruns/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            matchId,
            teamName: selectedPlayer.teamName,
            bowlerName: selectedPlayer.name,
            predictedRunsConceded: selectedPlayer.runsConceded,
            betAmount: amount
          })
        }).then(async (response) => {
          const data: BetResponse = await response.json();
          if (!response.ok) {
            if (response.status === 400 && data.message === "Insufficient balance") {
              throw new Error("Insufficient balance to place this bet");
            }
            throw new Error(data.error || data.message || "Failed to place bet");
          }
          return data;
        }),
        {
          loading: 'Placing your bowler runs bet...',
          success: (data) => {
            closeModal();
            if (data.newBalance !== undefined) {
              useAuthStore.getState().updateUserBalance(data.newBalance);
            }
            return `${data.message}. New balance: ₹${data.newBalance}`;
          },
          error: (error) => error.message || "Bowler runs bet placement failed",
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
        {/* Heading Bar */}
        <div className="bg-red-100 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-4 text-center text-sm font-semibold border-b border-gray-300">
          <div className="text-left px-4 py-2 col-span-2 bg-gray-50">Bowler</div>
          <div className="bg-red-500 text-white py-2">Runs</div>
          <div className="bg-blue-500 text-white py-2">Bet</div>
        </div>

        {/* Table Rows */}
        {players.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-4 items-center text-center border-b border-gray-100"
          >
            {/* Name */}
            <div className="text-left px-4 py-3 text-sm font-medium text-gray-700 col-span-2 bg-white capitalize">
              {player.name}
            </div>

            {/* Runs */}
            <div className="py-3 bg-red-50 text-red-700 font-semibold">
              {player.runsConceded}
            </div>

            {/* Bet (fixed 100) */}
            <div className="py-3 bg-blue-50">
              <button
                onClick={() => handleBetClick(player)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-4 py-1 rounded-full font-medium transition"
                disabled={isProcessing || !isAuthenticated}
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
            <h2 className="text-lg font-semibold mb-4 text-center text-red-900">Place Bowler Runs Bet</h2>
            <div className="text-sm text-gray-700 mb-2">
              Bowler: <span className="font-medium">{selectedPlayer.name}</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              Team: <span className="font-medium">{selectedPlayer.teamName || 'N/A'}</span>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              Predicted Runs: <span className="font-medium">{selectedPlayer.runsConceded}</span>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              min={100}
              max={200000}
              disabled={isProcessing}
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1000, 2000, 5000, 10000, 20000, 25000, 50000, 75000, 90000, 95000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(amount + val)}
                  className="bg-orange-300 text-white py-2 rounded font-semibold text-sm hover:bg-orange-400 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handlePlaceBet}
                className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 font-semibold disabled:opacity-50"
                disabled={isProcessing || !isAuthenticated}
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

export default BowlerRunsCard;