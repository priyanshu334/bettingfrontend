"use client";
import RunsOptionsCard from "@/components/RunsOptionCard";
import { useEffect, useState } from "react";

export interface Team {
  id: number;
  name: string;
  image_path: string;
}

export interface Player {
  id: number;
  team_id: number;
  fullname: string;
  firstname: string;
  lastname: string;
  position: string;
}

export interface MatchStatus {
  tossCompleted: boolean;
  tossWinner?: Team;
  battingFirst?: Team;
  innings?: number;
  currentInnings?: {
    battingTeam: Team;
    bowlingTeam: Team;
  };
  matchStarted: boolean;
  matchCompleted: boolean;
  oversCompleted?: number;
}

export interface Match {
  id: number;
  match: string;
  date: string;
  venue: string;
  localTeam: Team;
  visitorTeam: Team;
  localTeamLogo: string;
  visitorTeamLogo: string;
  score?: string;
  lineup?: Player[];
  status: MatchStatus;
  ballHistory?: BallHistory;
}

export interface BallHistory {
  firstBall: string;
  secondBall: string;
  isWicketTaken: boolean;
  currentOver: number;
  lastEventId?: string;
}

interface BallData {
  firstBall: string;
  secondBall: string;
  isWicketTaken: boolean;
  currentOver: number;
}

type ScoreLookup = {
  [key: string]: number;
};

interface RunOption {
  id: string;
  label: string;
  noOdds: number;
  yesOdds: number;
  marketType: string;
  teamId?: number;
  overNumber?: number;
  predictedRuns?: number;
}

interface RunsSectionProps {
  match: Match;
}

interface RunsOptionsCardProps {
  matchId: number;
  heading: string;
  options: RunOption[];
  teamId: number;
}

// Helper functions
function getNextScore(ballData: BallData): number {
  const firstBall = ballData.firstBall;
  const secondBall = ballData.secondBall;
  const isWicketTaken = ballData.isWicketTaken;
  
  if (isWicketTaken) {
    if (ballData.currentOver < 7) return -6;
    else return -8;
  }
  
  const res = (first: string, second: string): number | null => {
    const lookup: ScoreLookup = {
      "0,0": -1,
      "0,1": 0,
      "0,2": 1,
      "0,3": 2,
      "0,4": 3,
      "0,6": 4,
      "1,0": 0,
      "1,1": 0,
      "1,2": 1,
      "1,3": 2,
      "1,4": 3,
      "1,6": 4,
      "2,0": 0,
      "2,1": 0,
      "2,2": 1,
      "2,3": 2,
      "2,4": 2,
      "2,6": 4,
      "3,0": -1,
      "3,1": 0,
      "3,2": 1,
      "3,3": 2,
      "3,4": 2,
      "3,6": 4,
      "4,0": -2,
      "4,1": -1,
      "4,2": 0,
      "4,3": 1,
      "4,4": 3,
      "4,6": 4,
      "6,0": -3,
      "6,1": -1,
      "6,2": -1,
      "6,3": 0,
      "6,4": 2,
      "6,6": 5,
    };
    const key = `${first},${second}`;
    return lookup[key] !== undefined ? lookup[key] : null;
  };
  
  const result = res(firstBall, secondBall);
  return result !== null ? result : 0;
}

function generateBetterOdds(base: number): { noOdds: number; yesOdds: number } {
  const volatility = 0.1 + Math.random() * 0.1;
  const noOdds = Math.round(base);
  const yesProportion = 1.1 + Math.random() * 0.15;
  const yesOdds = Math.round(noOdds * yesProportion);
  return { noOdds, yesOdds };
}

function generatePresetRunOptions(teamName: string, teamId: number, ballHistory?: BallHistory): RunOption[] {
  const options: RunOption[] = [];
  const totalOvers = 20;
  let predictedAdjustment = 0;
  
  if (ballHistory) {
    predictedAdjustment = getNextScore(ballHistory);
  }
  
  for (let over = 1; over <= totalOvers; over++) {
    let baseRuns = over * 7;
    
    if (ballHistory && over === ballHistory.currentOver + 1) {
      baseRuns += predictedAdjustment;
      baseRuns = Math.max(1, baseRuns);
    }
    
    const { noOdds, yesOdds } = generateBetterOdds(baseRuns);
    
    options.push({
      id: `${teamName}-runs-${over}-${Date.now()}`,
      label: `${over} Over${over > 1 ? 's' : ''} (${teamName})`,
      noOdds,
      yesOdds,
      marketType: "runs",
      teamId,
      overNumber: over,
      predictedRuns: over === (ballHistory?.currentOver ?? 0) + 1 ? baseRuns : undefined
    });
  }
  
  return options;
}

function generateTotalOptions(localTeamName: string, visitorTeamName: string, ballHistory?: BallHistory): RunOption[] {
  let totalRunsBase = 320;
  let totalFoursBase = 28;
  let totalSixesBase = 18;
  
  if (ballHistory) {
    const predictedAdjustment = getNextScore(ballHistory);
    totalRunsBase += predictedAdjustment * 2;
    totalFoursBase += Math.floor(predictedAdjustment / 2);
    totalSixesBase += Math.floor(predictedAdjustment / 3);
    
    totalRunsBase = Math.max(160, totalRunsBase);
    totalFoursBase = Math.max(12, totalFoursBase);
    totalSixesBase = Math.max(6, totalSixesBase);
  }
  
  const totalRunsOdds = generateBetterOdds(totalRunsBase);
  const totalFoursOdds = generateBetterOdds(totalFoursBase);
  const totalSixesOdds = generateBetterOdds(totalSixesBase);
  
  return [
    {
      id: `total-runs-${Date.now()}`,
      label: `Total Match Runs (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalRunsOdds.noOdds,
      yesOdds: totalRunsOdds.yesOdds,
      marketType: "runs",
      predictedRuns: totalRunsBase
    },
    {
      id: `total-4s-${Date.now()}`,
      label: `Total Match 4s (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalFoursOdds.noOdds,
      yesOdds: totalFoursOdds.yesOdds,
      marketType: "runs",
      predictedRuns: totalFoursBase
    },
    {
      id: `total-6s-${Date.now()}`,
      label: `Total Match 6s (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalSixesOdds.noOdds,
      yesOdds: totalSixesOdds.yesOdds,
      marketType: "runs",
      predictedRuns: totalSixesBase
    }
  ];
}

function parseBallHistory(matchData: any): BallHistory | undefined {
  if (!matchData || !matchData.ball_history) return undefined;
  
  try {
    const ballHistory = matchData.ball_history;
    return {
      firstBall: ballHistory.first_ball || "0",
      secondBall: ballHistory.second_ball || "0",
      isWicketTaken: ballHistory.is_wicket || false,
      currentOver: ballHistory.current_over || 0,
      lastEventId: ballHistory.event_id || null
    };
  } catch (error) {
    console.error("Error parsing ball history:", error);
    return undefined;
  }
}

export function RunsSection({ match: initialMatch }: RunsSectionProps) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [isLoading, setIsLoading] = useState(false);
  const [allRunOptions, setAllRunOptions] = useState<RunOption[]>([]);
  const [displayedOptions, setDisplayedOptions] = useState<RunOption[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  
  // Initialize options
  useEffect(() => {
    const initializeOptions = () => {
      const localTeamOptions = generatePresetRunOptions(
        initialMatch.localTeam.name, 
        initialMatch.localTeam.id
      );
      const visitorTeamOptions = generatePresetRunOptions(
        initialMatch.visitorTeam.name, 
        initialMatch.visitorTeam.id
      );
      const totalOptions = generateTotalOptions(
        initialMatch.localTeam.name, 
        initialMatch.visitorTeam.name
      );
      
      const allOptions = [...localTeamOptions, ...visitorTeamOptions, ...totalOptions];
      setAllRunOptions(allOptions);
      setDisplayedOptions(allOptions);
    };
    
    initializeOptions();
  }, [initialMatch]);

  // Real-time updates handler
  useEffect(() => {
    let socket: WebSocket | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    const matchId = initialMatch.id;

    const fetchMatchData = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/fixtures/${matchId}?lastEvent=${lastEventId || ''}`);
        if (!response.ok) throw new Error('Failed to fetch match data');
        
        const data = await response.json();
        
        if (data.lastEventId && data.lastEventId !== lastEventId) {
          const ballHistory = parseBallHistory(data);
          
          const updatedMatch: Match = {
            ...initialMatch,
            ...data,
            status: {
              ...initialMatch.status,
              ...data.status,
              currentInnings: data.innings ? {
                battingTeam: data.innings % 2 === 1 ? data.localteam : data.visitorteam,
                bowlingTeam: data.innings % 2 === 1 ? data.visitorteam : data.localteam
              } : undefined,
              oversCompleted: data.scoreboards?.[0]?.overs || 0
            },
            ballHistory
          };

          setMatch(updatedMatch);
          setLastEventId(data.lastEventId);

          if (ballHistory) {
            updateOptions(updatedMatch, ballHistory);
          }
        }
      } catch (error) {
        console.error("Error fetching match data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const updateOptions = (matchData: Match, ballHistory: BallHistory) => {
      const localTeamOptions = generatePresetRunOptions(
        matchData.localTeam.name, 
        matchData.localTeam.id,
        ballHistory
      );
      
      const visitorTeamOptions = generatePresetRunOptions(
        matchData.visitorTeam.name, 
        matchData.visitorTeam.id,
        ballHistory
      );
      
      const totalOptions = generateTotalOptions(
        matchData.localTeam.name, 
        matchData.visitorTeam.name,
        ballHistory
      );
      
      const newOptions = [...localTeamOptions, ...visitorTeamOptions, ...totalOptions];
      setAllRunOptions(newOptions);
      filterDisplayedOptions(newOptions, matchData);
    };

    const filterDisplayedOptions = (options: RunOption[], matchData: Match) => {
      if (matchData.status.matchStarted && matchData.status.currentInnings) {
        const currentBattingTeamId = matchData.status.currentInnings.battingTeam.id;
        const currentOver = matchData.status.oversCompleted || 0;
        
        const filtered = options.filter((option) => {
          if (!('overNumber' in option)) return true;
          if (option.teamId === currentBattingTeamId) {
            return option.overNumber! > Math.ceil(currentOver);
          }
          return option.teamId !== currentBattingTeamId;
        });
        
        setDisplayedOptions(filtered);
      } else {
        setDisplayedOptions(options);
      }
    };

    const setupWebSocket = () => {
      try {
        socket = new WebSocket(`wss://your-api.com/live/${matchId}`);
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'BALL_UPDATE' || data.type === 'WICKET') {
            fetchMatchData();
          }
        };
        
        socket.onclose = () => {
          pollInterval = setInterval(fetchMatchData, 5000);
        };
        
        socket.onerror = () => {
          if (socket) socket.close();
        };
      } catch (error) {
        console.error("WebSocket error:", error);
        pollInterval = setInterval(fetchMatchData, 5000);
      }
    };

    // Initial fetch
    fetchMatchData();
    
    // Setup real-time updates if match is in progress
    if (initialMatch.status.matchStarted && !initialMatch.status.matchCompleted) {
      setupWebSocket();
    }

    return () => {
      if (socket) socket.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [initialMatch.id, lastEventId]);

  const togglePredictions = () => {
    setShowPredictions(!showPredictions);
  };
  
  const EnhancedRunsOptionsCard = ({ 
    options, 
    matchId,
    heading,
    teamId,
    ...props 
  }: RunsOptionsCardProps) => {
    return (
      <div>
        <RunsOptionsCard
          matchId={matchId}
          heading={heading}
          teamId={teamId}
          options={options.map((option) => ({
            ...option,
            label: showPredictions && option.predictedRuns 
              ? `${option.label} (Predicted: ${option.predictedRuns} runs)`
              : option.label
          }))}
          {...props}
        />
      </div>
    );
  };
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          Match Runs
          {isLoading && <span className="ml-2 text-sm text-gray-400">Updating...</span>}
        </h2>
        
        {match.status.matchStarted && match.ballHistory && (
          <button 
            onClick={togglePredictions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {showPredictions ? "Hide Predictions" : "Show Predictions"}
          </button>
        )}
      </div>
      
      {match.status.matchStarted && match.ballHistory && showPredictions && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Latest Ball Data</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-300">First Ball: {match.ballHistory.firstBall}</p>
              <p className="text-gray-300">Second Ball: {match.ballHistory.secondBall}</p>
            </div>
            <div>
              <p className="text-gray-300">Current Over: {match.ballHistory.currentOver}</p>
              <p className="text-gray-300">Wicket Taken: {match.ballHistory.isWicketTaken ? "Yes" : "No"}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-white font-medium">
              Predicted Adjustment: {getNextScore(match.ballHistory)} runs
            </p>
          </div>
        </div>
      )}
      
      <EnhancedRunsOptionsCard
        key={`runs-${match.id}-${lastEventId || 'initial'}`}
        matchId={match.id}
        heading="Run Markets"
        options={displayedOptions}
        teamId={match.status.currentInnings?.battingTeam.id || match.localTeam.id}
      />
    </div>
  );
}