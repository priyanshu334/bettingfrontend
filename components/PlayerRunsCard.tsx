"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore"; // Import auth store

interface Player {
  id: number;
  name: string;
  runs: number;
  buttons: string[];
}

interface PlayerRunsCardProps {
  matchId: number;
  heading: string;
  players: Player[];
}

interface BetResponse {
  message: string;
  newBalance?: number;
  error?: string;
  bet?: any;
}

const PlayerRunsCard: React.FC<PlayerRunsCardProps> = ({ matchId, heading, players }) => {
  const { user, token, updateUserBalance } = useAuthStore(); // Get auth data from store
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedBetType, setSelectedBetType] = useState<string>("");
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  // Add state for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);

  const openBetModal = (player: Player, betType: string) => {
    setSelectedPlayer(player);
    setSelectedBetType(betType);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setSelectedBetType("");
    setAmount(100);
  };

  // Add function to close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  // Add function to navigate to bets page
  const navigateToBets = () => {
    window.location.href = '/my-bets'; // Simple navigation
    closeSuccessPopup();
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !selectedBetType || !user) return;

    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playerruns/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add token for authentication
        },
        body: JSON.stringify({
          userId: user._id,
          matchId,
          playerId: selectedPlayer.id,
          playerName: selectedPlayer.name,
          betType: selectedBetType.split(":")[0], // Extract bet type (e.g., "50+")
          amount,
          odds: parseFloat(selectedBetType.split(":")[1]) // Extract odds from betType string
        })
      });
      
      const data: BetResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to place bet");
      }
      
      // Update user balance in the store
      if (data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      }
      
      // Close the bet modal
      closeModal();
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Also show toast for background notification
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
        <div className="bg-yellow-200 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-3 text-sm font-semibold border-b border-gray-300 text-center">
          <div className="text-left px-4 py-2 bg-gray-50">Player</div>
          <div className="bg-yellow-500 text-white py-2">Runs</div>
          <div className="bg-gray-100 py-2">Bet</div>
        </div>

        {/* Player Rows */}
        {players.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-3 border-b border-gray-100 items-center text-sm text-gray-700 text-center"
          >
            <div className="text-left px-4 py-3 font-medium capitalize">{player.name}</div>
            <div className="py-3 text-yellow-700 font-semibold">
              {player.runs}
            </div>
            <div className="py-3 flex justify-center space-x-2">
              {player.buttons.map((button, btnIndex) => (
                <button
                  key={btnIndex}
                  onClick={() => openBetModal(player, button)}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-blue-200 transition whitespace-nowrap"
                >
                  {button}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Improved Modal UI */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white py-3 px-6 font-bold text-lg">
              Place Bet
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Player:</span>
                  <span className="font-semibold">{selectedPlayer.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Current Runs:</span>
                  <span className="font-semibold">{selectedPlayer.runs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bet Type:</span>
                  <span className="font-semibold">{selectedBetType.split(":")[0]} (Odds: {selectedBetType.split(":")[1]})</span>
                </div>
              </div>

              {/* Amount Input with better visibility */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Bet Amount (₹)</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                    min={100}
                    max={user ? user.money : 200000}
                    disabled={isProcessing}
                  />
                </div>
                {user && (
                  <div className="text-right text-sm mt-1 text-gray-500">
                    Available Balance: ₹{user.money.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Quick Amount Buttons with improved layout */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Quick Add</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1000, 2000, 5000, 10000, 20000, 25000, 50000, 75000, 90000, 95000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(Math.min((user?.money || 0), amount + val))}
                      className="bg-green-100 text-green-800 py-2 rounded font-medium text-xs hover:bg-green-200 disabled:opacity-50"
                      disabled={isProcessing || (amount + val) > (user?.money || 0)}
                    >
                      +{val >= 1000 ? `${val/1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Potential Winnings */}
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Potential Winnings:</span>
                  <span className="font-bold text-green-700">₹{(amount * parseFloat(selectedBetType.split(":")[1])).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-800 w-1/3 py-3 rounded-lg hover:bg-gray-400 font-semibold disabled:opacity-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceBet}
                  className="bg-green-600 text-white w-2/3 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                  disabled={isProcessing || amount > (user?.money || 0)}
                >
                  {isProcessing ? 'Processing...' : 'Place ₹' + amount.toLocaleString() + ' Bet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup - Based on the PlayerWicketsCard implementation */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeSuccessPopup}
              className="absolute top-3 right-3 text-xl font-bold text-gray-700 hover:text-red-600 transition-colors"
            >
              ×
            </button>
            
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Bet Placed Successfully!</h2>
              <p className="text-gray-600 mb-6">Your runs bet has been placed successfully and can be viewed in your bet history.</p>
              
              <div className="flex gap-4">
                <button
                  onClick={navigateToBets}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  See Bets
                </button>
                
                <button
                  onClick={closeSuccessPopup}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Continue Betting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerRunsCard;