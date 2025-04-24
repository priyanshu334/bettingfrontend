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
  const [debugInfo, setDebugInfo] = useState<any>(null);
  // Add state for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  
  // Get authentication data from zustand store
  const { token, user, updateUserBalance } = useAuthStore();

  const handleBetClick = (player: Player) => {
    setSelectedPlayer(player);
    console.log("Selected player for betting:", player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
    setDebugInfo(null);
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
    if (!selectedPlayer || !user || !token || !matchId) {
      const errorMsg = "Authentication required - Please login to place bets";
      console.error("Bet validation error:", { 
        hasSelectedPlayer: !!selectedPlayer, 
        hasUser: !!user, 
        hasToken: !!token, 
        matchId 
      });
      toast.error("Authentication required", {
        description: "Please login to place bets"
      });
      return;
    }

    setIsProcessing(true);
    console.log("Starting bet placement process...");

    // Prepare request body for better debugging
    const requestBody = {
      userId: user._id,
      matchId,
      bowlerName: selectedPlayer.name,
      predictedRunsConceded: selectedPlayer.runsConceded,
      betAmount: amount
    };

    console.log("Preparing bet request with data:", requestBody);
    
    try {
      const requestStartTime = Date.now();
      console.log(`Sending request to API at ${new Date().toISOString()}`);
      
      toast.promise(
        fetch(`https://backend.nurdcells.com/api/bowlerruns/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        }).then(async (response) => {
          const requestDuration = Date.now() - requestStartTime;
          console.log(`API response received in ${requestDuration}ms with status: ${response.status}`);
          
          const responseData: BetResponse = await response.json();
          console.log("API response data:", responseData);
          
          // Store debug info for display
          setDebugInfo({
            request: requestBody,
            response: responseData,
            status: response.status,
            duration: requestDuration,
            timestamp: new Date().toISOString()
          });
          
          if (!response.ok) {
            throw new Error(responseData.message || `Failed to place bet (Status: ${response.status})`);
          }
          
          // Update user balance by subtracting bet amount as done in API
          if (user) {
            const previousBalance = user.money;
            const newBalance = user.money - amount;
            console.log(`Updating user balance: ${previousBalance} → ${newBalance}`);
            updateUserBalance(newBalance);
          }
          
          // Show success popup after successful bet
          setShowSuccessPopup(true);
          
          closeModal();
          return responseData;
        }),
        {
          loading: 'Placing your bowler runs bet...',
          success: (data) => {
            console.log("Bet placed successfully:", data);
            return `${data.message || "Bet placed successfully"}`;
          },
          error: (error) => {
            console.error("Bet API error:", error);
            return error.message || "Bowler runs bet placement failed";
          },
        }
      );
    } catch (error) {
      console.error("Bet placement exception:", error);
      
      // Provide detailed error for debugging
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack } 
        : { message: "Unknown error", error };
      
      console.error("Detailed error information:", errorDetails);
      
      toast.error("Bet Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      console.log("Bet placement process completed");
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
                {selectedPlayer.teamName && (
                  <div className="text-gray-800 mb-2">
                    <span className="font-semibold">Team:</span> {selectedPlayer.teamName}
                  </div>
                )}
                <div className="text-gray-800">
                  <span className="font-semibold">Predicted Runs:</span> {selectedPlayer.runsConceded}
                </div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-2">Bet Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const newAmount = Number(e.target.value);
                  setAmount(newAmount);
                  console.log(`Bet amount updated: ${newAmount}`);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-lg font-medium"
                min={100}
                max={200000}
                disabled={isProcessing}
              />

              <div className="grid grid-cols-5 gap-2 mb-6">
                {[1000, 2000, 5000, 10000, 20000].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setAmount(val);
                      console.log(`Quick amount selected: ${val}`);
                    }}
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
                    onClick={() => {
                      setAmount(val);
                      console.log(`Quick amount selected: ${val}K`);
                    }}
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
              
              {/* Debug Information Panel */}
              {debugInfo && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-700">Debug Information</h3>
                    <button 
                      onClick={() => {
                        console.log("Debug info copied to clipboard:", debugInfo);
                        navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                        toast.success("Debug info copied to clipboard");
                      }}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                    <div><span className="text-blue-600">Status:</span> {debugInfo.status}</div>
                    <div><span className="text-blue-600">Time:</span> {debugInfo.timestamp}</div>
                    <div><span className="text-blue-600">Duration:</span> {debugInfo.duration}ms</div>
                    {debugInfo.response?.message && (
                      <div><span className="text-blue-600">Message:</span> {debugInfo.response.message}</div>
                    )}
                    {debugInfo.response?.bet && (
                      <div><span className="text-blue-600">Bet ID:</span> {debugInfo.response.bet._id || debugInfo.response.bet.id}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Popup Dialog */}
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
              <p className="text-gray-600 mb-6">Your bowler runs bet has been placed successfully and can be viewed in your bet history.</p>
              
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

export default BowlerRunsCard;