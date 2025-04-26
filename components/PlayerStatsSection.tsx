import PlayerRunsCard from "@/components/PlayerRunsCard";
import PlayerWicketsCard from "@/components/PlayerWicketsCard";
import PlayerBoundariesCard from "@/components/PlayerBoundariesCard";
import BowlerRunsCard from "@/components/BowlerRunsCard";

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


function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface PlayerStatsSectionProps {
  match: Match;
  oddsUpdateCount: number;
  generateRandomOdds: () => string;
}

// Define specialized types for each card
interface PlayerRuns {
  id: number;
  name: string;
  runs: number;
  buttons: string[];
}

interface PlayerWickets {
  id: number;
  name: string;
  wickets: number;
  buttons: string[];
}

interface PlayerBoundaries {
  id: number;
  name: string;
  boundaries: number;
  buttons: string[];
}

interface BowlerRuns {
  id: number;
  name: string;
  runsConceded: number;
  buttons: string[];
}

export function PlayerStatsSection({
  match,
  oddsUpdateCount,
  generateRandomOdds,
}: PlayerStatsSectionProps) {
  const battingRoles = ["Batsman", "Wicketkeeper", "Allrounder", "Batting Allrounder"];
  const bowlingRoles = ["Bowler", "Allrounder", "Batting Allrounder"];

  const filterPlayersByRole = (players: Player[], roleFilter: string[]): Player[] => {
    if (!players || players.length === 0) return [];
    return players.filter((player) => roleFilter.includes(player.position));
  };

  const localBattingPlayers = filterPlayersByRole(match.lineup?.filter(p => p.team_id === match.localTeam.id) || [], battingRoles);
  const visitorBattingPlayers = filterPlayersByRole(match.lineup?.filter(p => p.team_id === match.visitorTeam.id) || [], battingRoles);
  const localBowlingPlayers = filterPlayersByRole(match.lineup?.filter(p => p.team_id === match.localTeam.id) || [], bowlingRoles);
  const visitorBowlingPlayers = filterPlayersByRole(match.lineup?.filter(p => p.team_id === match.visitorTeam.id) || [], bowlingRoles);

  const isLocalBatting = match.status.currentInnings?.battingTeam.id === match.localTeam.id;
  const isVisitorBatting = match.status.currentInnings?.battingTeam.id === match.visitorTeam.id;

  const showLocalBatting = !match.status.currentInnings || isLocalBatting;
  const showVisitorBatting = !match.status.currentInnings || isVisitorBatting;
  const showLocalBowling = !match.status.currentInnings || !isLocalBatting;
  const showVisitorBowling = !match.status.currentInnings || !isVisitorBatting;

  // Now create specific player data arrays

  const playerRunsData: PlayerRuns[] = localBattingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runs: rand(10, 80),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorPlayerRunsData: PlayerRuns[] = visitorBattingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runs: rand(10, 80),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const playerWicketsData: PlayerWickets[] = localBowlingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    wickets: rand(0, 3),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorPlayerWicketsData: PlayerWickets[] = visitorBowlingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    wickets: rand(0, 3),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const playerBoundariesData: PlayerBoundaries[] = localBattingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    boundaries: rand(0, 6),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorPlayerBoundariesData: PlayerBoundaries[] = visitorBattingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    boundaries: rand(0, 6),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const bowlerRunsData: BowlerRuns[] = localBowlingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runsConceded: rand(15, 50),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorBowlerRunsData: BowlerRuns[] = visitorBowlingPlayers.map((p) => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runsConceded: rand(15, 50),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  return (
    <>
      {(showLocalBatting || showVisitorBatting) && (
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
            Player Runs
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {showLocalBatting && (
              <PlayerRunsCard
                key={`local-runs-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.localTeam.name}
                players={playerRunsData}
              />
            )}
            {showVisitorBatting && (
              <PlayerRunsCard
                key={`visitor-runs-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.visitorTeam.name}
                players={visitorPlayerRunsData}
              />
            )}
          </div>
        </div>
      )}

      {(showLocalBowling || showVisitorBowling) && (
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
            Player Wickets
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {showLocalBowling && (
              <PlayerWicketsCard
                key={`local-wickets-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.localTeam.name}
                players={playerWicketsData}
              />
            )}
            {showVisitorBowling && (
              <PlayerWicketsCard
                key={`visitor-wickets-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.visitorTeam.name}
                players={visitorPlayerWicketsData}
              />
            )}
          </div>
        </div>
      )}

      {(showLocalBatting || showVisitorBatting) && (
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
            Player Total Boundaries
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {showLocalBatting && (
              <PlayerBoundariesCard
                key={`local-boundaries-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.localTeam.name}
                players={playerBoundariesData}
              />
            )}
            {showVisitorBatting && (
              <PlayerBoundariesCard
                key={`visitor-boundaries-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.visitorTeam.name}
                players={visitorPlayerBoundariesData}
              />
            )}
          </div>
        </div>
      )}

      {(showLocalBowling || showVisitorBowling) && (
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
            Bowler Runs Conceded
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {showLocalBowling && (
              <BowlerRunsCard
                key={`local-bowler-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.localTeam.name}
                players={bowlerRunsData}
              />
            )}
            {showVisitorBowling && (
              <BowlerRunsCard
                key={`visitor-bowler-${oddsUpdateCount}`}
                matchId={match.id}
                heading={match.visitorTeam.name}
                players={visitorBowlerRunsData}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
