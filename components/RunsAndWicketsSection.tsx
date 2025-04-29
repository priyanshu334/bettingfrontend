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
}

// Generate better odds with YES always less than NO (better payout)
function generateBetterOdds(base: number): { noOdds: number; yesOdds: number } {
  // Create a base volatility between 10-20%
  const volatility = 0.1 + Math.random() * 0.1;
  
  // Generate NO odds (slightly above base value)
  const noModifier = 1 + volatility;
  const noOdds = Math.round(base * noModifier);
  
  // Generate YES odds (slightly below base value)
  // Making sure YES odds are always 10-25% lower than NO odds for better payout
  const yesProportion = 0.75 + Math.random() * 0.15; // 75-90% of NO odds
  const yesOdds = Math.round(noOdds * yesProportion);
  
  return { noOdds, yesOdds };
}

// Generate preset run options for all overs (1-20) for a team
function generatePresetRunOptions(teamName: string, teamId: number): RunOption[] {
  const options: RunOption[] = [];
  const totalOvers = 20; // Standard T20 match has 20 overs
  
  for (let over = 1; over <= totalOvers; over++) {
    const baseRuns = over * 7; // Base of 7 runs per over
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

// Generate match total options
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
  const [match, setMatch] = useState<Match>(initialMatch);
  const [isLoading, setIsLoading] = useState(false);
  const [allRunOptions, setAllRunOptions] = useState<RunOption[]>([]);
  const [displayedOptions, setDisplayedOptions] = useState<RunOption[]>([]);
  
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
        if (!response.ok) throw new Error('Failed to fetch match data');
        
        const data = await response.json();
        
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
          }
        };
        
        setMatch(transformedData);
        
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
  
  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
        Match Runs
        {isLoading && <span className="ml-2 text-sm text-gray-400">Updating...</span>}
      </h2>
      <RunsOptionsCard
        key={`runs-${match.id}-${match.status.oversCompleted || 0}`}
        matchId={match.id}
        heading="Run Markets"
        options={displayedOptions}
        teamId={match.status.currentInnings?.battingTeam.id || match.localTeam.id}
      />
    </div>
  );
}