"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import LiveScoreDisplay from "@/components/Scoredisplay";
import { MatchHeader} from "@/components/MatchHeader";
import { MatchBettingOptions } from "@/components/MatchBettingOptions";
import { RunsAndWicketsSection } from "@/components/RunsAndWicketsSection";
import { PlayerStatsSection } from "@/components/PlayerStatsSection";

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
            lineup: processedLineup,
            status: fixture.status
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white bg-gray-900">Loading match details...</div>;
  }

  if (error || !match) {
      return (
        <div className="container mx-auto p-4 text-center text-red-500 bg-gray-900 min-h-screen">
          <Card className="bg-gray-800 border-red-500 p-6 inline-block">
            <CardContent>
                <p className="mb-4 text-gray-300">{error || "Match data could not be loaded."}</p>
                <Link href="/matches" className="text-blue-400 hover:text-blue-300 underline">Return to matches list</Link>
            </CardContent>
          </Card>
        </div>
      );
  }

  return (
    <div className="container mx-auto p-4 bg-gray-900 min-h-screen text-gray-200">
      <MatchHeader
        match={match}
 
      />
      
      <LiveScoreDisplay />
      
      <MatchBettingOptions
        match={match}
        oddsUpdateCount={oddsUpdateCount}
        generateRandomOdds={generateRandomOdds}
      />
      
      <RunsAndWicketsSection
        match={match}

      />
      
      <PlayerStatsSection
        match={match}
        
        oddsUpdateCount={oddsUpdateCount}
        generateRandomOdds={generateRandomOdds}
      />
    </div>
  );
}