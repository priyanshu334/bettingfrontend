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
  matchId: number | string; // Allow string or number for matchId
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
  const { token, user, isAuthenticated } = useAuthStore();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const handleBetClick = (player: Player) => {
    setSelectedPlayer(player);
    setDebugInfo(null);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
    setDebugInfo(null);
  };

  const logDebugInfo = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage, data);
    
    setDebugInfo(prev => {
      const newInfo = prev 
        ? `${prev}\n${logMessage}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`
        : `${logMessage}${data ? ': ' + JSON.stringify(data, null, 2) : ''}`;
      return newInfo;
    });
  };

  const handlePlaceBet = async () => {
    // Get userId from the auth store
    if (!user || !user._id) {
      logDebugInfo("User ID missing from auth store", { user });
      toast.error("User information not available. Please login again.");
      return;
    }

    const userId = user._id; // Get the actual MongoDB ObjectId from the user object
    
    if (!selectedPlayer) {
      logDebugInfo("Missing selected player", { selectedPlayer });
      toast.error("No bowler selected");
      return;
    }

    if (!matchId) {
      logDebugInfo("Missing match ID", { matchId });
      toast.error("Match ID is missing");
      return;
    }

    // Check if teamName exists
    if (!selectedPlayer.teamName) {
      logDebugInfo("Team name is missing", { selectedPlayer });
      toast.error("Bowler's team name is missing, which is required");
      return;
    }
    
    if (!isAuthenticated || !token) {
      logDebugInfo("Authentication issue", { isAuthenticated, hasToken: !!token });
      toast.error("Please login to place bets");
      return;
    }

    setIsProcessing(true);
    
    // Make sure matchId is treated as a string to prevent JSON parsing issues
    const stringMatchId = String(matchId);
    
    logDebugInfo("Starting bet placement", { 
      userId,
      matchId: stringMatchId,
      bowlerName: selectedPlayer.name,
      teamName: selectedPlayer.teamName,
      predictedRunsConceded: selectedPlayer.runsConceded,
      betAmount: amount
    });

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/bowlerruns/place`;
    logDebugInfo("API URL", apiUrl);

    try {
      const requestBody = {
        userId,
        matchId: stringMatchId, // Send as string to prevent number parsing issues
        teamName: selectedPlayer.teamName, // Ensure this is not undefined
        bowlerName: selectedPlayer.name,
        predictedRunsConceded: selectedPlayer.runsConceded,
        betAmount: amount
      };
      
      logDebugInfo("Request payload", requestBody);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      logDebugInfo("Response status", { status: response.status, statusText: response.statusText });
      
      const responseData: BetResponse = await response.json();
      logDebugInfo("Response data", responseData);

      if (!response.ok) {
        // Extract validation error message from the error string if available
        let errorMessage = responseData.error || responseData.message || "Failed to place bet";
        
        // If it's a validation error, try to make it more user-friendly
        if (errorMessage.includes("validation failed")) {
          if (errorMessage.includes("teamName: Path `teamName` is required")) {
            errorMessage = "Team name is required for this bet.";
          } else if (errorMessage.includes("matchId: Cast to")) {
            errorMessage = "Invalid match ID format.";
          } else {
            // Extract just the validation error part
            const validationMatch = errorMessage.match(/validation failed: (.+?)(?:'|}|$)/);
            if (validationMatch && validationMatch[1]) {
                errorMessage = `Validation error: ${validationMatch[1]}`;
            }
          }
        }
        
        if (response.status === 400 && responseData.message === "Insufficient balance") {
          errorMessage = "Insufficient balance to place this bet";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to place this bet.";
        } else if (response.status === 404) {
          errorMessage = "Bet endpoint not found. Please check API URL.";
        }
        
        logDebugInfo("Error placing bet", { status: response.status, error: errorMessage });
        toast.error("Bet Failed", {
          description: errorMessage
        });
      } else {
        logDebugInfo("Bet placed successfully", responseData);
        toast.success(`${responseData.message}. New balance: ₹${responseData.newBalance}`);
        
        if (responseData.newBalance !== undefined) {
          useAuthStore.getState().updateUserBalance(responseData.newBalance);
        }
        closeModal();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      logDebugInfo("Exception occurred", { error: errorMessage });
      console.error("Bet Error:", error);
      toast.error("Bet Failed", {
        description: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to copy debug info to clipboard
  const copyDebugInfo = () => {
    if (debugInfo) {
      navigator.clipboard.writeText(debugInfo)
        .then(() => toast.success("Debug info copied to clipboard"))
        .catch(err => toast.error("Failed to copy debug info"));
    }
  };

  // Function to check if a player has required fields
  const playerHasRequiredFields = (player: Player): boolean => {
    return !!player.name && !!player.teamName;
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg w-full overflow-hidden border border-gray-200">
        {/* Heading Bar */}
        <div className="bg-red-100 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-5 text-center text-sm font-semibold border-b border-gray-300">
          <div className="text-left px-4 py-2 col-span-2 bg-gray-50">Bowler</div>
          <div className="bg-gray-50 py-2">Team</div>
          <div className="bg-red-500 text-white py-2">Runs</div>
          <div className="bg-blue-500 text-white py-2">Bet</div>
        </div>

        {/* Table Rows */}
        {players.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-5 items-center text-center border-b border-gray-100"
          >
            {/* Name */}
            <div className="text-left px-4 py-3 text-sm font-medium text-gray-700 col-span-2 bg-white capitalize">
              {player.name}
            </div>
            
            {/* Team */}
            <div className="py-3 bg-gray-50 text-gray-700">
              {player.teamName || <span className="text-red-500 text-xs">Missing</span>}
            </div>

            {/* Runs */}
            <div className="py-3 bg-red-50 text-red-700 font-semibold">
              {player.runsConceded}
            </div>

            {/* Bet (fixed 100) */}
            <div className="py-3 bg-blue-50">
              <button
                onClick={() => handleBetClick(player)}
                className={`${
                  playerHasRequiredFields(player) 
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-700" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                } text-sm px-4 py-1 rounded-full font-medium transition`}
                disabled={isProcessing || !isAuthenticated || !playerHasRequiredFields(player)}
                title={!playerHasRequiredFields(player) ? "Missing required player information" : ""}
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
            
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-500">Bowler:</span><br/>
                <span className="font-medium">{selectedPlayer.name}</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-500">Team:</span><br/>
                <span className="font-medium">{selectedPlayer.teamName || <span className="text-red-500">Missing (Required)</span>}</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-500">Predicted Runs:</span><br/>
                <span className="font-medium">{selectedPlayer.runsConceded}</span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-500">Match ID:</span><br/>
                <span className="font-medium">{matchId || <span className="text-red-500">Missing</span>}</span>
              </div>
            </div>
            
            {/* Debug info about authentication state */}
            <div className="text-xs text-gray-600 mb-4 p-2 bg-gray-50 rounded">
              <div>Auth Status: {isAuthenticated ? 'Logged In' : 'Not Logged In'}</div>
              {user && user._id && (
                <div>User ID: {user._id.substring(0, 8)}...</div>
              )}
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

            <div className="flex justify-between gap-3 mb-4">
              <button
                onClick={handlePlaceBet}
                className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 font-semibold disabled:opacity-50"
                disabled={isProcessing || !isAuthenticated || !selectedPlayer.teamName}
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

            {/* Missing Requirements Warning */}
            {(!selectedPlayer.teamName) && (
              <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                <strong>Warning:</strong> Cannot place bet because some required information is missing:
                <ul className="list-disc pl-5 mt-1">
                  {!selectedPlayer.teamName && <li>Team name is required</li>}
                </ul>
              </div>
            )}

            {/* Debug Information Section */}
            {debugInfo && (
              <div className="mt-4 border-t border-gray-300 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Debug Information</h3>
                  <button 
                    onClick={copyDebugInfo}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-black text-green-400 p-2 rounded text-xs h-40 overflow-y-auto font-mono whitespace-pre">
                  {debugInfo}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BowlerRunsCard;