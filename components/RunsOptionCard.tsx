"use client";

import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore"; // Import the auth store

export type MarketType = "runs" | "wickets" | "fours" | "sixes" | "match" | "tied" | string;
export type StatType = "total" | "highest" | "individual" | string;
export type BetChoice = "Yes" | "No";

export interface Option {
  label: string;
  noOdds: number;
  yesOdds: number;
  marketType: MarketType;
  statType?: StatType;
  overs?: string;
}

interface RunsOptionsCardProps {
  heading: string;
  options: Option[];
  matchId: number;
  teamId: number;
  isLoading?: boolean;
}

const RunsOptionsCard: React.FC<RunsOptionsCardProps> = ({ 
  heading, 
  options, 
  matchId, 
  teamId, 
  isLoading: propsLoading = false
}) => {
  // Get auth data from store
  const { user, token, isAuthenticated } = useAuthStore();
  
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<BetChoice | "">("");
  const [selectedOdds, setSelectedOdds] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);

  const handleOddsClick = (option: Option, choice: BetChoice, odds: number) => {
    setSelectedOption(option);
    setSelectedChoice(choice);
    setSelectedOdds(odds);
    setError(null);
    // Calculate potential winnings
    setPotentialWinnings(amount * odds);
  };

  const closeModal = () => {
    setSelectedOption(null);
    setSelectedChoice("");
    setSelectedOdds(null);
    setAmount(100);
    setError(null);
    setPotentialWinnings(0);
  };

  const handleAmountQuickSelect = (value: number) => {
    const newAmount = Math.min(amount + value, 200000);
    setAmount(newAmount);
    // Update potential winnings when amount changes
    if (selectedOdds) {
      setPotentialWinnings(newAmount * selectedOdds);
    }
  };

  const handleAmountChange = (value: number) => {
    const validAmount = Math.max(100, Math.min(200000, value || 100));
    setAmount(validAmount);
    // Update potential winnings when amount changes
    if (selectedOdds) {
      setPotentialWinnings(validAmount * selectedOdds);
    }
  };

  const handlePlaceBet = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user || !token) {
      setError("Please login to place bets");
      return;
    }

    if (!selectedOption || !selectedOdds || !matchId || !teamId) {
      setError("Missing required information");
      return;
    }

    if (amount < 100 || amount > 200000) {
      setError("Amount must be between ₹100 and ₹200,000");
      return;
    }

    // Check user balance
    if (user.money < amount) {
      setError("Insufficient balance");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine bet condition based on choice
      const betCondition = selectedChoice === "Yes" ? "true" : "false";
      
      const response = await axios.post("/api/RunsAndWickets/place", {
        userId: user._id,
        matchId,
        teamId,
        marketType: selectedOption.marketType,
        betCondition,
        overs: selectedOption.overs,
        statType: selectedOption.statType,
        odds: selectedOdds,
        amount
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.message === "Bet placed successfully") {
        // Update user balance in store
        useAuthStore.getState().updateUserBalance(user.money - amount);
        closeModal();
        // Add toast notification here if you have a toast system
      } else {
        setError(response.data.message || "Failed to place bet");
      }
    } catch (err: any) {
      console.error("Error placing bet:", err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.message || 
        "Failed to place bet"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg w-full overflow-hidden border border-gray-200">
        {/* Heading Bar */}
        <div className="bg-orange-200 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-3 text-center text-sm font-semibold border-b border-gray-300">
          <div className="text-left px-4 py-2 col-span-1 bg-gray-50">Normal</div>
          <div className="bg-red-500 text-white py-2">No</div>
          <div className="bg-blue-500 text-white py-2">Yes</div>
        </div>

        {/* Loading state for options */}
        {propsLoading ? (
          <div className="p-4 text-center">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Table Rows */
          options.map((option, index) => (
            <div
              key={index}
              className="grid grid-cols-3 text-center items-center border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {/* Label */}
              <div className="text-left px-4 py-3 text-sm font-medium text-gray-700 bg-white">
                {option.label}
              </div>

              {/* No Odds */}
              <div
                className={`py-3 cursor-pointer transition-colors ${
                  selectedOption === option && selectedChoice === "No"
                    ? "bg-red-300"
                    : "bg-red-100 hover:bg-red-200"
                }`}
                onClick={() => handleOddsClick(option, "No", option.noOdds)}
              >
                <div className="text-lg font-bold text-red-700">{option.noOdds.toFixed(2)}</div>
                <div className="text-xs text-gray-600">100</div>
              </div>

              {/* Yes Odds */}
              <div
                className={`py-3 cursor-pointer transition-colors ${
                  selectedOption === option && selectedChoice === "Yes"
                    ? "bg-blue-300"
                    : "bg-blue-100 hover:bg-blue-200"
                }`}
                onClick={() => handleOddsClick(option, "Yes", option.yesOdds)}
              >
                <div className="text-lg font-bold text-blue-700">{option.yesOdds.toFixed(2)}</div>
                <div className="text-xs text-gray-600">100</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Improved Bet Placement Modal */}
      {selectedOption && selectedOdds !== null && (
        <div className="fixed inset-0 z-50 text-black bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-400 to-red-500 px-6 py-4 text-white">
              <h2 className="text-xl font-bold text-center">Place Bet</h2>
            </div>
            
            <div className="p-6">
              {/* Bet Details */}
              <div className="mb-5 space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Option:</span>
                  <span className="font-medium">{selectedOption.label}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Choice:</span>
                  <span className={`font-medium ${
                    selectedChoice === "Yes" ? "text-blue-600" : "text-red-600"
                  }`}>
                    {selectedChoice}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Odds:</span>
                  <span className="font-medium">{selectedOdds.toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t pt-2 border-gray-200">
                  <span className="text-sm text-gray-600">Your Balance:</span>
                  <span className="font-medium">₹{user?.money?.toLocaleString() || "0"}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={100}
                    max={200000}
                    disabled={isLoading}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">Min: ₹100 | Max: ₹200,000</div>
              </div>

              {/* Quick Selection Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1000, 2000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAmountQuickSelect(val)}
                    disabled={isLoading}
                    className="bg-orange-500 text-white py-2 rounded font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    +{val / 1000}k
                  </button>
                ))}
              </div>

              {/* Potential Winnings */}
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Potential Winnings:</span>
                  <span className="font-bold text-green-600">₹{potentialWinnings.toFixed(2)}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                <button
                  onClick={handlePlaceBet}
                  disabled={isLoading}
                  className={`flex-1 py-3 rounded font-semibold transition-colors ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Placing Bet...
                    </span>
                  ) : (
                    "Place Bet"
                  )}
                </button>
                
                <button
                  onClick={closeModal}
                  disabled={isLoading}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 rounded hover:bg-gray-400 font-semibold disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RunsOptionsCard;