import  RunsOptionsCard  from "./RunsOptionCard";


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
interface RunsAndWicketsSectionProps {
  matchId: number;
  localTeam: Team;
  visitorTeam: Team;
}

export function RunsAndWicketsSection({ matchId, localTeam, visitorTeam }: RunsAndWicketsSectionProps) {
  const runsAndWicketsData = {
    matchId,
    userId: "current-user-id",
    heading: "Innings Runs & Wickets",
    options: [
      { id: 1, label: `1 Over (${localTeam.name})`, noOdds: rand(5, 15), yesOdds: rand(5, 15), marketType: "runs" },
      { id: 2, label: `6 Overs (${localTeam.name})`, noOdds: rand(40, 55), yesOdds: rand(40, 55), marketType: "runs" },
      { id: 3, label: `10 Overs (${localTeam.name})`, noOdds: rand(70, 90), yesOdds: rand(70, 90), marketType: "runs" },
      { id: 4, label: `15 Overs (${localTeam.name})`, noOdds: rand(100, 125), yesOdds: rand(100, 125), marketType: "runs" },
      { id: 5, label: `20 Overs (${localTeam.name})`, noOdds: rand(150, 180), yesOdds: rand(150, 180), marketType: "runs" },
      { id: 6, label: `1 Over (${visitorTeam.name})`, noOdds: rand(5, 15), yesOdds: rand(5, 15), marketType: "runs" },
      { id: 7, label: `6 Overs (${visitorTeam.name})`, noOdds: rand(40, 55), yesOdds: rand(40, 55), marketType: "runs" },
      { id: 8, label: `10 Overs (${visitorTeam.name})`, noOdds: rand(70, 90), yesOdds: rand(70, 90), marketType: "runs" },
      { id: 9, label: `15 Overs (${visitorTeam.name})`, noOdds: rand(100, 125), yesOdds: rand(100, 125), marketType: "runs" },
      { id: 10, label: `20 Overs (${visitorTeam.name})`, noOdds: rand(150, 180), yesOdds: rand(150, 180), marketType: "runs" },
      { id: 11, label: `Total Match Runs (${localTeam.name} vs ${visitorTeam.name})`, noOdds: rand(300, 360), yesOdds: rand(300, 360), marketType: "totals" },
      { id: 12, label: `Total Match 4s (${localTeam.name} vs ${visitorTeam.name})`, noOdds: rand(20, 35), yesOdds: rand(20, 35), marketType: "totals" },
      { id: 13, label: `Total Match 6s (${localTeam.name} vs ${visitorTeam.name})`, noOdds: rand(10, 25), yesOdds: rand(10, 25), marketType: "totals" },
      { id: 14, label: `6 Over Wickets (${localTeam.name})`, noOdds: rand(1, 3), yesOdds: rand(1, 3), marketType: "wickets" },
      { id: 15, label: `10 Over Wickets (${localTeam.name})`, noOdds: rand(2, 4), yesOdds: rand(2, 4), marketType: "wickets" },
      { id: 16, label: `15 Over Wickets (${localTeam.name})`, noOdds: rand(3, 5), yesOdds: rand(3, 5), marketType: "wickets" },
      { id: 17, label: `20 Over Wickets (${localTeam.name})`, noOdds: rand(4, 7), yesOdds: rand(4, 7), marketType: "wickets" },
      { id: 18, label: `6 Over Wickets (${visitorTeam.name})`, noOdds: rand(1, 3), yesOdds: rand(1, 3), marketType: "wickets" },
      { id: 19, label: `10 Over Wickets (${visitorTeam.name})`, noOdds: rand(2, 4), yesOdds: rand(2, 4), marketType: "wickets" },
      { id: 20, label: `15 Over Wickets (${visitorTeam.name})`, noOdds: rand(3, 5), yesOdds: rand(3, 5), marketType: "wickets" },
      { id: 21, label: `20 Over Wickets (${visitorTeam.name})`, noOdds: rand(4, 7), yesOdds: rand(4, 7), marketType: "wickets" },
      { id: 22, label: `Total Match Wickets (${localTeam.name} vs ${visitorTeam.name})`, noOdds: rand(9, 14), yesOdds: rand(9, 14), marketType: "totals" }
    ]
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Match Runs & Wickets</h2>
      <RunsOptionsCard
        key="runs-wickets-card"
        matchId={matchId}
        heading="Runs & Wickets"
        options={runsAndWicketsData.options}
        teamId={localTeam.id}
      />
    </div>
  );
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}