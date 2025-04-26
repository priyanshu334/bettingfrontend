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