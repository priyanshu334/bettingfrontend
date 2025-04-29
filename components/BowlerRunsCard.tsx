"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface Player {
  name: string;
  runsConceded: number;
  id: number;
  teamName?: string;
}

interface BowlerRunsCardProps {
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

const BowlerRunsCard: React.FC<BowlerRunsCardProps> = ({ 
  heading, 
  players, 
  matchId
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  
  const { token, user, updateUserBalance, isAuthenticated } = useAuthStore();

  const handleBetClick = (player: Player) => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to place bets");
      return;
    }
    if (user.money < 100) {
      toast.error("Minimum bet amount is ₹100");
      return;
    }
    setSelectedPlayer(player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  const navigateToBets = () => {
    window.location.href = '/my-bets';
    closeSuccessPopup();
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !user || !token || !matchId) {
      toast.error("Please log in to place bets");
      return;
    }

    if (amount < 100 || amount > (user?.money || 0)) {
      toast.error(`Bet amount must be between ₹100 and ₹${user?.money.toLocaleString()}`);
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bowlerruns/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          matchId,
          playerId: selectedPlayer.id,
          bowlerName: selectedPlayer.name,
          predictedRunsConceded: selectedPlayer.runsConceded,
          betAmount: amount
        })
      });

      const data: BetResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place bet");
      }

      // Update user balance
      if (data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      } else {
        // Fallback: Deduct manually if API doesn't return balance
        updateUserBalance(user.money - amount);
      }

      setShowSuccessPopup(true);
      closeModal();
      toast.success(data.message || "Bet placed successfully");

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
        <div className="bg-red-100 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        <div className="grid grid-cols-4 text-center text-sm font-semibold border-b border-gray-300">
          <div className="text-left px-4 py-2 col-span-2 bg-gray-50">Bowler</div>
          <div className="bg-red-500 text-white py-2">Runs</div>
          <div className="bg-blue-500 text-white py-2">Bet</div>
        </div>

        {players.map((player, index) => (
          <div
            key={`${player.id}-${index}`}
            className="grid grid-cols-4 items-center text-center border-b border-gray-100"
          >
            <div className="text-left px-4 py-3 text-sm font-medium text-gray-700 col-span-2 capitalize">
              {player.name}
            </div>
            <div className="py-3 bg-red-50 text-red-700 font-semibold">
              {player.runsConceded}
            </div>
            <div className="py-3 bg-blue-50">
              <button
                onClick={() => handleBetClick(player)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm px-4 py-1 rounded-full font-medium transition"
                disabled={!isAuthenticated || (user?.money || 0) < 100}
              >
                100
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bet Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-red-500 px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Place Bowler Runs Bet</h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 text-2xl"
                disabled={isProcessing}
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 space-y-2">
                <p><span className="font-semibold">Bowler:</span> {selectedPlayer.name}</p>
                {selectedPlayer.teamName && (
                  <p><span className="font-semibold">Team:</span> {selectedPlayer.teamName}</p>
                )}
                <p><span className="font-semibold">Predicted Runs:</span> {selectedPlayer.runsConceded}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bet Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = Math.max(100, Math.min(user?.money || 200000, Number(e.target.value)));
                    setAmount(value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={100}
                  max={user?.money || 200000}
                  disabled={isProcessing}
                />
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {[100, 500, 1000, 2000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded text-sm"
                    disabled={isProcessing || val > (user?.money || 0)}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePlaceBet}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold disabled:opacity-50"
                  disabled={isProcessing || amount > (user?.money || 0)}
                >
                  {isProcessing ? 'Processing...' : 'Place Bet'}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-semibold disabled:opacity-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>

              {user && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Balance: ₹{user.money.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h2 className="text-xl font-bold mb-2">Bet Placed Successfully!</h2>
              <p className="text-gray-600 mb-4">Your bet on {selectedPlayer?.name} has been placed.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={navigateToBets}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                >
                  View Bets
                </button>
                <button
                  onClick={closeSuccessPopup}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BowlerRunsCard;