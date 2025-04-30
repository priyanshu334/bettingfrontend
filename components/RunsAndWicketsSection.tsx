"use client"
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

// New interface to track ball history
export interface BallHistory {
  firstBall: string;
  secondBall: string;
  isWicketTaken: boolean;
  currentOver: number;
}

// Define type for ball data parameter
interface BallData {
  firstBall: string;
  secondBall: string;
  isWicketTaken: boolean;
  currentOver: number;
}

// Type for lookup table
type ScoreLookup = {
  [key: string]: number;
};

// Function to calculate next score based on ball data
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
  return result !== null ? result : 0; // Default to 0 if no valid result
}

// Define interface for run option
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

// Generate odds with YES always greater than NO (better payout)
function generateBetterOdds(base: number): { noOdds: number; yesOdds: number } {
  // Create a base volatility between 10-20%
  const volatility = 0.1 + Math.random() * 0.1;
  
  // Generate NO odds (base value as reference)
  const noOdds = Math.round(base);
  
  // Generate YES odds (always higher than NO odds)
  // Making YES odds 10-25% higher than NO odds for better payout
  const yesProportion = 1.1 + Math.random() * 0.15; // 110-125% of NO odds
  const yesOdds = Math.round(noOdds * yesProportion);
  
  return { noOdds, yesOdds };
}

// Generate preset run options for all overs (1-20) for a team
function generatePresetRunOptions(teamName: string, teamId: number, ballHistory?: BallHistory): RunOption[] {
  const options: RunOption[] = [];
  const totalOvers = 20; // Standard T20 match has 20 overs
  
  // Calculate predicted runs adjustment based on ball history if available
  let predictedAdjustment = 0;
  if (ballHistory) {
    predictedAdjustment = getNextScore(ballHistory);
  }
  
  for (let over = 1; over <= totalOvers; over++) {
    // Base of 7 runs per over
    let baseRuns = over * 7; 
    
    // Apply prediction adjustment for upcoming overs
    if (ballHistory && over === ballHistory.currentOver + 1) {
      baseRuns += predictedAdjustment;
      // Ensure baseRuns never goes below 1
      baseRuns = Math.max(1, baseRuns);
    }
    
    const { noOdds, yesOdds } = generateBetterOdds(baseRuns);
    
    options.push({
      id: `${teamName}-runs-${over}`,
      label: `${over} Over${over > 1 ? 's' : ''} (${teamName})`,
      noOdds,
      yesOdds,
      marketType: "runs",
      teamId: teamId,
      overNumber: over,
      predictedRuns: over === (ballHistory?.currentOver ?? 0) + 1 ? baseRuns : undefined
    });
  }
  
  return options;
}

// Generate match total options
function generateTotalOptions(localTeamName: string, visitorTeamName: string, ballHistory?: BallHistory): RunOption[] {
  // Base values for match totals
  let totalRunsBase = 320;
  let totalFoursBase = 28;
  let totalSixesBase = 18;
  
  // Apply prediction adjustment if we have ball history
  if (ballHistory) {
    const predictedAdjustment = getNextScore(ballHistory);
    totalRunsBase += predictedAdjustment * 2; // Multiply by 2 for total match impact
    totalFoursBase += Math.floor(predictedAdjustment / 2); // Approximate adjustment for 4s
    totalSixesBase += Math.floor(predictedAdjustment / 3); // Approximate adjustment for 6s
    
    // Ensure base values never go below minimum thresholds
    totalRunsBase = Math.max(160, totalRunsBase);
    totalFoursBase = Math.max(12, totalFoursBase);
    totalSixesBase = Math.max(6, totalSixesBase);
  }
  
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
      predictedRuns: totalRunsBase
    },
    {
      id: 'total-4s',
      label: `Total Match 4s (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalFoursOdds.noOdds,
      yesOdds: totalFoursOdds.yesOdds,
      marketType: "runs",
      predictedRuns: totalFoursBase
    },
    {
      id: 'total-6s',
      label: `Total Match 6s (${localTeamName} vs ${visitorTeamName})`,
      noOdds: totalSixesOdds.noOdds,
      yesOdds: totalSixesOdds.yesOdds,
      marketType: "runs",
      predictedRuns: totalSixesBase
    }
  ];
}

// Function to parse ball data from API response
function parseBallHistory(matchData: any): BallHistory | undefined {
  try {
    // This is a simplified example - in a real implementation, 
    // you'd extract the latest ball data from the API response
    // For now, we're simulating with random values if the match has started
    if (matchData.status === 'In Progress') {
      const currentOver = matchData.scoreboards?.[0]?.overs || 1;
      const lastTwoBalls: BallHistory = {
        firstBall: ["0", "1", "2", "3", "4", "6"][Math.floor(Math.random() * 6)],
        secondBall: ["0", "1", "2", "3", "4", "6"][Math.floor(Math.random() * 6)],
        isWicketTaken: Math.random() < 0.1, // 10% chance of a wicket
        currentOver: Math.floor(currentOver)
      };
      return lastTwoBalls;
    }
    return undefined;
  } catch (error) {
    console.error("Error parsing ball history:", error);
    return undefined;
  }
}

interface RunsSectionProps {
  match: Match;
}

// Interface for the RunsOptionsCard props
interface RunsOptionsCardProps {
  matchId: number;
  heading: string;
  options: RunOption[];
  teamId: number;
}

export function RunsSection({ match: initialMatch }: RunsSectionProps) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [isLoading, setIsLoading] = useState(false);
  const [allRunOptions, setAllRunOptions] = useState<RunOption[]>([]);
  const [displayedOptions, setDisplayedOptions] = useState<RunOption[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  
  // Generate initial preset run options on component mount - runs only once
  useEffect(() => {
    const localTeamOptions = generatePresetRunOptions(initialMatch.localTeam.name, initialMatch.localTeam.id);
    const visitorTeamOptions = generatePresetRunOptions(initialMatch.visitorTeam.name, initialMatch.visitorTeam.id);
    const totalOptions = generateTotalOptions(initialMatch.localTeam.name, initialMatch.visitorTeam.name);
    
    const allOptions = [...localTeamOptions, ...visitorTeamOptions, ...totalOptions];
    setAllRunOptions(allOptions);
    setDisplayedOptions(allOptions); // Start by showing all options
  }, [initialMatch.localTeam.name, initialMatch.visitorTeam.name, initialMatch.localTeam.id, initialMatch.visitorTeam.id]);
  
  // Fetch match data every minute and update displayed options
  useEffect(() => {
    const fetchMatchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/fixtures/${initialMatch.id}`);
        console.log(response)
        if (!response.ok) throw new Error('Failed to fetch match data');
        
        const data = await response.json();
        console.log("data is ",data)
        
        // Parse ball history from API response
        const ballHistory = parseBallHistory(data.data);
        
        // Transform API data to match interface
        const transformedData: Match = {
          id: data.data.id,
          match: `${data.data.localteam.name} vs ${data.data.visitorteam.name}`,
          date: new Date(data.data.starting_at).toLocaleString(),
          venue: data.data.venue?.name || 'Unknown venue',
          localTeam: data.data.localteam,
          visitorTeam: data.data.visitorteam,
          localTeamLogo: data.data.localteam.image_path,
          visitorTeamLogo: data.data.visitorteam.image_path,
          score: data.data.scoreboards?.[0]?.score || '0/0',
          lineup: data.data.lineup?.map((player: any) => ({
            id: player.id,
            team_id: player.team_id,
            fullname: player.fullname,
            firstname: player.firstname,
            lastname: player.lastname,
            position: player.position?.name || 'Unknown'
          })),
          status: {
            tossCompleted: data.data.tosswon !== undefined,
            tossWinner: data.data.tosswon === data.data.localteam.id 
              ? data.data.localteam 
              : data.data.visitorteam,
            battingFirst: data.data.batting_first === data.data.localteam.id 
              ? data.data.localteam 
              : data.data.visitorteam,
            innings: data.data.innings,
            currentInnings: data.data.innings && {
              battingTeam: data.data.innings % 2 === 1 
                ? data.data.localteam 
                : data.data.visitorteam,
              bowlingTeam: data.data.innings % 2 === 1 
                ? data.data.visitorteam 
                : data.data.localteam
            },
            matchStarted: data.data.status === 'In Progress',
            matchCompleted: data.data.status === 'Finished',
            oversCompleted: data.data.scoreboards?.[0]?.overs || 0
          },
          ballHistory: ballHistory
        };
        
        setMatch(transformedData);
        
        // Regenerate options with predictions if we have ball history
        if (ballHistory) {
          const localTeamOptions = generatePresetRunOptions(
            transformedData.localTeam.name, 
            transformedData.localTeam.id,
            ballHistory
          );
          
          const visitorTeamOptions = generatePresetRunOptions(
            transformedData.visitorTeam.name, 
            transformedData.visitorTeam.id,
            ballHistory
          );
          
          const totalOptions = generateTotalOptions(
            transformedData.localTeam.name, 
            transformedData.visitorTeam.name,
            ballHistory
          );
          
          const allOptions = [...localTeamOptions, ...visitorTeamOptions, ...totalOptions];
          setAllRunOptions(allOptions);
        }
        
        // Filter displayed options based on current match state
        if (transformedData.status.matchStarted && transformedData.status.currentInnings) {
          const currentBattingTeamId = transformedData.status.currentInnings.battingTeam.id;
          const currentOver = transformedData.status.oversCompleted || 0;
          
          // Filter options to only show relevant ones
          const filtered = allRunOptions.filter((option: RunOption) => {
            // Keep total match options
            if (!option.hasOwnProperty('overNumber')) {
              return true;
            }
            
            // For batting team, only show upcoming overs
            if (option.teamId === currentBattingTeamId) {
              return option.overNumber! > Math.ceil(currentOver);
            }
            
            // For non-batting team, keep all options for next innings
            return option.teamId !== currentBattingTeamId;
          });
          
          setDisplayedOptions(filtered);
        }
        
      } catch (error) {
        console.error("Error fetching match data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const interval = setInterval(fetchMatchData, 60000); // Fetch every minute
    fetchMatchData(); // Initial fetch
    return () => clearInterval(interval);
  }, [initialMatch.id, allRunOptions]);
  
  // Function to toggle showing predictions
  const togglePredictions = () => {
    setShowPredictions(!showPredictions);
  };
  
  // Enhanced RunsOptionsCard with prediction information
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
          options={options.map((option: RunOption) => ({
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
        key={`runs-${match.id}-${match.status.oversCompleted || 0}`}
        matchId={match.id}
        heading="Run Markets"
        options={displayedOptions}
        teamId={match.status.currentInnings?.battingTeam.id || match.localTeam.id}
      />
    </div>
  );
}