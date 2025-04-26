import  RunsOptionsCard  from "@/components/RunsOptionCard";


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

interface RunsAndWicketsSectionProps {
  match: Match;
}

export function RunsAndWicketsSection({ match }: RunsAndWicketsSectionProps) {
  const shouldShowLocalBatting =
    !match.status.currentInnings ||
    match.status.currentInnings.battingTeam.id === match.localTeam.id;
  const shouldShowVisitorBatting =
    !match.status.currentInnings ||
    match.status.currentInnings.battingTeam.id === match.visitorTeam.id;

  const allOptions = [
    // Local team batting options
    {
      id: 1,
      label: `1 Over (${match.localTeam.name})`,
      noOdds: rand(5, 15),
      yesOdds: rand(5, 15),
      marketType: "runs",
      show: shouldShowLocalBatting,
    },
    {
      id: 2,
      label: `6 Overs (${match.localTeam.name})`,
      noOdds: rand(40, 55),
      yesOdds: rand(40, 55),
      marketType: "runs",
      show: shouldShowLocalBatting,
    },
    {
      id: 3,
      label: `10 Overs (${match.localTeam.name})`,
      noOdds: rand(70, 90),
      yesOdds: rand(70, 90),
      marketType: "runs",
      show: shouldShowLocalBatting,
    },
    {
      id: 4,
      label: `15 Overs (${match.localTeam.name})`,
      noOdds: rand(100, 125),
      yesOdds: rand(100, 125),
      marketType: "runs",
      show: shouldShowLocalBatting,
    },
    {
      id: 5,
      label: `20 Overs (${match.localTeam.name})`,
      noOdds: rand(150, 180),
      yesOdds: rand(150, 180),
      marketType: "runs",
      show: shouldShowLocalBatting,
    },
    // Visitor team batting options
    {
      id: 6,
      label: `1 Over (${match.visitorTeam.name})`,
      noOdds: rand(5, 15),
      yesOdds: rand(5, 15),
      marketType: "runs",
      show: shouldShowVisitorBatting,
    },
    {
      id: 7,
      label: `6 Overs (${match.visitorTeam.name})`,
      noOdds: rand(40, 55),
      yesOdds: rand(40, 55),
      marketType: "runs",
      show: shouldShowVisitorBatting,
    },
    {
      id: 8,
      label: `10 Overs (${match.visitorTeam.name})`,
      noOdds: rand(70, 90),
      yesOdds: rand(70, 90),
      marketType: "runs",
      show: shouldShowVisitorBatting,
    },
    {
      id: 9,
      label: `15 Overs (${match.visitorTeam.name})`,
      noOdds: rand(100, 125),
      yesOdds: rand(100, 125),
      marketType: "runs",
      show: shouldShowVisitorBatting,
    },
    {
      id: 10,
      label: `20 Overs (${match.visitorTeam.name})`,
      noOdds: rand(150, 180),
      yesOdds: rand(150, 180),
      marketType: "runs",
      show: shouldShowVisitorBatting,
    },
    // Totals (always show)
    {
      id: 11,
      label: `Total Match Runs (${match.localTeam.name} vs ${match.visitorTeam.name})`,
      noOdds: rand(300, 360),
      yesOdds: rand(300, 360),
      marketType: "totals",
      show: true,
    },
    {
      id: 12,
      label: `Total Match 4s (${match.localTeam.name} vs ${match.visitorTeam.name})`,
      noOdds: rand(20, 35),
      yesOdds: rand(20, 35),
      marketType: "totals",
      show: true,
    },
    {
      id: 13,
      label: `Total Match 6s (${match.localTeam.name} vs ${match.visitorTeam.name})`,
      noOdds: rand(10, 25),
      yesOdds: rand(10, 25),
      marketType: "totals",
      show: true,
    },
    // Local team bowling options
    {
      id: 14,
      label: `6 Over Wickets (${match.localTeam.name})`,
      noOdds: rand(1, 3),
      yesOdds: rand(1, 3),
      marketType: "wickets",
      show: !shouldShowLocalBatting,
    },
    {
      id: 15,
      label: `10 Over Wickets (${match.localTeam.name})`,
      noOdds: rand(2, 4),
      yesOdds: rand(2, 4),
      marketType: "wickets",
      show: !shouldShowLocalBatting,
    },
    {
      id: 16,
      label: `15 Over Wickets (${match.localTeam.name})`,
      noOdds: rand(3, 5),
      yesOdds: rand(3, 5),
      marketType: "wickets",
      show: !shouldShowLocalBatting,
    },
    {
      id: 17,
      label: `20 Over Wickets (${match.localTeam.name})`,
      noOdds: rand(4, 7),
      yesOdds: rand(4, 7),
      marketType: "wickets",
      show: !shouldShowLocalBatting,
    },
    // Visitor team bowling options
    {
      id: 18,
      label: `6 Over Wickets (${match.visitorTeam.name})`,
      noOdds: rand(1, 3),
      yesOdds: rand(1, 3),
      marketType: "wickets",
      show: !shouldShowVisitorBatting,
    },
    {
      id: 19,
      label: `10 Over Wickets (${match.visitorTeam.name})`,
      noOdds: rand(2, 4),
      yesOdds: rand(2, 4),
      marketType: "wickets",
      show: !shouldShowVisitorBatting,
    },
    {
      id: 20,
      label: `15 Over Wickets (${match.visitorTeam.name})`,
      noOdds: rand(3, 5),
      yesOdds: rand(3, 5),
      marketType: "wickets",
      show: !shouldShowVisitorBatting,
    },
    {
      id: 21,
      label: `20 Over Wickets (${match.visitorTeam.name})`,
      noOdds: rand(4, 7),
      yesOdds: rand(4, 7),
      marketType: "wickets",
      show: !shouldShowVisitorBatting,
    },
    // Totals (always show)
    {
      id: 22,
      label: `Total Match Wickets (${match.localTeam.name} vs ${match.visitorTeam.name})`,
      noOdds: rand(9, 14),
      yesOdds: rand(9, 14),
      marketType: "totals",
      show: true,
    },
  ];

  const filteredOptions = allOptions
    .filter((option) => option.show)
    .map(({ show, ...rest }) => rest);

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
        Match Runs & Wickets
      </h2>
      <RunsOptionsCard
        key={`runs-wickets-${match.id}-${match.status.innings || 0}`}
        matchId={match.id}
        heading="Runs & Wickets"
        options={filteredOptions}
        teamId={match.localTeam.id}
      />
    </div>
  );
}