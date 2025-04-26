// File: /components/match-card/MatchCard.tsx
"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import BetDialog from "./BetDilouge";
import SuccessDialog from "./SuccessDialog";
import TeamOddsTable from "./TeamOddsTable";
import WinPredictionGrid from "./WinPredictionGrid";
import UserBalanceDisplay from "./UserBalanceDisplay";
import SectionHeader from "./SectionHeader";

export type TeamOdds = {
  team: string;
  teamId: string;
  back: string;
  lay: string;
  stake: string;
};

export type BookmakerOdds = TeamOdds;
export type TossOdds = TeamOdds;

export type WinPrediction = {
  team: string;
  teamId: string;
  odds: string;
};

export type MatchOddsProps = {
  matchOdds: TeamOdds[];
  bookmakerOdds: BookmakerOdds[];
  tossOdds: TossOdds[];
  winPrediction: WinPrediction[];
  matchId: number;
  hideToss: boolean;
};

interface BetResponse {
  message: string;
  newBalance?: number;
  error?: string;
  bet?: any;
}

const MatchCard: React.FC<MatchOddsProps> = ({ 
  matchOdds, 
  bookmakerOdds, 
  tossOdds, 
  winPrediction,
  matchId
}) => {
  // Get user authentication data from Zustand store
  const { user, token, updateUserBalance } = useAuthStore();
  const userId = user?._id;

  const [showBetDialog, setShowBetDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBetData, setCurrentBetData] = useState({
    title: "",
    stake: "",
    odds: "",
    marketType: "",
    betType: "",
    teamId: ""
  });
  
  // Add state for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handlePlaceBet = async (amount: string) => {
    if (!userId || !matchId) {
      toast.error("Authentication required", {
        description: "Please login to place bets"
      });
      return;
    }
    
    setIsProcessing(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/matchdata/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          matchId,
          teamId: currentBetData.teamId,
          marketType: currentBetData.marketType,
          betType: currentBetData.betType,
          odds: parseFloat(currentBetData.odds),
          amount: parseInt(amount)
        })
      });

      const data: BetResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place bet");
      }

      // Update user balance in the store if provided in response
      if (data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      } else if (user) {
        // If server doesn't return new balance, calculate locally
        const newBalance = user.money - parseInt(amount);
        updateUserBalance(newBalance);
      }

      toast.success(data.message || "Bet placed successfully", {
        description: data.newBalance !== undefined ? 
          `New balance: ₹${data.newBalance}` : 
          `Bet ID: ${data.bet?._id}`
      });
      
      // Close the bet dialog
      setShowBetDialog(false);
      
      // Show success popup
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error("Bet Error:", error);
      toast.error("Bet Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openBetDialog = (
    title: string,
    stake: string,
    odds: string,
    marketType: string,
    betType: string,
    teamId: string
  ) => {
    // Check if user is logged in before opening bet dialog
    if (!userId) {
      toast.error("Authentication required", {
        description: "Please login to place bets"
      });
      return;
    }
    
    setCurrentBetData({
      title,
      stake,
      odds,
      marketType,
      betType,
      teamId
    });
    setShowBetDialog(true);
  };
  
  // Close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };
  
  // Navigate to bets page
  const navigateToBets = () => {
    window.location.href = '/my-bets';
    closeSuccessPopup();
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full bg-gray-100">
      <div className="p-4 space-y-6 text-sm bg-gray-50 font-sans shadow-lg rounded-lg w-full">
        {/* Match Odds Section */}
        <div>
          <SectionHeader title="Match Odds" showCashout={true} />
          <TeamOddsTable 
            teams={matchOdds} 
            openBetDialog={openBetDialog} 
            marketType="match_odds" 
          />
        </div>

        {/* Bookmaker Section */}
        <div className="text-black">
          <SectionHeader title="BOOKMAKER" />
          <div className="text-xs text-gray-600 mt-2 mb-2 px-1">Min:100 Max:100k</div>
          <TeamOddsTable 
            teams={bookmakerOdds} 
            openBetDialog={openBetDialog} 
            marketType="bookmaker" 
          />
        </div>

        {/* Toss Section */}
        <div className="text-black">
          <SectionHeader title="TOSS" />
          <div className="text-xs text-gray-600 mt-2 mb-2 px-1">Min:100 Max:500k</div>
          <TeamOddsTable 
            teams={tossOdds} 
            openBetDialog={openBetDialog} 
            marketType="toss" 
            colorScheme="light"
          />
        </div>

        {/* Win Prediction Section */}
        <div className="text-black">
          <SectionHeader title="Who will Win the Match?" />
          <div className="text-xs text-gray-600 mt-2 mb-2 px-1">Min: - Max: 1</div>
          <WinPredictionGrid 
            predictions={winPrediction} 
            openBetDialog={openBetDialog} 
          />
        </div>

        {/* User Balance Display */}
        {user && <UserBalanceDisplay balance={user.money} />}

        {/* Bet Dialog */}
        {showBetDialog && (
          <BetDialog
            title={currentBetData.title}
            currentStake={currentBetData.stake}
            oddsValue={currentBetData.odds}
            onClose={() => setShowBetDialog(false)}
            onPlaceBet={handlePlaceBet}
            isProcessing={isProcessing}
          />
        )}
        
        {/* Success Dialog */}
        {showSuccessPopup && (
          <SuccessDialog
            onClose={closeSuccessPopup}
            navigateToBets={navigateToBets}
          />
        )}
      </div>
    </div>
  );
};

export default MatchCard;