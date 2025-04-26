import PlayerRunsCard from "./PlayerRunsCard";
import PlayerWicketsCard from "./PlayerWicketsCard";
import PlayerBoundariesCard from "./PlayerBoundariesCard";
import BowlerRunsCard from "./BowlerRunsCard";

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

interface PlayerStatsSectionProps {
  matchId: number;
  localTeam: Team;
  visitorTeam: Team;
  localPlayers: Player[];
  visitorPlayers: Player[];
  oddsUpdateCount: number;
  generateRandomOdds: () => string;
}

export function PlayerStatsSection({
  matchId,
  localTeam,
  visitorTeam,
  localPlayers,
  visitorPlayers,
  oddsUpdateCount,
  generateRandomOdds
}: PlayerStatsSectionProps) {
  const battingRoles = ['Batsman', 'Wicketkeeper', 'Allrounder', 'Batting Allrounder'];
  const bowlingRoles = ['Bowler', 'Allrounder', 'Batting Allrounder'];

  const filterPlayersByRole = (players: Player[], roleFilter: string[]): Player[] => {
    return players.filter(player => roleFilter.includes(player.position));
  };

  const localBattingPlayers = filterPlayersByRole(localPlayers, battingRoles);
  const visitorBattingPlayers = filterPlayersByRole(visitorPlayers, battingRoles);
  const localBowlingPlayers = filterPlayersByRole(localPlayers, bowlingRoles);
  const visitorBowlingPlayers = filterPlayersByRole(visitorPlayers, bowlingRoles);

  // ✅ Corrected generic function
  const createPlayerData = <T extends { id: number; name: string; buttons: string[] }>(
    players: Player[],
    statGenerator: () => Omit<T, 'id' | 'name' | 'buttons'>,
    buttonsGenerator: () => string[]
  ): T[] => {
    return players.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      ...statGenerator(),
      buttons: buttonsGenerator(),
    })) as T[]; // <-- this fixes the TS error
  };
  

  const playerRunsData = createPlayerData<PlayerRunsDisplayData>(
    localBattingPlayers,
    () => ({ runs: rand(10, 80) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const visitorPlayerRunsData = createPlayerData<PlayerRunsDisplayData>(
    visitorBattingPlayers,
    () => ({ runs: rand(10, 80) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const playerWicketsData = createPlayerData<PlayerWicketsDisplayData>(
    localBowlingPlayers,
    () => ({ wickets: rand(0, 3) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const visitorPlayerWicketsData = createPlayerData<PlayerWicketsDisplayData>(
    visitorBowlingPlayers,
    () => ({ wickets: rand(0, 3) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const playerBoundariesData = createPlayerData<PlayerBoundariesDisplayData>(
    localBattingPlayers,
    () => ({ boundaries: rand(0, 6) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const visitorPlayerBoundariesData = createPlayerData<PlayerBoundariesDisplayData>(
    visitorBattingPlayers,
    () => ({ boundaries: rand(0, 6) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const bowlerRunsData = createPlayerData<BowlerRunsDisplayData>(
    localBowlingPlayers,
    () => ({ runsConceded: rand(15, 50) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  const visitorBowlerRunsData = createPlayerData<BowlerRunsDisplayData>(
    visitorBowlingPlayers,
    () => ({ runsConceded: rand(15, 50) }),
    () => [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`]
  );

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Runs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <PlayerRunsCard
            key={`local-runs-${oddsUpdateCount}`}
            matchId={matchId}
            heading={localTeam.name}
            players={playerRunsData}
          />
          <PlayerRunsCard
            key={`visitor-runs-${oddsUpdateCount}`}
            matchId={matchId}
            heading={visitorTeam.name}
            players={visitorPlayerRunsData}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Wickets</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <PlayerWicketsCard
            key={`local-wickets-${oddsUpdateCount}`}
            matchId={matchId}
            heading={localTeam.name}
            players={playerWicketsData}
          />
          <PlayerWicketsCard
            key={`visitor-wickets-${oddsUpdateCount}`}
            matchId={matchId}
            heading={visitorTeam.name}
            players={visitorPlayerWicketsData}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Total Boundaries</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <PlayerBoundariesCard
            key={`local-boundaries-${oddsUpdateCount}`}
            matchId={matchId}
            heading={localTeam.name}
            players={playerBoundariesData}
          />
          <PlayerBoundariesCard
            key={`visitor-boundaries-${oddsUpdateCount}`}
            matchId={matchId}
            heading={visitorTeam.name}
            players={visitorPlayerBoundariesData}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Bowler Runs Conceded</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <BowlerRunsCard
            key={`local-bowler-${oddsUpdateCount}`}
            matchId={matchId}
            heading={localTeam.name}
            players={bowlerRunsData}
          />
          <BowlerRunsCard
            key={`visitor-bowler-${oddsUpdateCount}`}
            matchId={matchId}
            heading={visitorTeam.name}
            players={visitorBowlerRunsData}
          />
        </div>
      </div>
    </>
  );
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
