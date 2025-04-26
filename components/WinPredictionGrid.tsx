// File: /components/match-card/WinPredictionGrid.tsx
import React from "react";
import { WinPrediction } from "./MatchCard";

interface WinPredictionGridProps {
  predictions: WinPrediction[];
  openBetDialog: (
    title: string,
    stake: string,
    odds: string,
    marketType: string,
    betType: string,
    teamId: string
  ) => void;
}

const WinPredictionGrid: React.FC<WinPredictionGridProps> = ({ predictions, openBetDialog }) => {
  return (
    <div className="grid grid-cols-2 gap-4 text-center mt-3">
      {predictions.map((item, i) => (
        <div 
          key={i} 
          className="bg-blue-200 p-4 rounded shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
          onClick={() => openBetDialog(
            `Win Prediction - ${item.team}`,
            "100",
            item.odds,
            "winner",
            "back",
            item.teamId
          )}
        >
          <div className="font-semibold text-sm mb-1">{item.team}</div>
          <div className="text-2xl font-bold text-blue-800">{item.odds}</div>
        </div>
      ))}
    </div>
  );
};

export default WinPredictionGrid;