"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface Player {
  name: string;
  wickets: number;
  id: number;
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
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  
  const { user, token, updateUserBalance, isAuthenticated } = useAuthStore();

  const openBetModal = (player: Player) => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in to place bets");
      return;
    }
    if (user.money < 100) {
      toast.error("Insufficient balance to place bet");
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
    if (!selectedPlayer || !user || !matchId || !isAuthenticated || !token) {
      toast.error("Authentication required");
      return;
    }

    if (!selectedPlayer.id) {
      toast.error("Player information incomplete");
      return;
    }

    if (amount < 100 || amount > (user?.money || 0)) {
      toast.error("Invalid bet amount");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playerwickets/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          matchId,
          playerId: selectedPlayer.id,
          playerName: selectedPlayer.name,
          predictedWickets: selectedPlayer.wickets,
          betAmount: amount
        })
      });
      
      const data: BetResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to place bet");
      }
      
      if (data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      }
      
      closeModal();
      setShowSuccessPopup(true);
      toast.success(data.message);
      
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
            key={`${player.id}-${index}`}
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
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-lg font-bold text-gray-700 hover:text-red-600"
              disabled={isProcessing}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Place Wickets Bet</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Player:</span>
                <span className="font-medium">{selectedPlayer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Team:</span>
                <span className="font-medium">{selectedPlayer.teamName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Predicted Wickets:</span>
                <span className="font-medium">{selectedPlayer.wickets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Balance:</span>
                <span className="font-medium">₹{user?.money?.toLocaleString() || 0}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const value = Math.max(100, Math.min(user?.money || 200000, Number(e.target.value)));
                  setAmount(value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="bg-blue-100 text-blue-800 py-1 rounded font-medium text-sm hover:bg-blue-200 disabled:opacity-50"
                  disabled={isProcessing || val > (user?.money || 0)}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePlaceBet}
                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold disabled:opacity-50"
                disabled={isProcessing || amount > (user?.money || 0) || amount < 100}
              >
                {isProcessing ? 'Processing...' : 'Place Bet'}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 font-semibold disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Bet Placed!</h2>
              <p className="text-gray-600 mb-6">Your bet on {selectedPlayer?.name} has been placed successfully.</p>
              
              <div className="flex gap-4">
                <button
                  onClick={navigateToBets}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  View My Bets
                </button>
                <button
                  onClick={closeSuccessPopup}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold"
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

export default PlayerWicketsCard;