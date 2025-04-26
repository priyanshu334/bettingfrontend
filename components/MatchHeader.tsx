import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MdLocationOn, MdCalendarToday } from "react-icons/md";
import Image from "next/image";


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

interface MatchHeaderProps {
  match: Match;
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const teamColors: Record<string, string> = {
    "Mumbai Indians": "bg-blue-800",
    "Chennai Super Kings": "bg-yellow-500",
    "Royal Challengers Bengaluru": "bg-red-700",
    "Kolkata Knight Riders": "bg-purple-700",
    "Sunrisers Hyderabad": "bg-orange-500",
    "Delhi Capitals": "bg-blue-600",
    "Rajasthan Royals": "bg-pink-600",
    "Punjab Kings": "bg-red-600",
    "Gujarat Titans": "bg-cyan-600",
    "Lucknow Super Giants": "bg-sky-600"
  };

  return (
    <Card className="mb-8 bg-gray-800 border-gray-700 shadow-lg overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl md:text-3xl font-bold text-white text-center">
          {match.match}
          {match.status.matchCompleted && (
            <Badge className="ml-2 bg-red-600">Completed</Badge>
          )}
          {match.status.matchStarted && !match.status.matchCompleted && (
            <Badge className="ml-2 bg-green-600">Live</Badge>
          )}
        </CardTitle>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-400 mt-2">
          <span className="flex items-center">
            <MdLocationOn className="mr-1 flex-shrink-0" /> {match.venue}
          </span>
          <span className="flex items-center">
            <MdCalendarToday className="mr-1 flex-shrink-0" /> {match.date}
          </span>
          {match.status.tossCompleted && match.status.tossWinner && (
            <span className="flex items-center">
              Toss: {match.status.tossWinner.name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative flex flex-col sm:flex-row justify-around items-center pt-4 pb-6 px-2">
        <div className="flex flex-col items-center text-center mb-4 sm:mb-0 w-full sm:w-1/3">
          {match.localTeamLogo && (
            <Image
              src={match.localTeamLogo}
              alt={`${match.localTeam.name} logo`}
              width={64}
              height={64}
              className="rounded-full mb-2 border-2 border-gray-600 bg-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/team-placeholder.png';
              }}
            />
          )}
          <span
            className={`font-semibold text-base md:text-lg text-white px-3 py-1 rounded break-words ${
              teamColors[match.localTeam.name] || 'bg-gray-600'
            }`}
          >
            {match.localTeam.name}
          </span>
        </div>
        <div className="text-xl font-bold text-gray-400 mx-2 my-2 sm:my-0">VS</div>
        <div className="flex flex-col items-center text-center w-full sm:w-1/3">
          {match.visitorTeamLogo && (
            <Image
              src={match.visitorTeamLogo}
              alt={`${match.visitorTeam.name} logo`}
              width={64}
              height={64}
              className="rounded-full mb-2 border-2 border-gray-600 bg-gray-700"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/team-placeholder.png';
              }}
            />
          )}
          <span
            className={`font-semibold text-base md:text-lg text-white px-3 py-1 rounded break-words ${
              teamColors[match.visitorTeam.name] || 'bg-gray-600'
            }`}
          >
            {match.visitorTeam.name}
          </span>
        </div>
        {match.score && (
          <div className="w-full text-center mt-4 sm:mt-0 sm:absolute sm:top-2 sm:right-4">
            <Badge variant="secondary" className="text-xs sm:text-sm bg-gray-700 text-gray-200 px-2 py-1">
              {match.score}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}