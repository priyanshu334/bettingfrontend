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
  // Get auth information from the store
  const { token, user, updateUserBalance } = useAuthStore();
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<BetChoice | "">("");
  const [selectedOdds, setSelectedOdds] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // New state for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const handleOddsClick = (option: Option, choice: BetChoice, odds: number) => {
    setSelectedOption(option)
    setSelectedChoice(choice);
    setSelectedOdds(odds);
    setError(null);
  };
  const closeModal = () => {
    setSelectedOption(null);
    setSelectedChoice("");
    setSelectedOdds(null);
    setAmount(100);
    setError(null);
  };

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };
  // New function to navigate to bets page
  const navigateToBets = () => {
    // You would implement navigation to your bets page here
    // Example: router.push('/my-bets');
    window.location.href = '/my-bets'; // Simple navigation
    closeSuccessPopup();
  };
  const handleAmountQuickSelect = (value: number) => {
    setAmount(prev => Math.min(prev + value, 200000));
  };
  const handlePlaceBet = async () => {
    // Check if user is authenticated
    if (!token || !user) {
      setError("You must be logged in to place a bet");
      return;
    }
    if (!selectedOption || !selectedOdds) {
      setError("Missing required information");
      return;
    }

    if (amount < 100 || amount > 200000) {
      setError("Amount must be between ₹100 and ₹200,000");
      return;
    }
    // Check if user has sufficient balance
    if (user.money < amount) {
      setError("Insufficient balance");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const betCondition = selectedChoice === "Yes" ? "true" : "false";
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await axios.post(

        `${process.env.NEXT_PUBLIC_API_URL}/api/RunsAndWickets/place`,
        {
          userId: user._id,
          matchId,
          teamId,
          marketType: selectedOption.marketType,
          betCondition,
          overs: selectedOption.overs,
          statType: selectedOption.statType,
          odds: selectedOdds,
          amount
        },
        config
      );
      if (response.data.message === "Bet placed successfully") {
        // Update user balance in the store
        updateUserBalance(user.money - amount);
        // Close betting modal
        closeModal();
        // Show success popup
        setShowSuccessPopup(true);
      } else {
        setError(response.data.message || "Failed to place bet");
      }
    } catch (err: any) {
      console.error("Error placing bet:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to place bet"
        );
      }
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
                className={`py-3 cursor-pointer transition-colors ${selectedOption === option && selectedChoice === "No"
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
                className={`py-3 cursor-pointer transition-colors ${selectedOption === option && selectedChoice === "Yes"
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
      {/* Bet Placement Modal */}
      {selectedOption && selectedOdds !== null && (
        <div className="fixed inset-0 z-50 text-black bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-pink-100 rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-xl font-bold text-gray-700 hover:text-red-600 transition-colors"
              disabled={isLoading}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-red-900">Place Bet</h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Option:</span>
                <span className="font-medium">{selectedOption.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Choice:</span>
                <span className={`font-medium ${selectedChoice === "Yes" ? "text-blue-600" : "text-red-600"
                  }`}>
                  {selectedChoice}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Odds:</span>
                <span className="font-medium">{selectedOdds.toFixed(2)}</span>
              </div>
              {user && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Your Balance:</span>
                  <span className="font-medium">₹{user.money.toLocaleString()}</span>
              </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  const value = Math.max(100, Math.min(200000, Number(e.target.value) || 100));
                  setAmount(value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={100}
                max={200000}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1000, 2000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  onClick={() => handleAmountQuickSelect(val)}
                  disabled={isLoading}
                  className="bg-orange-300 text-white py-2 rounded font-semibold text-sm hover:bg-orange-400 disabled:opacity-50"
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>
            <div className="mb-4 p-3 bg-green-100 rounded">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Potential Return:</span>
                <span className="font-bold text-green-700">₹{(amount * 2).toFixed(2)}</span>
              </div>
            </div>
            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            {!token && (
              <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded text-sm">
                Please log in to place a bet
              </div>
            )}
            <div className="flex justify-between gap-3">
              <button
                onClick={handlePlaceBet}
                disabled={isLoading || !token}
                className={`flex-1 py-3 rounded font-semibold transition-colors ${isLoading || !token
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
                className="flex-1 bg-red-500 text-white py-3 rounded hover:bg-red-600 font-semibold disabled:opacity-50"
              >
                Cancel
              </button></div>
          </div></div>
      )}

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
                </svg></div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Bet Placed Successfully!</h2>
              <p className="text-gray-600 mb-6">Your bet has been placed and can be viewed in your bet history.</p>
              <div className="flex gap-4">
                <button
                  onClick={navigateToBets}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  See Bets
                </button>
                <button
                  onClick={closeSuccessPopup}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors">
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
export default RunsOptionsCard;