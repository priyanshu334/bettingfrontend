"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RunsOptionsCard from "@/components/RunsOptionCard";
import PlayerRunsCard from "@/components/PlayerRunsCard";
import PlayerWicketsCard from "@/components/PlayerWicketsCard";
import PlayerBoundariesCard from "@/components/PlayerBoundariesCard";
import BowlerRunsCard from "@/components/BowlerRunsCard";
import MatchCard from "@/components/MatchCard";
import { MdLocationOn, MdCalendarToday } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";

// ========================================================================
// TYPE DEFINITIONS
// ========================================================================

interface Team {
  id: number;
  name: string;
  image_path: string;
}

interface Player {
  id: number;
  team_id: number;
  fullname: string;
  firstname: string;
  lastname: string;
  position: string;
}

interface RawApiPlayer {
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

interface Match {
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

interface PlayerRunsDisplayData {
  id: number;
  name: string;
  runs: number;
  buttons: string[];
}

interface PlayerWicketsDisplayData {
  id: number;
  name: string;
  wickets: number;
  buttons: string[];
}

interface PlayerBoundariesDisplayData {
  id: number;
  name: string;
  boundaries: number;
  buttons: string[];
}

interface BowlerRunsDisplayData {
  id: number;
  name: string;
  runsConceded: number;
  buttons: string[];
}

interface RunsOptionsOption {
  id: number;
  label: string;
  noOdds: number;
  yesOdds: number;
}

const battingRoles = ['Batsman', 'Wicketkeeper', 'Allrounder', 'Batting Allrounder'];
const bowlingRoles = ['Bowler', 'Allrounder', 'Batting Allrounder'];

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

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [visitorPlayers, setVisitorPlayers] = useState<Player[]>([]);
  const [oddsUpdateCount, setOddsUpdateCount] = useState(0);

  const generateRandomOdds = useCallback(() => {
    return (Math.random() * 2 + 1).toFixed(2);
  }, []);

  const rand = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const updateAllOdds = useCallback(() => {
    setOddsUpdateCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    const interval = setInterval(updateAllOdds, 50000);
    return () => clearInterval(interval);
  }, [updateAllOdds]);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!id) {
        setError("Match ID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/fixtures/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error(`Match with ID ${id} not found.`);
          throw new Error(`Failed to fetch match data (status ${res.status})`);
        }
        const data = await res.json();
        if (!data || !data.data) throw new Error("Invalid API response structure.");

        const fixture = data.data;
        const localTeam: Team = fixture.localteam || { id: 0, name: 'TBD', image_path: '/team-placeholder.png' };
        const visitorTeam: Team = fixture.visitorteam || { id: 0, name: 'TBD', image_path: '/team-placeholder.png' };
        const venueName = fixture.venue?.name || "Venue TBD";

        let formattedDate = "Date TBD";
        if (fixture.starting_at) {
          try {
             const startingAt = new Date(fixture.starting_at);
             const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: true };
             formattedDate = startingAt.toLocaleString("en-IN", options);
          } catch (dateError) {
             console.error("Error formatting date:", dateError);
             formattedDate = fixture.starting_at;
          }
        }

        const rawLineup: RawApiPlayer[] = fixture.lineup || [];
        const processedLineup: Player[] = rawLineup
            .map((playerData: RawApiPlayer): Player | null => {
                if (!playerData || !playerData.lineup || !playerData.id || playerData.lineup.substitution === true) {
                    return null;
                }
                return {
                    id: playerData.id,
                    team_id: playerData.lineup.team_id,
                    fullname: playerData.fullname || `${playerData.firstname || ''} ${playerData.lastname || ''}`.trim(),
                    firstname: playerData.firstname || '',
                    lastname: playerData.lastname || '',
                    position: playerData.position?.name || 'Unknown',
                };
            })
            .filter((player): player is Player => player !== null && player.team_id !== undefined);

        const matchData: Match = {
            id: fixture.id,
            match: `${localTeam.name} vs. ${visitorTeam.name}`,
            date: formattedDate,
            venue: venueName,
            localTeam: localTeam,
            visitorTeam: visitorTeam,
            localTeamLogo: localTeam.image_path || '/team-placeholder.png',
            visitorTeamLogo: visitorTeam.image_path || '/team-placeholder.png',
            score: fixture.status === 'Finished' ? `Score: ${fixture.scoreboards?.find((s: any) => s.type === 'total')?.score || 'N/A'}` : (fixture.status || "Match not started"),
            lineup: processedLineup
        };
        setMatch(matchData);

        const localTeamId = localTeam.id;
        const visitorTeamId = visitorTeam.id;

        const localTeamPlayers = processedLineup.filter(p => p.team_id === localTeamId);
        const visitorTeamPlayers = processedLineup.filter(p => p.team_id === visitorTeamId);

        setLocalPlayers(localTeamPlayers);
        setVisitorPlayers(visitorTeamPlayers);

      } catch (err) {
          console.error("Error fetching match details:", err);
          setError(err instanceof Error ? err.message : "An unknown error occurred while fetching match data.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [id]);

  const filterPlayersByRole = useCallback((team: "local" | "visitor", roleFilter: string[]): Player[] => {
    const teamPlayers = team === "local" ? localPlayers : visitorPlayers;
    if (!teamPlayers || teamPlayers.length === 0) {
      return [];
    }
    return teamPlayers.filter(player => roleFilter.includes(player.position));
  }, [localPlayers, visitorPlayers]);

  const generateMatchCardData = useCallback(() => {
    if (!match) return null;
  
    const localTeamId = match.localTeam.id?.toString() || 'local-id';
    const visitorTeamId = match.visitorTeam.id?.toString() || 'visitor-id';
    const localTeamName = match.localTeam.name || 'Local Team';
    const visitorTeamName = match.visitorTeam.name || 'Visitor Team';
    const localTeamShort = localTeamName.length > 15 ? `${localTeamName.substring(0, 12)}...` : localTeamName;
    const visitorTeamShort = visitorTeamName.length > 15 ? `${visitorTeamName.substring(0, 12)}...` : visitorTeamName;
  
    return {
      matchId: match.id,
      userId: "current-user-id", // Replace this with actual user ID
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
  }, [match, generateRandomOdds]);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white bg-gray-900">Loading match details...</div>;
  }

  if (error || !match) {
      return (
        <div className="container mx-auto p-4 text-center text-red-500 bg-gray-900 min-h-screen">
          <Card className="bg-gray-800 border-red-500 p-6 inline-block">
            <CardHeader><CardTitle className="text-2xl mb-4 text-red-400">Error Loading Match</CardTitle></CardHeader>
            <CardContent>
                <p className="mb-4 text-gray-300">{error || "Match data could not be loaded."}</p>
                <Link href="/matches" className="text-blue-400 hover:text-blue-300 underline">Return to matches list</Link>
            </CardContent>
          </Card>
        </div>
      );
  }

  const localBattingPlayers = filterPlayersByRole("local", battingRoles);
  const visitorBattingPlayers = filterPlayersByRole("visitor", battingRoles);
  const localBowlingPlayers = filterPlayersByRole("local", bowlingRoles);
  const visitorBowlingPlayers = filterPlayersByRole("visitor", bowlingRoles);

  const playerRunsData: PlayerRunsDisplayData[] = localBattingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runs: rand(10, 80),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorPlayerRunsData: PlayerRunsDisplayData[] = visitorBattingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runs: rand(10, 80),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const playerWicketsData: PlayerWicketsDisplayData[] = localBowlingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    wickets: rand(0, 3),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorPlayerWicketsData: PlayerWicketsDisplayData[] = visitorBowlingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    wickets: rand(0, 3),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const playerBoundariesData: PlayerBoundariesDisplayData[] = localBattingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    boundaries: rand(0, 6),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorPlayerBoundariesData: PlayerBoundariesDisplayData[] = visitorBattingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    boundaries: rand(0, 6),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const bowlerRunsData: BowlerRunsDisplayData[] = localBowlingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runsConceded: rand(15, 50),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const visitorBowlerRunsData: BowlerRunsDisplayData[] = visitorBowlingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    runsConceded: rand(15, 50),
    buttons: [`Over:${generateRandomOdds()}`, `Under:${generateRandomOdds()}`],
  }));

  const runsAndWicketsData = {
    matchId: match.id,
    userId: "current-user-id",
    heading: "Innings Runs & Wickets",
    options: [
      { id: 1, label: `1 Over (${match.localTeam.name})`, noOdds: rand(5, 15), yesOdds: rand(5, 15), marketType: "runs" },
      { id: 2, label: `6 Overs (${match.localTeam.name})`, noOdds: rand(40, 55), yesOdds: rand(40, 55), marketType: "runs" },
      { id: 3, label: `10 Overs (${match.localTeam.name})`, noOdds: rand(70, 90), yesOdds: rand(70, 90), marketType: "runs" },
      { id: 4, label: `15 Overs (${match.localTeam.name})`, noOdds: rand(100, 125), yesOdds: rand(100, 125), marketType: "runs" },
      { id: 5, label: `20 Overs (${match.localTeam.name})`, noOdds: rand(150, 180), yesOdds: rand(150, 180), marketType: "runs" },
      { id: 6, label: `1 Over (${match.visitorTeam.name})`, noOdds: rand(5, 15), yesOdds: rand(5, 15), marketType: "runs" },
      { id: 7, label: `6 Overs (${match.visitorTeam.name})`, noOdds: rand(40, 55), yesOdds: rand(40, 55), marketType: "runs" },
      { id: 8, label: `10 Overs (${match.visitorTeam.name})`, noOdds: rand(70, 90), yesOdds: rand(70, 90), marketType: "runs" },
      { id: 9, label: `15 Overs (${match.visitorTeam.name})`, noOdds: rand(100, 125), yesOdds: rand(100, 125), marketType: "runs" },
      { id: 10, label: `20 Overs (${match.visitorTeam.name})`, noOdds: rand(150, 180), yesOdds: rand(150, 180), marketType: "runs" },
      { id: 11, label: `Total Match Runs (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: rand(300, 360), yesOdds: rand(300, 360), marketType: "totals" },
      { id: 12, label: `Total Match 4s (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: rand(20, 35), yesOdds: rand(20, 35), marketType: "totals" },
      { id: 13, label: `Total Match 6s (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: rand(10, 25), yesOdds: rand(10, 25), marketType: "totals" },
      { id: 14, label: `6 Over Wickets (${match.localTeam.name})`, noOdds: rand(1, 3), yesOdds: rand(1, 3), marketType: "wickets" },
      { id: 15, label: `10 Over Wickets (${match.localTeam.name})`, noOdds: rand(2, 4), yesOdds: rand(2, 4), marketType: "wickets" },
      { id: 16, label: `15 Over Wickets (${match.localTeam.name})`, noOdds: rand(3, 5), yesOdds: rand(3, 5), marketType: "wickets" },
      { id: 17, label: `20 Over Wickets (${match.localTeam.name})`, noOdds: rand(4, 7), yesOdds: rand(4, 7), marketType: "wickets" },
      { id: 18, label: `6 Over Wickets (${match.visitorTeam.name})`, noOdds: rand(1, 3), yesOdds: rand(1, 3), marketType: "wickets" },
      { id: 19, label: `10 Over Wickets (${match.visitorTeam.name})`, noOdds: rand(2, 4), yesOdds: rand(2, 4), marketType: "wickets" },
      { id: 20, label: `15 Over Wickets (${match.visitorTeam.name})`, noOdds: rand(3, 5), yesOdds: rand(3, 5), marketType: "wickets" },
      { id: 21, label: `20 Over Wickets (${match.visitorTeam.name})`, noOdds: rand(4, 7), yesOdds: rand(4, 7), marketType: "wickets" },
      { id: 22, label: `Total Match Wickets (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: rand(9, 14), yesOdds: rand(9, 14), marketType: "totals" }
    ]
  };
  

  const matchCardData = generateMatchCardData();

  return (
    <div className="container mx-auto p-4 bg-gray-900 min-h-screen text-gray-200">
      <Card className="mb-8 bg-gray-800 border-gray-700 shadow-lg overflow-hidden">
         <CardHeader className="pb-4">
           <CardTitle className="text-2xl md:text-3xl font-bold text-white text-center">{match.match}</CardTitle>
           <div className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-400 mt-2">
             <span className="flex items-center"><MdLocationOn className="mr-1 flex-shrink-0" /> {match.venue}</span>
             <span className="flex items-center"><MdCalendarToday className="mr-1 flex-shrink-0" /> {match.date}</span>
           </div>
         </CardHeader>
         <CardContent className="relative flex flex-col sm:flex-row justify-around items-center pt-4 pb-6 px-2">
           <div className="flex flex-col items-center text-center mb-4 sm:mb-0 w-full sm:w-1/3">
             {match.localTeamLogo && (
                <Image
                  src={match.localTeamLogo}
                  alt={`${match.localTeam.name} logo`}
                  width={64} height={64}
                  className="rounded-full mb-2 border-2 border-gray-600 bg-gray-700"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/team-placeholder.png'; }}
                />
             )}
             <span className={`font-semibold text-base md:text-lg text-white px-3 py-1 rounded break-words ${teamColors[match.localTeam.name] || 'bg-gray-600'}`}>{match.localTeam.name}</span>
           </div>
           <div className="text-xl font-bold text-gray-400 mx-2 my-2 sm:my-0">VS</div>
           <div className="flex flex-col items-center text-center w-full sm:w-1/3">
             {match.visitorTeamLogo && (
                <Image
                  src={match.visitorTeamLogo}
                  alt={`${match.visitorTeam.name} logo`}
                  width={64} height={64}
                  className="rounded-full mb-2 border-2 border-gray-600 bg-gray-700"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/team-placeholder.png'; }}
                />
             )}
             <span className={`font-semibold text-base md:text-lg text-white px-3 py-1 rounded break-words ${teamColors[match.visitorTeam.name] || 'bg-gray-600'}`}>{match.visitorTeam.name}</span>
           </div>
           {match.score && (
              <div className="w-full text-center mt-4 sm:mt-0 sm:absolute sm:top-2 sm:right-4">
                <Badge variant="secondary" className="text-xs sm:text-sm bg-gray-700 text-gray-200 px-2 py-1">{match.score}</Badge>
              </div>
            )}
         </CardContent>
      </Card>

      <div className="mb-8">
         <div className="flex flex-col sm:flex-row justify-center sm:space-x-8 md:space-x-20 mb-4">
           <h2 className="text-xl md:text-2xl font-semibold text-white text-center mb-2 sm:mb-0 hover:text-yellow-400 transition-colors">General Betting Options</h2>
           <Link href="/fancy" className="text-center"><h2 className="text-xl md:text-2xl font-semibold text-white hover:text-yellow-400 transition-colors">Fancy Betting Options</h2></Link>
         </div>
         <div className="flex items-center justify-center">
           {matchCardData ? (
             <MatchCard {...matchCardData} key={`match-card-${oddsUpdateCount}`} />
           ) : (
             <p className="text-gray-500">Match betting data not available yet.</p>
           )}
         </div>
       </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Match Runs & Wickets</h2>
        <RunsOptionsCard
  key="some-key"
  matchId={match.id}

  heading="Runs & Wickets"
  options={runsAndWicketsData.options}
  teamId={match.localTeam.id} // or match.visitorTeam.id
/>

      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Runs</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <PlayerRunsCard
            key={`local-runs-${oddsUpdateCount}`}
            matchId={match.id}
   
            heading={`${match.localTeam.name}`}
            players={playerRunsData}
          />
          <PlayerRunsCard
            key={`visitor-runs-${oddsUpdateCount}`}
            matchId={match.id}
  
            heading={`${match.visitorTeam.name}`}
            players={visitorPlayerRunsData}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Wickets</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <PlayerWicketsCard
            key={`local-wickets-${oddsUpdateCount}`}
            matchId={match.id}
      
            heading={`${match.localTeam.name}`}
            players={playerWicketsData}
          />
          <PlayerWicketsCard
            key={`visitor-wickets-${oddsUpdateCount}`}
            matchId={match.id}
        
            heading={`${match.visitorTeam.name}`}
            players={visitorPlayerWicketsData}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Total Boundaries</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <PlayerBoundariesCard
            key={`local-boundaries-${oddsUpdateCount}`}
            matchId={match.id}
  
            heading={`${match.localTeam.name}`}
            players={playerBoundariesData}
          />
          <PlayerBoundariesCard
            key={`visitor-boundaries-${oddsUpdateCount}`}
            matchId={match.id}

            heading={`${match.visitorTeam.name}`}
            players={visitorPlayerBoundariesData}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Bowler Runs Conceded</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <BowlerRunsCard
            key={`local-bowler-${oddsUpdateCount}`}
            matchId={match.id}

            heading={`${match.localTeam.name}`}
            players={bowlerRunsData}
          />
          <BowlerRunsCard
            key={`visitor-bowler-${oddsUpdateCount}`}
            matchId={match.id}
    
            heading={`${match.visitorTeam.name}`}
            players={visitorBowlerRunsData}
          />
        </div>
      </div>
    </div>
  );
}