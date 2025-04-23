"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore"; // Update this path to match your project structure

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
}

interface BetResponse {
  message: string;
  bet?: any;
}

const BowlerRunsCard: React.FC<BowlerRunsCardProps> = ({ 
  heading, 
  players, 
  matchId
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Get authentication data from zustand store
  const { token, user, updateUserBalance } = useAuthStore();

  const handleBetClick = (player: Player) => {
    setSelectedPlayer(player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !user || !token || !matchId) {
      toast.error("Authentication required", {
        description: "Please login to place bets"
      });
      return;
    }

    setIsProcessing(true);

    try {
      toast.promise(
        fetch(`https://backend.nurdcells.com/api/bowlerruns/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            matchId,
            teamName: selectedPlayer.teamName,
            bowlerName: selectedPlayer.name,
            predictedRunsConceded: selectedPlayer.runsConceded,
            betAmount: amount
          })
        }).then(async (response) => {
          const data: BetResponse & { user?: { money: number } } = await response.json();
          if (!response.ok) {
            throw new Error(data.message || "Failed to place bet");
          }
          
          // Update user balance in zustand store if returned
          if (data.user && data.user.money !== undefined) {
            updateUserBalance(data.user.money);
          } else if (user) {
            // Subtract bet amount from current balance if not returned
            updateUserBalance(user.money - amount);
          }
          
          return data;
        }),
        {
          loading: 'Placing your bowler runs bet...',
          success: (data) => {
            closeModal();
            return `${data.message || "Bet placed successfully"}`;
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
                disabled={isProcessing}
              >
                100
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal with Improved UI */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-[90%] max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 relative">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-white bg-red-700 hover:bg-red-800 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400"
                disabled={isProcessing}
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-white">Place Bowler Runs Bet</h2>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-5 border border-blue-100">
                <div className="text-gray-800 mb-2">
                  <span className="font-semibold">Bowler:</span> {selectedPlayer.name}
                </div>
                <div className="text-gray-800 mb-2">
                  <span className="font-semibold">Team:</span> {selectedPlayer.teamName || 'N/A'}
                </div>
                <div className="text-gray-800">
                  <span className="font-semibold">Predicted Runs:</span> {selectedPlayer.runsConceded}
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">Bet Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-lg font-medium"
                min={100}
                max={200000}
                disabled={isProcessing}
              />

              <div className="grid grid-cols-5 gap-2 mb-6">
                {[1000, 2000, 5000, 10000, 20000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-medium text-sm"
                    disabled={isProcessing}
                  >
                    {val}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[25000, 50000, 75000, 100000, 200000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className="bg-orange-200 hover:bg-orange-300 text-orange-800 py-2 rounded font-medium text-sm"
                    disabled={isProcessing}
                  >
                    {val/1000}K
                  </button>
                ))}
              </div>

              <div className="flex justify-between gap-3 mt-4">
                <button
                  onClick={handlePlaceBet}
                  className="bg-green-600 text-white w-full py-3 rounded-md hover:bg-green-700 font-bold text-lg disabled:opacity-50 transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Place Bet'}
                </button>
                <button
                  onClick={closeModal}
                  className="bg-gray-200 text-gray-800 w-1/3 py-3 rounded-md hover:bg-gray-300 font-medium disabled:opacity-50 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
              
              {user && (
                <div className="text-center mt-4 text-sm text-gray-600">
                  Current Balance: <span className="font-bold text-green-600">₹{user.money.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BowlerRunsCard;