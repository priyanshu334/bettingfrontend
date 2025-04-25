"use client";

import React, { useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore"; // Import the auth store

// --- Types (Aligned with MatchDetails) ---
export type MarketType = "runs" | "wickets" | "totals" | string; // Adjusted based on your example

// Define the enhanced option type expected from MatchDetails
export interface EnhancedRunsOptionsOption {
  id: number; // Added id assuming it's passed
  label: string;
  noOdds: number;
  yesOdds: number;
  marketType: MarketType;
  teamId?: number; // Optional: ID of the team this option applies to
  overMilestone?: number; // Optional: Over number (e.g., 1, 6, 10, 15, 20)
  // Add other fields if needed, like statType, overs string if different from overMilestone
  statType?: string;
  overs?: string; // Can keep this if your API requires it separately
}

export type BetChoice = "Yes" | "No";

interface RunsOptionsCardProps {
  heading: string;
  options: EnhancedRunsOptionsOption[]; // Use the enhanced type
  matchId: number;
  // teamId: number; // This might not be needed if options have teamId
  isLoading?: boolean;
  // --- New props for live state ---
  currentBattingTeamId?: number;
  currentOver?: number; // e.g., 5.2 means 5 overs and 2 balls completed
}

const RunsOptionsCard: React.FC<RunsOptionsCardProps> = ({
  heading,
  options,
  matchId,
  // teamId, // Prop removed, assuming team info is in options
  isLoading: propsLoading = false,
  // --- Destructure new props ---
  currentBattingTeamId,
  currentOver,
}) => {
  // Get auth information from the store
  const { token, user, updateUserBalance } = useAuthStore();

  const [selectedOption, setSelectedOption] = useState<EnhancedRunsOptionsOption | null>(null); // Use enhanced type
  const [selectedChoice, setSelectedChoice] = useState<BetChoice | "">("");
  const [selectedOdds, setSelectedOdds] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleOddsClick = (option: EnhancedRunsOptionsOption, choice: BetChoice, odds: number) => { // Use enhanced type
    // This function is now only called for non-disabled options
    setSelectedOption(option);
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

  const navigateToBets = () => {
    window.location.href = '/my-bets';
    closeSuccessPopup();
  };

  const handleAmountQuickSelect = (value: number) => {
    setAmount(prev => Math.min(prev + value, 200000));
  };

  const handlePlaceBet = async () => {
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
    if (user.money < amount) {
      setError("Insufficient balance");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const betCondition = selectedChoice === "Yes" ? "true" : "false";
      const config = { headers: { 'Authorization': `Bearer ${token}` } };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/RunsAndWickets/place`,
        {
          userId: user._id,
          matchId,
          // *** Use teamId from the selected option if available, otherwise fallback or handle error ***
          teamId: selectedOption.teamId, // Important: Ensure API accepts potentially undefined teamId or handle appropriately
          marketType: selectedOption.marketType,
          betCondition,
          // Use specific 'overs' string if needed by API, otherwise rely on marketType/overMilestone
          overs: selectedOption.overs || selectedOption.overMilestone?.toString(),
          statType: selectedOption.statType,
          odds: selectedOdds,
          amount,
          // Pass option label or ID if useful for logging/tracking
          optionLabel: selectedOption.label,
          optionId: selectedOption.id,
        },
        config
      );

      if (response.data.message === "Bet placed successfully") {
        updateUserBalance(user.money - amount);
        closeModal();
        setShowSuccessPopup(true);
      } else {
        setError(response.data.message || "Failed to place bet");
      }
    } catch (err: any) {
      console.error("Error placing bet:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to place bet");
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
          // ... Loading skeleton ...
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
          options.map((option) => {
            // --- Calculate if the option should be disabled ---
            const isDisabled = (() => {
              // Can't disable if live state or option details are missing
              if (option.teamId === undefined || option.overMilestone === undefined ||
                  currentBattingTeamId === undefined || currentOver === undefined) {
                return false;
              }
              // Disable if it's for the current batting team AND the over milestone has passed/been reached
              // Use Math.floor() because e.g. 5.2 overs means the 6th over is in progress,
              // so the 1-over and 6-over markets should be disabled.
              return option.teamId === currentBattingTeamId && Math.floor(currentOver) >= option.overMilestone;
            })();

            return (
              <div
                key={option.id} // Use unique ID from option
                className={`grid grid-cols-3 text-center items-center border-b border-gray-100 transition-colors ${
                  isDisabled
                    ? 'opacity-60 bg-gray-100 cursor-not-allowed' // Style disabled rows
                    : 'hover:bg-gray-50' // Only allow hover if not disabled
                }`}
              >
                {/* Label */}
                <div className={`text-left px-4 py-3 text-sm font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-700'} bg-white`}>
                  {option.label}
                </div>

                {/* No Odds Button */}
                <div
                  className={`py-3 transition-colors ${
                    isDisabled
                      ? 'bg-red-50' // Dimmed disabled background
                      : `cursor-pointer ${ // Add cursor-pointer only if enabled
                          selectedOption === option && selectedChoice === "No"
                            ? "bg-red-300" // Selected style
                            : "bg-red-100 hover:bg-red-200" // Default enabled style
                        }`
                  }`}
                  // Conditionally attach onClick handler
                  onClick={!isDisabled ? () => handleOddsClick(option, "No", option.noOdds) : undefined}
                >
                  <div className={`text-lg font-bold ${isDisabled ? 'text-red-400' : 'text-red-700'}`}>
                    {option.noOdds.toFixed(2)}
                  </div>
                  <div className={`text-xs ${isDisabled ? 'text-gray-500' : 'text-gray-600'}`}>100</div> {/* Example stake */}
                </div>

                {/* Yes Odds Button */}
                <div
                   className={`py-3 transition-colors ${
                    isDisabled
                      ? 'bg-blue-50' // Dimmed disabled background
                      : `cursor-pointer ${ // Add cursor-pointer only if enabled
                          selectedOption === option && selectedChoice === "Yes"
                            ? "bg-blue-300" // Selected style
                            : "bg-blue-100 hover:bg-blue-200" // Default enabled style
                        }`
                  }`}
                  // Conditionally attach onClick handler
                  onClick={!isDisabled ? () => handleOddsClick(option, "Yes", option.yesOdds) : undefined}
                >
                  <div className={`text-lg font-bold ${isDisabled ? 'text-blue-400' : 'text-blue-700'}`}>
                    {option.yesOdds.toFixed(2)}
                  </div>
                   <div className={`text-xs ${isDisabled ? 'text-gray-500' : 'text-gray-600'}`}>100</div> {/* Example stake */}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bet Placement Modal (remains mostly the same) */}
      {selectedOption && selectedOdds !== null && (
         // ... Modal JSX ...
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
                {/* ... display option, choice, odds, balance ... */}
                 <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Option:</span>
                    <span className="font-medium">{selectedOption.label}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Choice:</span>
                    <span className={`font-medium ${selectedChoice === "Yes" ? "text-blue-600" : "text-red-600"}`}>
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

              {/* Amount Input */}
              <div className="mb-4">
                 {/* ... amount input label and field ... */}
                 <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                 <input
                   type="number"
                   value={amount}
                   onChange={(e) => {
                     const value = Math.max(100, Math.min(200000, Number(e.target.value) || 100));
                     setAmount(value);
                   }}
                   className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   min={100} max={200000} disabled={isLoading}
                 />
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {/* ... quick select buttons ... */}
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

              {/* Potential Winnings */}
              <div className="mb-4 p-3 bg-green-100 rounded">
                {/* ... potential return display ... */}
                 <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Potential Return:</span>
                    <span className="font-bold text-green-700">₹{(amount * selectedOdds).toFixed(2)}</span>
                 </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
              )}

              {/* Login Prompt */}
              {!token && (
                <div className="mb-4 p-2 bg-yellow-100 text-yellow-700 rounded text-sm">Please log in to place a bet</div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                 {/* ... place bet and cancel buttons ... */}
                  <button
                    onClick={handlePlaceBet}
                    disabled={isLoading || !token}
                    className={`flex-1 py-3 rounded font-semibold transition-colors ${
                      isLoading || !token
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {isLoading ? ( <span className="flex items-center justify-center"> ... Loading ... </span> ) : ( "Place Bet" )}
                  </button>
                  <button
                    onClick={closeModal}
                    disabled={isLoading}
                    className="flex-1 bg-red-500 text-white py-3 rounded hover:bg-red-600 font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
              </div>
            </div>
          </div>
      )}

      {/* Success Popup (remains the same) */}
      {showSuccessPopup && (
        // ... Success Popup JSX ...
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
                {/* ... Close button, icon, message, action buttons ... */}
                 <button onClick={closeSuccessPopup} className="...">×</button>
                 <div className="text-center">
                    <div className="... success icon wrapper ...">... SVG ...</div>
                    <h2 className="...">Bet Placed Successfully!</h2>
                    <p className="...">Your bet has been placed...</p>
                    <div className="flex gap-4">
                      <button onClick={navigateToBets} className="...">See Bets</button>
                      <button onClick={closeSuccessPopup} className="...">Continue Betting</button>
                    </div>
                 </div>
             </div>
          </div>
      )}
    </>
  );
};

export default RunsOptionsCard;