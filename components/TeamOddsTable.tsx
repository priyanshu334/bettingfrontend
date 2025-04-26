// File: /components/match-card/TeamOddsTable.tsx
import React from "react";
import { TeamOdds } from "./MatchCard";

interface TeamOddsTableProps {
  teams: TeamOdds[];
  openBetDialog: (
    title: string,
    stake: string,
    odds: string,
    marketType: string,
    betType: string,
    teamId: string
  ) => void;
  marketType: string;
  colorScheme?: "default" | "light";
}

const TeamOddsTable: React.FC<TeamOddsTableProps> = ({ 
  teams, 
  openBetDialog, 
  marketType,
  colorScheme = "default" 
}) => {
  const getBackColorClass = () => {
    return colorScheme === "light" ? "bg-blue-200 hover:bg-blue-300" : "bg-blue-400 hover:bg-blue-500";
  };

  const getLayColorClass = () => {
    return colorScheme === "light" ? "bg-red-200 hover:bg-red-300" : "bg-red-400 hover:bg-red-500";
  };

  return (
    <div className="border border-gray-300 text-black rounded-md overflow-hidden shadow-sm">
      <div className="grid grid-cols-4 bg-gray-200 text-xs font-bold text-center">
        <span className="col-span-2 py-2">Teams</span>
        <span className="py-2">BACK</span>
        <span className="py-2">LAY</span>
      </div>
      {teams.map((team, i) => (
        <div key={i} className="grid grid-cols-4 border-t text-center text-sm">
          <div className="col-span-2 py-2 px-3 text-left font-medium">{team.team}</div>
          <div 
            className={`${getBackColorClass()} py-2 font-semibold cursor-pointer transition duration-200`}
            onClick={() => openBetDialog(
              `${marketType === "match_odds" ? "Match Odds" : marketType.charAt(0).toUpperCase() + marketType.slice(1)} - ${team.team} (BACK)`,
              team.stake,
              team.back,
              marketType,
              "back",
              team.teamId
            )}
          >
            {team.back}<br /><span className="text-xs text-gray-700">{team.stake}</span>
          </div>
          <div 
            className={`${getLayColorClass()} py-2 font-semibold cursor-pointer transition duration-200`}
            onClick={() => openBetDialog(
              `${marketType === "match_odds" ? "Match Odds" : marketType.charAt(0).toUpperCase() + marketType.slice(1)} - ${team.team} (LAY)`,
              team.stake,
              team.lay,
              marketType,
              "lay",
              team.teamId
            )}
          >
            {team.lay}<br /><span className="text-xs text-gray-700">{team.stake}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamOddsTable;