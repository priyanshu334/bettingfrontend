"use client"
import RunsOptionsCard from "@/components/RunsOptionCard";
import { useEffect, useState, useRef } from "react";
// src/types/match.ts
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
  innings: number; // Non-optional
  currentInnings?: {
    battingTeam: Team;
    bowlingTeam: Team;
  };
  matchStarted: boolean;
  matchCompleted: boolean;
  oversCompleted: number; // Made non-optional
  ballsCompleted: number; // Made non-optional
  completedOvers: number[];
  teamCompletedOvers: {
    [key: number]: number[];
  };
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
}

export interface PlayerRunsDisplayData {
  id: number;
  name: string;
  runs: number;
  buttons: string[];
}

export interface PlayerWicketsDisplayData {
  id: number;
  name: string;
  wickets: number;
  buttons: string[];
}

export interface PlayerBoundariesDisplayData {
  id: number;
  name: string;
  boundaries: number;
  buttons: string[];
}

export interface BowlerRunsDisplayData {
  id: number;
  name: string;
  runsConceded: number;
  buttons: string[];
}

export interface RunsOptionsOption {
  id: number;
  label: string;
  noOdds: number;
  yesOdds: number;
  marketType: string;
}

export interface RawApiPlayer {
  id: number;
  country_id: number;
  firstname: string;
  lastname: string;
  fullname: string;
  image_path: string;
  dateofbirth: string;
  gender: string;
  battingstyle: string | null;
  bowlingstyle: string | null;
  position?: {
    id: number;
    name: string;
  };
  updated_at: string;
  lineup?: {
    team_id: number;
    captain: boolean;
    wicketkeeper: boolean;
    substitution: boolean;
  };
}

interface RunOption {
  id: string;
  label: string;
  noOdds: number;
  yesOdds: number;
  marketType: string;
  teamId?: number;
  overNumber?: number;
}

function generateBetterOdds(base: number): { noOdds: number; yesOdds: number } {
  const volatility = 0.1 + Math.random() * 0.1;
  const noOdds = Math.round(base);
  const yesProportion = 1.1 + Math.random() * 0.15;
  const yesOdds = Math.round(noOdds * yesProportion);
  return { noOdds, yesOdds };
}

function generatePresetRunOptions(teamName: string, teamId: number): RunOption[] {
  const options: RunOption[] = [];
  const totalOvers = 20;
  
  for (let over = 1; over <= totalOvers; over++) {
    const baseRuns = over * 7;
    const { noOdds, yesOdds } = generateBetterOdds(baseRuns);
    
    options.push({
      id: `${teamName}-runs-${over}`,
      label: `${over} Over${over > 1 ? 's' : ''} (${teamName})`,
      noOdds,
      yesOdds,
      marketType: "runs",
      teamId: teamId,
      overNumber: over
    });
  }
  
  return options;
}

function generateTotalOptions(localTeamName: string, visitorTeamName: string): RunOption[] {
  const totalRunsBase = 320;
  const totalFoursBase = 28;
  const totalSixesBase = 18;
  
  const totalRunsOdds = generateBetterOdds(totalRunsBase);
  const totalFoursOdds = generateBetterOdds(totalFoursBase);
  const totalSixesOdds = generateBetterOdds(totalSixesBase);
  
  return [
    {
      id: 'total-runs',
      label: `Total Match Runs (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalRunsOdds.noOdds,
      yesOdds: totalRunsOdds.yesOdds,
      marketType: "runs",
    },
    {
      id: 'total-4s',
      label: `Total Match 4s (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalFoursOdds.noOdds,
      yesOdds: totalFoursOdds.yesOdds,
      marketType: "runs",
    },
    {
      id: 'total-6s',
      label: `Total Match 6s (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalSixesOdds.noOdds,
      yesOdds: totalSixesOdds.yesOdds,
      marketType: "runs",
    }
  ];
}

interface RunsSectionProps {
  match: Match;
}

export function RunsSection({ match: initialMatch }: RunsSectionProps) {
  // Initialize match with team completed overs tracking and ensure required fields are set
  const [match, setMatch] = useState<Match>({
    ...initialMatch,
    status: {
      ...initialMatch.status,
      innings: 1, // Default to first innings
      oversCompleted: initialMatch.status.oversCompleted ?? 0,
      ballsCompleted: initialMatch.status.ballsCompleted ?? 0,
      completedOvers: initialMatch.status.completedOvers ?? [],
      teamCompletedOvers: initialMatch.status.teamCompletedOvers ?? {
        [initialMatch.localTeam.id]: [],
        [initialMatch.visitorTeam.id]: []
      }
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [allRunOptions, setAllRunOptions] = useState<RunOption[]>([]);
  const [displayedOptions, setDisplayedOptions] = useState<RunOption[]>([]);
  const [ballData, setBallData] = useState<any[]>([]);
  
  // For WebSocket connection
  const webSocketRef = useRef<WebSocket | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  
  // Generate initial preset run options on component mount
  useEffect(() => {
    const localTeamOptions = generatePresetRunOptions(initialMatch.localTeam.name, initialMatch.localTeam.id);
    const visitorTeamOptions = generatePresetRunOptions(initialMatch.visitorTeam.name, initialMatch.visitorTeam.id);
    const totalOptions = generateTotalOptions(initialMatch.localTeam.name, initialMatch.visitorTeam.name);
    
    const allOptions = [...localTeamOptions, ...visitorTeamOptions, ...totalOptions];
    setAllRunOptions(allOptions);
    setDisplayedOptions(allOptions);
  }, [initialMatch.localTeam.name, initialMatch.visitorTeam.name, initialMatch.localTeam.id, initialMatch.visitorTeam.id]);

  // Function to get over number and ball number from ball value
  const parseBallValue = (ballValue: number) => {
    // The ball format is like 0.1, 0.2, ..., 0.6, 1.1, 1.2, etc.
    // Where the integer part is the over number and decimal part is the ball number
    const overNumber = Math.floor(ballValue);
    const ballNumber = Math.round((ballValue % 1) * 10);
    return { overNumber, ballNumber };
  };

  // Process ball data to update match status
  const processBallData = (balls: any[]) => {
    if (balls.length === 0) return;
    
    // Sort balls by ball number to ensure chronological order
    const sortedBalls = [...balls].sort((a, b) => a.ball - b.ball);
    
    // Track the current innings and last processed ball
    let currentInnings = 1;
    let lastBall = { overNumber: 0, ballNumber: 0 };
    
    // Group balls by team to track completed overs for each team
    const teamBalls: { [key: number]: any[] } = {};
    
    sortedBalls.forEach(ball => {
      const teamId = ball.team_id;
      if (!teamBalls[teamId]) {
        teamBalls[teamId] = [];
      }
      teamBalls[teamId].push(ball);
    });
    
    // Process latest ball to get current match state
    const latestBall = sortedBalls[sortedBalls.length - 1];
    const { overNumber, ballNumber } = parseBallValue(latestBall.ball);
    
    // Determine current innings
    currentInnings = latestBall.fixture_id;
    lastBall = { overNumber, ballNumber };
    
    // Calculate completed overs for each team
    const teamCompletedOvers: { [key: number]: number[] } = {};
    
    Object.entries(teamBalls).forEach(([teamIdStr, balls]) => {
      const teamId = parseInt(teamIdStr);
      teamCompletedOvers[teamId] = [];
      
      // Group balls by over
      const oversBalls: { [over: number]: number[] } = {};
      
      balls.forEach(ball => {
        const { overNumber, ballNumber } = parseBallValue(ball.ball);
        if (!oversBalls[overNumber]) {
          oversBalls[overNumber] = [];
        }
        oversBalls[overNumber].push(ballNumber);
      });
      
      // Mark overs with 6 balls as completed
      Object.entries(oversBalls).forEach(([overStr, balls]) => {
        const over = parseInt(overStr);
        // An over is complete if it has all 6 balls
        if (balls.length === 6) {
          teamCompletedOvers[teamId].push(over);
        }
      });
    });
    
    // Update match status
    setMatch(prevMatch => {
      // Determine current batting and bowling teams
      const battingTeamId = latestBall.team_id;
      const battingTeam = battingTeamId === prevMatch.localTeam.id ? 
        prevMatch.localTeam : prevMatch.visitorTeam;
      const bowlingTeam = battingTeamId === prevMatch.localTeam.id ? 
        prevMatch.visitorTeam : prevMatch.localTeam;
      
      return {
        ...prevMatch,
        status: {
          ...prevMatch.status,
          matchStarted: true,
          innings: currentInnings,
          oversCompleted: lastBall.overNumber,
          ballsCompleted: lastBall.ballNumber,
          teamCompletedOvers,
          currentInnings: {
            battingTeam,
            bowlingTeam
          }
        }
      };
    });
  };

  // Fetch ball-by-ball data
  const fetchBallData = async () => {
    setIsLoading(true);
    try {
      const apiToken = process.env.NEXT_PUBLIC_SPORTMONKS_API_TOKEN;
      const response = await fetch(
        `https://cricket.sportmonks.com/api/v2.0/fixtures/${initialMatch.id}?api_token=${apiToken}&include=balls`
      );
      
      if (!response.ok) throw new Error('Failed to fetch ball data');
      
      const data = await response.json();
      
      if (data.data.balls && data.data.balls.data) {
        setBallData(data.data.balls.data);
        processBallData(data.data.balls.data);
      }
    } catch (error) {
      console.error("Error fetching ball data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket setup for real-time updates
  useEffect(() => {
    // Only set up WebSocket if it's not already connected
    if (!isWebSocketConnected && !webSocketRef.current) {
      const connectWebSocket = () => {
        try {
          // Replace with your actual WebSocket endpoint
          const wsEndpoint = `wss://cricket-ws.sportmonks.com/socket?api_token=${process.env.NEXT_PUBLIC_SPORTMONKS_API_TOKEN}`;
          const ws = new WebSocket(wsEndpoint);
          
          ws.onopen = () => {
            console.log("WebSocket connected");
            setIsWebSocketConnected(true);
            
            // Subscribe to updates for this match
            ws.send(JSON.stringify({
              action: "subscribe",
              fixture_id: initialMatch.id
            }));
          };
          
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              
              // Check if this is ball data for our match
              if (data.type === "ball" && data.data && data.data.fixture_id === initialMatch.id) {
                // Add new ball to our ball data
                setBallData(prevData => [...prevData, data.data]);
                
                // Re-process all ball data including the new ball
                processBallData([...ballData, data.data]);
              }
            } catch (error) {
              console.error("Error processing WebSocket message:", error);
            }
          };
          
          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsWebSocketConnected(false);
          };
          
          ws.onclose = () => {
            console.log("WebSocket connection closed");
            setIsWebSocketConnected(false);
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 5000);
          };
          
          webSocketRef.current = ws;
        } catch (error) {
          console.error("Error setting up WebSocket:", error);
          setIsWebSocketConnected(false);
        }
      };
      
      connectWebSocket();
    }
    
    // Clean up WebSocket on component unmount
    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null;
        setIsWebSocketConnected(false);
      }
    };
  }, [initialMatch.id, ballData, isWebSocketConnected]);

  // Fallback to polling if WebSocket is not connected
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (!isWebSocketConnected) {
      // If WebSocket is not connected, fetch data via API polling
      fetchBallData();
      
      const pollFrequency = match.status.matchStarted && !match.status.matchCompleted 
        ? 10000  // 10 seconds during active match
        : 60000; // 1 minute before/after match
        
      pollInterval = setInterval(fetchBallData, pollFrequency);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [match.status.matchStarted, match.status.matchCompleted, isWebSocketConnected]);

  // Update displayed options based on current match state
  useEffect(() => {
    if (!match.status.matchStarted) return;
    
    const currentBattingTeamId = match.status.currentInnings?.battingTeam.id;
    if (!currentBattingTeamId) return;
    
    // Get completed overs for current batting team
    const completedOvers = match.status.teamCompletedOvers[currentBattingTeamId] || [];
    const currentOver = match.status.oversCompleted;
    
    // Filter options to show:
    // - For current batting team: only overs not yet completed and not in progress
    // - For other team: all overs (since they'll bat in next innings)
    // - Total match options
    const filtered = allRunOptions.filter((option: RunOption) => {
      // Always keep total match options
      if (!option.overNumber) return true;
      
      // For current batting team
      if (option.teamId === currentBattingTeamId) {
        // Hide if the over is completed
        if (completedOvers.includes(option.overNumber)) return false;
        
        // Hide if the over is in progress (current over)
        if (option.overNumber === currentOver && match.status.ballsCompleted > 0) return false;
        
        return true;
      }
      
      // For other team, show all overs
      return true;
    });
    
    setDisplayedOptions(filtered);
  }, [match.status, allRunOptions]);

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
        Match Runs
        {isLoading && <span className="ml-2 text-sm text-gray-400">Updating...</span>}
        {isWebSocketConnected && <span className="ml-2 text-sm text-green-400">• Live</span>}
      </h2>
      <RunsOptionsCard
        key={`runs-${match.id}-${match.status.oversCompleted}-${match.status.ballsCompleted}`}
        matchId={match.id}
        heading="Run Markets"
        options={displayedOptions}
        teamId={match.status.currentInnings?.battingTeam.id || match.localTeam.id}
      />
      {/* Display current match status */}
      {match.status.matchStarted && (
        <div className="text-sm text-gray-300 mt-2">
          <div>
            Current: {match.status.currentInnings?.battingTeam.name} batting, 
            Over {match.status.oversCompleted}.{match.status.ballsCompleted}
          </div>
          {match.status.currentInnings?.battingTeam && (
            <div className="mt-1">
              Completed overs for {match.status.currentInnings.battingTeam.name}: {
                match.status.teamCompletedOvers[match.status.currentInnings.battingTeam.id]?.length > 0 
                  ? match.status.teamCompletedOvers[match.status.currentInnings.battingTeam.id].sort((a, b) => a - b).join(', ')
                  : 'None'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}