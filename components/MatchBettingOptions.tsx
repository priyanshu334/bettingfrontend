import Link from "next/link";
import MatchCard  from "./MatchCard";


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
  
  export interface RunsOptionsOption {
    id: number;
    label: string;
    noOdds: number;
    yesOdds: number;
    marketType: string;
  }
interface MatchBettingOptionsProps {
  match: Match;
  oddsUpdateCount: number;
  generateRandomOdds: () => string;
}

export function MatchBettingOptions({ match, oddsUpdateCount, generateRandomOdds }: MatchBettingOptionsProps) {
  const generateMatchCardData = () => {
    if (!match) return null;
  
    const localTeamId = match.localTeam.id?.toString() || 'local-id';
    const visitorTeamId = match.visitorTeam.id?.toString() || 'visitor-id';
    const localTeamName = match.localTeam.name || 'Local Team';
    const visitorTeamName = match.visitorTeam.name || 'Visitor Team';
    const localTeamShort = localTeamName.length > 15 ? `${localTeamName.substring(0, 12)}...` : localTeamName;
    const visitorTeamShort = visitorTeamName.length > 15 ? `${visitorTeamName.substring(0, 12)}...` : visitorTeamName;
  
    return {
      matchId: match.id,
      userId: "current-user-id",
      matchOdds: [
        { teamId: localTeamId, team: localTeamName, back: generateRandomOdds(), lay: (parseFloat(generateRandomOdds()) + 0.01).toFixed(2), stake: "100" },
        { teamId: visitorTeamId, team: visitorTeamName, back: generateRandomOdds(), lay: (parseFloat(generateRandomOdds()) + 0.01).toFixed(2), stake: "100" }
      ],
      bookmakerOdds: [
        { teamId: localTeamId, team: localTeamShort, back: rand(80, 90).toString(), lay: rand(85, 95).toString(), stake: "100" },
        { teamId: visitorTeamId, team: visitorTeamShort, back: rand(110, 120).toString(), lay: rand(115, 125).toString(), stake: "100" }
      ],
      tossOdds: [
        { teamId: localTeamId, team: localTeamShort, back: rand(95, 100).toString(), lay: "0", stake: "100" },
        { teamId: visitorTeamId, team: visitorTeamShort, back: rand(95, 100).toString(), lay: "0", stake: "100" }
      ],
      winPrediction: [
        { teamId: localTeamId, team: localTeamName, odds: generateRandomOdds() },
        { teamId: visitorTeamId, team: visitorTeamName, odds: generateRandomOdds() }
      ]
    };
  };

  const matchCardData = generateMatchCardData();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-center sm:space-x-8 md:space-x-20 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white text-center mb-2 sm:mb-0 hover:text-yellow-400 transition-colors">
          General Betting Options
        </h2>
        <Link href="/fancy" className="text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-white hover:text-yellow-400 transition-colors">
            Fancy Betting Options
          </h2>
        </Link>
      </div>
      <div className="flex items-center justify-center">
        {matchCardData ? (
          <MatchCard {...matchCardData} key={`match-card-${oddsUpdateCount}`} />
        ) : (
          <p className="text-gray-500">Match betting data not available yet.</p>
        )}
      </div>
    </div>
  );
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}