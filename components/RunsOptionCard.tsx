"use client";

import React, { useState, useEffect } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
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

interface User {
  _id: string;
  money: number;
  // Add other user properties as needed
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  updateUserBalance: (newBalance: number) => void;
}

interface BetPayload {
  userId: string;
  matchId: number;
  teamId: number;
  marketType: MarketType;
  betCondition: string;
  overs?: string;
  statType?: StatType;
  odds: number;
  amount: number;
}

interface ApiResponse {
  message: string;
  error?: string;
  betId?: string;
  // Add other response properties as needed
}

type DebugInfoType = 
  | { type: "validation_error"; message: string; validationTest?: ValidationTest }
  | { 
      endpoint: string; 
      method: string; 
      headers: Record<string, string>; 
      payload: BetPayload; 
      status: "pending" | "success"; 
      response?: ApiResponse;
      validationTest?: ValidationTest;
    }
  | { 
      type: "api_error"; 
      error: {
        message: string;
        response: {
          status: number;
          statusText: string;
          data: any;
        } | null;
        request: any;
      };
      validationTest?: ValidationTest;
    };

interface ValidationTest {
  passed: boolean;
  message: string;
}

const RunsOptionsCard: React.FC<RunsOptionsCardProps> = ({ 
  heading, 
  options, 
  matchId, 
  teamId, 
  isLoading: propsLoading = false
}) => {
  // Get auth data from store
  const { user, token, isAuthenticated, updateUserBalance } = useAuthStore() as AuthStore;
  
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<BetChoice | "">("");
  const [selectedOdds, setSelectedOdds] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<DebugInfoType | null>(null);
  const [showDebugModal, setShowDebugModal] = useState<boolean>(false);

  // Add useEffect to log props and state for debugging
  useEffect(() => {
    console.log("RunsOptionsCard Props:", { heading, options, matchId, teamId });
    console.log("Auth State:", { 
      isAuthenticated, 
      user: user ? { 
        _id: user._id, 
        money: user.money, 
        // Hide sensitive info in logs
        token: token ? "[REDACTED]" : null 
      } : null 
    });
  }, [heading, options, matchId, teamId, isAuthenticated, user, token]);

  const handleOddsClick = (option: Option, choice: BetChoice, odds: number): void => {
    console.log("Odds clicked:", { option, choice, odds });
    setSelectedOption(option);
    setSelectedChoice(choice);
    setSelectedOdds(odds);
    setError(null);
    // Calculate potential winnings
    const calculatedWinnings: number = amount * odds;
    console.log("Calculated winnings:", calculatedWinnings);
    setPotentialWinnings(calculatedWinnings);
  };

  const closeModal = (): void => {
    setSelectedOption(null);
    setSelectedChoice("");
    setSelectedOdds(null);
    setAmount(100);
    setError(null);
    setPotentialWinnings(0);
    setDebugInfo(null);
    setShowDebugModal(false);
  };

  const handleAmountQuickSelect = (value: number): void => {
    const newAmount: number = Math.min(amount + value, 200000);
    console.log("Quick select amount:", newAmount);
    setAmount(newAmount);
    // Update potential winnings when amount changes
    if (selectedOdds) {
      setPotentialWinnings(newAmount * selectedOdds);
    }
  };

  const handleAmountChange = (value: number): void => {
    const validAmount: number = Math.max(100, Math.min(200000, value || 100));
    console.log("Amount changed to:", validAmount);
    setAmount(validAmount);
    // Update potential winnings when amount changes
    if (selectedOdds) {
      setPotentialWinnings(validAmount * selectedOdds);
    }
  };

  const validateBet = (): string | null => {
    // Validate all required fields are present
    if (!isAuthenticated || !user || !token) {
      return "Authentication required. Please login to place bets.";
    }

    if (!selectedOption) {
      return "No option selected.";
    }

    if (!selectedChoice) {
      return "No choice (Yes/No) selected.";
    }

    if (!selectedOdds) {
      return "No odds selected.";
    }

    if (!matchId) {
      return "Match ID is missing.";
    }

    if (!teamId) {
      return "Team ID is missing.";
    }

    if (amount < 100 || amount > 200000) {
      return `Amount must be between ₹100 and ₹200,000. Current amount: ₹${amount}`;
    }

    // Check user balance
    if (user.money < amount) {
      return `Insufficient balance. You have ₹${user.money}, but trying to bet ₹${amount}`;
    }

    return null; // No error
  };

  const toggleDebugModal = (): void => {
    setShowDebugModal(prev => !prev);
  };

  const handlePlaceBet = async (): Promise<void> => {
    // First run validation
    const validationError: string | null = validateBet();
    if (validationError) {
      console.error("Validation Error:", validationError);
      setError(validationError);
      setDebugInfo({ type: "validation_error", message: validationError });
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log("Attempting to place bet...");

    try {
      // Type safety: Ensure all required values are present (should be covered by validation)
      if (!user || !selectedOption || !selectedOdds) {
        throw new Error("Missing required data for bet placement");
      }

      // Determine bet condition based on choice
      const betCondition: string = selectedChoice === "Yes" ? "true" : "false";
      
      // Create request payload with proper types
      const payload: BetPayload = {
        userId: user._id,
        matchId,
        teamId,
        marketType: selectedOption.marketType,
        betCondition,
        odds: selectedOdds,
        amount
      };

      // Add optional fields if they exist
      if (selectedOption.overs) {
        payload.overs = selectedOption.overs;
      }

      if (selectedOption.statType) {
        payload.statType = selectedOption.statType;
      }

      // Log request details before sending
      console.log("Bet request payload:", payload);
      console.log("Authentication token present:", !!token);

      // Debug info to display in UI
      const requestDebugInfo: Omit<DebugInfoType, 'type'> & { 
        endpoint: string; 
        method: string; 
        headers: Record<string, string>; 
        payload: BetPayload; 
        status: "pending" | "success";
      } = {
        endpoint: `${[process.env.NEXT_PUBLIC_API_URL]}/api/RunsAndWickets/place`,
        method: "POST",
        headers: { Authorization: `Bearer ${token ? "valid_token" : "missing_token"}` },
        payload,
        status: "pending"
      };

      setDebugInfo(requestDebugInfo);

      const response: AxiosResponse<ApiResponse> = await axios.post<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/RunsAndWickets/place`, 

        payload, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("API Response:", response.data);
      
      setDebugInfo({
        ...requestDebugInfo,
        status: "success",
        response: response.data
      });

      if (response.data.message === "Bet placed successfully") {
        // Update user balance in store
        const newBalance: number = user.money - amount;
        console.log("Updating user balance:", { oldBalance: user.money, newBalance });
        
        // Update the balance in the store
        updateUserBalance(newBalance);
        
        // Add success message
        setError(null);
        
        // Close modal after short delay to show success
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        console.error("API returned error:", response.data);
        setError(response.data.message || "Failed to place bet");
      }
    } catch (err: unknown) {
      // Proper type narrowing for Axios errors
      const axiosError = err as AxiosError<ApiResponse>;
      console.error("Error placing bet:", axiosError);
      
      // Enhanced error logging with proper TypeScript
      const errorDetails = {
        message: axiosError.message,
        response: axiosError.response ? {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          data: axiosError.response.data
        } : null,
        request: axiosError.request ? "Request was made but no response received" : null
      };
      
      console.error("Detailed error:", errorDetails);
      
      setDebugInfo({
        type: "api_error",
        error: errorDetails
      });
      
      // Extract error message from response if possible
      setError(
        axiosError.response?.data?.error || 
        axiosError.response?.data?.message || 
        axiosError.message || 
        "Failed to place bet"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to run validation check and update debug info
  const runValidationCheck = (): void => {
    const validationResult = validateBet();
    const validationTest: ValidationTest = validationResult 
      ? { passed: false, message: validationResult }
      : { passed: true, message: "All validation checks passed" };

    // Update debug info with validation test result
    if (debugInfo) {
      setDebugInfo({
        ...debugInfo,
        validationTest
      });
    } else {
      setDebugInfo({
        type: "validation_error",
        message: "Manual validation check",
        validationTest
      });
    }
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg w-full overflow-hidden border border-gray-200">
        {/* Heading Bar */}
        <div className="bg-orange-200 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300 flex justify-between items-center">
          <span>{heading}</span>
          {/* Debug button only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={toggleDebugModal}
              className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-800"
            >
              Debug
            </button>
          )}
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

      {/* Bet Placement Modal */}
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

              {/* Success Message */}
              {debugInfo && 'status' in debugInfo && debugInfo.status === "success" && !error && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  Bet placed successfully!
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

              {/* Debug Toggle (Only in development) */}
              {process.env.NODE_ENV === 'development' && debugInfo && (
                <div className="mt-4 text-xs">
                  <button 
                    onClick={toggleDebugModal}
                    className="text-blue-600 underline"
                  >
                    {showDebugModal ? "Hide Debug Info" : "Show Debug Info"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {showDebugModal && debugInfo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-3/4 overflow-hidden flex flex-col">
            <div className="bg-gray-800 px-6 py-3 text-white flex justify-between items-center">
              <h3 className="font-bold">Debug Information</h3>
              <button 
                onClick={toggleDebugModal}
                className="text-white hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {/* Auth Status */}
                <div className="border rounded p-3">
                  <h4 className="font-bold text-sm mb-2">Authentication Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Is Authenticated:</div>
                    <div className={isAuthenticated ? "text-green-600" : "text-red-600"}>
                      {isAuthenticated ? "Yes" : "No"}
                    </div>
                    
                    <div>User ID:</div>
                    <div>{user?._id || "Not available"}</div>
                    
                    <div>Token:</div>
                    <div>{token ? "Present" : "Missing"}</div>
                    
                    <div>Balance:</div>
                    <div>₹{user?.money?.toLocaleString() || "0"}</div>
                  </div>
                </div>
                
                {/* Bet Details */}
                <div className="border rounded p-3">
                  <h4 className="font-bold text-sm mb-2">Bet Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Match ID:</div>
                    <div>{matchId || "Missing"}</div>
                    
                    <div>Team ID:</div>
                    <div>{teamId || "Missing"}</div>
                    
                    <div>Market Type:</div>
                    <div>{selectedOption?.marketType || "Not selected"}</div>
                    
                    <div>Stat Type:</div>
                    <div>{selectedOption?.statType || "N/A"}</div>
                    
                    <div>Overs:</div>
                    <div>{selectedOption?.overs || "N/A"}</div>
                    
                    <div>Choice:</div>
                    <div>{selectedChoice || "Not selected"}</div>
                    
                    <div>Odds:</div>
                    <div>{selectedOdds || "Not selected"}</div>
                    
                    <div>Amount:</div>
                    <div>₹{amount}</div>
                  </div>
                </div>
                
                {/* API Request */}
                {'type' in debugInfo ? 
                  debugInfo.type !== "validation_error" && (
                    <div className="border rounded p-3">
                      <h4 className="font-bold text-sm mb-2">API Request</h4>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="border rounded p-3">
                      <h4 className="font-bold text-sm mb-2">API Request</h4>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </div>
                  )
                }
                
                {/* Error Details */}
                {'type' in debugInfo && debugInfo.type === "api_error" && debugInfo.error && (
                  <div className="border border-red-300 rounded p-3 bg-red-50">
                    <h4 className="font-bold text-sm mb-2 text-red-700">Error Details</h4>
                    <pre className="bg-red-100 p-2 rounded text-xs overflow-auto max-h-40 text-red-800">
                      {JSON.stringify(debugInfo.error, null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Validation Errors */}
                {'type' in debugInfo && debugInfo.type === "validation_error" && (
                  <div className="border border-yellow-300 rounded p-3 bg-yellow-50">
                    <h4 className="font-bold text-sm mb-2 text-yellow-800">Validation Error</h4>
                    <div className="text-yellow-800">
                      {debugInfo.message}
                    </div>
                  </div>
                )}

                {/* Run Validation Test */}
                <div className="border rounded p-3">
                  <h4 className="font-bold text-sm mb-2">Validation Test</h4>
                  <button
                    onClick={runValidationCheck}
                    className="bg-blue-500 text-white text-xs py-1 px-3 rounded"
                  >
                    Run Validation Check
                  </button>
                  
                  {debugInfo.validationTest && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      debugInfo.validationTest.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {debugInfo.validationTest.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 px-4 py-3 flex justify-end">
              <button
                onClick={toggleDebugModal}
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RunsOptionsCard;