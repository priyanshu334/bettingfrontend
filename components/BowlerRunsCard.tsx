"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

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
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Get authentication data from zustand store
  const { token, user, updateUserBalance } = useAuthStore();

  const handleBetClick = (player: Player) => {
    setSelectedPlayer(player);
    setApiError(null); // Reset any previous errors
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
    setApiError(null);
  };

  // Debug logging effect - will help track state changes
  useEffect(() => {
    if (selectedPlayer) {
      console.log("Selected player data:", selectedPlayer);
      console.log("Current user authentication:", { 
        isAuthenticated: !!token, 
        hasUserData: !!user,
        matchId: matchId
      });
    }
  }, [selectedPlayer, token, user, matchId]);

  const handlePlaceBet = async () => {
    setApiError(null);
    
    // Enhanced validation
    if (!token) {
      toast.error("Authentication required", {
        description: "Please login to place bets"
      });
      return;
    }
    
    if (!selectedPlayer) {
      toast.error("Selection error", {
        description: "Please select a bowler"
      });
      return;
    }
    
    if (!matchId) {
      toast.error("Match ID missing", {
        description: "Invalid match selection"
      });
      return;
    }
    
    if (!selectedPlayer.teamName) {
      toast.error("Team data missing", {
        description: "Selected bowler has incomplete data"
      });
      console.error("Missing team name for player:", selectedPlayer);
      return;
    }
    
    if (user && amount > user.money) {
      toast.error("Insufficient balance", {
        description: "You don't have enough funds to place this bet"
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log("Sending bet request with data:", {
        matchId,
        teamName: selectedPlayer.teamName,
        bowlerName: selectedPlayer.name,
        predictedRunsConceded: selectedPlayer.runsConceded,
        betAmount: amount
      });
      
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
          
          console.log("API response:", {
            status: response.status,
            statusText: response.statusText,
            data: data
          });
          
          if (!response.ok) {
            throw new Error(data.message || `Server error (${response.status}): ${response.statusText}`);
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
          error: (error) => {
            setApiError(error.message || "Bowler runs bet placement failed");
            return error.message || "Bowler runs bet placement failed";
          },
        }
      );
    } catch (error) {
      console.error("Bet Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setApiError(errorMessage);
      toast.error("Bet Failed", { description: errorMessage });
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

      {/* Improved Modal UI */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
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

              {/* Improved Bet Amount Input Section */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bet Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-lg font-medium text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium bg-white text-gray-800"
                    min={100}
                    max={200000}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-2">
                <p className="text-xs text-gray-500 mb-1">Quick Select:</p>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[1000, 2000, 5000, 10000, 20000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded font-medium text-sm border border-gray-200"
                      disabled={isProcessing}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="grid grid-cols-5 gap-2">
                  {[25000, 50000, 75000, 100000, 200000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-800 py-2 rounded font-medium text-sm border border-orange-200"
                      disabled={isProcessing}
                    >
                      {val/1000}K
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
                  <p className="font-bold">Error:</p>
                  <p>{apiError}</p>
                </div>
              )}

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