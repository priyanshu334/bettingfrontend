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
  ballsCompleted?: number;
  completedOvers: number[]; // Track completed overs for current innings
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
  const [match, setMatch] = useState<Match>({
    ...initialMatch,
    status: {
      ...initialMatch.status,
      completedOvers: [] // Initialize completed overs array
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [allRunOptions, setAllRunOptions] = useState<RunOption[]>([]);
  const [displayedOptions, setDisplayedOptions] = useState<RunOption[]>([]);
  const [ballData, setBallData] = useState<any[]>([]);
  
  // Generate initial preset run options on component mount
  useEffect(() => {
    const localTeamOptions = generatePresetRunOptions(initialMatch.localTeam.name, initialMatch.localTeam.id);
    const visitorTeamOptions = generatePresetRunOptions(initialMatch.visitorTeam.name, initialMatch.visitorTeam.id);
    const totalOptions = generateTotalOptions(initialMatch.localTeam.name, initialMatch.visitorTeam.name);
    
    const allOptions = [...localTeamOptions, ...visitorTeamOptions, ...totalOptions];
    setAllRunOptions(allOptions);
    setDisplayedOptions(allOptions);
  }, [initialMatch.localTeam.name, initialMatch.visitorTeam.name, initialMatch.localTeam.id, initialMatch.visitorTeam.id]);

  // Function to process ball data and update match status
  const processBallData = (balls: any[]) => {
    if (balls.length === 0) return;
    
    // Get the latest ball
    const latestBall = balls[balls.length - 1];
    
    // Calculate current over and ball
    const ballValue = latestBall.ball;
    const overNumber = Math.floor(ballValue);
    const ballNumber = Math.round((ballValue % 1) * 10);
    
    // Determine if we're in a new innings
    const isNewInnings = match.status.innings !== latestBall.fixture_id;
    
    setMatch(prevMatch => {
      // Reset completed overs if it's a new innings
      const completedOvers = isNewInnings ? [] : [...prevMatch.status.completedOvers];
      
      // Check if we've completed an over (ballNumber === 6 and it's not already marked as completed)
      if (ballNumber === 6 && !completedOvers.includes(overNumber)) {
        completedOvers.push(overNumber);
      }
      
      return {
        ...prevMatch,
        status: {
          ...prevMatch.status,
          oversCompleted: overNumber,
          ballsCompleted: ballNumber,
          matchStarted: true,
          completedOvers,
          innings: latestBall.fixture_id,
          currentInnings: {
            battingTeam: latestBall.team_id === prevMatch.localTeam.id ? 
              prevMatch.localTeam : prevMatch.visitorTeam,
            bowlingTeam: latestBall.team_id === prevMatch.localTeam.id ? 
              prevMatch.visitorTeam : prevMatch.localTeam
          }
        }
      };
    });
  };

  // Fetch ball-by-ball data
  const fetchBallData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://cricket.sportmonks.com/api/v2.0/fixtures/${initialMatch.id}?api_token=${process.env.NEXT_PUBLIC_SPORTMONKS_API_TOKEN}&include=balls`
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

  // Update displayed options based on current match state
  useEffect(() => {
    if (!match.status.matchStarted) return;
    
    const currentBattingTeamId = match.status.currentInnings?.battingTeam.id;
    if (!currentBattingTeamId) return;
    
    const completedOvers = match.status.completedOvers || [];
    
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
        return !completedOvers.includes(option.overNumber);
      }
      
      // For other team, show all overs
      return true;
    });
    
    setDisplayedOptions(filtered);
  }, [match.status.completedOvers, match.status.currentInnings, allRunOptions]);

  // Set up polling for ball data
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (match.status.matchStarted && !match.status.matchCompleted) {
      // Fetch more frequently during active play (every 10 seconds)
      fetchBallData();
      interval = setInterval(fetchBallData, 10000);
    } else {
      // Fetch less frequently before/after match (every minute)
      fetchBallData();
      interval = setInterval(fetchBallData, 60000);
    }
    
    return () => clearInterval(interval);
  }, [match.status.matchStarted, match.status.matchCompleted, initialMatch.id]);

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
        Match Runs
        {isLoading && <span className="ml-2 text-sm text-gray-400">Updating...</span>}
      </h2>
      <RunsOptionsCard
        key={`runs-${match.id}-${match.status.oversCompleted || 0}-${match.status.ballsCompleted || 0}`}
        matchId={match.id}
        heading="Run Markets"
        options={displayedOptions}
        teamId={match.status.currentInnings?.battingTeam.id || match.localTeam.id}
      />
      {/* Display current match status */}
      {match.status.matchStarted && (
        <div className="text-sm text-gray-300 mt-2">
          Current: {match.status.currentInnings?.battingTeam.name} batting, 
          Over {match.status.oversCompleted}.{match.status.ballsCompleted}
          {match.status.completedOvers.length > 0 && (
            <span>, Completed overs: {match.status.completedOvers.join(', ')}</span>
          )}
        </div>
      )}
    </div>
  );
}