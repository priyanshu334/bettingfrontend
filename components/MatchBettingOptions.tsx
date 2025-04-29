import MatchCard from "@/components/MatchCard";
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

interface MatchBettingOptionsProps {
  match: Match;
  oddsUpdateCount: number;
  generateRandomOdds: () => string;
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function MatchBettingOptions({
  match,
  oddsUpdateCount,
  generateRandomOdds,
}: MatchBettingOptionsProps) {
  const [currentMatch, setCurrentMatch] = useState<Match>(match);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch match data every 2 minutes
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/fixtures/${match.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch match data');
        }
        const data = await response.json();
        setCurrentMatch(transformApiData(data.data));
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching match data:', error);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchMatchData, 120000); // 2 minutes

    // Initial fetch
    fetchMatchData();

    return () => clearInterval(interval);
  }, [match.id]);

  // Transform API data to match our interface
  const transformApiData = (apiData: any): Match => {
    return {
      id: apiData.id,
      match: apiData.name,
      date: apiData.starting_at,
      venue: apiData.venue?.name || 'Unknown venue',
      localTeam: {
        id: apiData.localteam_id,
        name: apiData.localteam?.name || 'Local Team',
        image_path: apiData.localteam?.image_path || '',
      },
      visitorTeam: {
        id: apiData.visitorteam_id,
        name: apiData.visitorteam?.name || 'Visitor Team',
        image_path: apiData.visitorteam?.image_path || '',
      },
      localTeamLogo: apiData.localteam?.image_path || '',
      visitorTeamLogo: apiData.visitorteam?.image_path || '',
      score: apiData.score,
      lineup: apiData.lineup?.data?.map((player: any) => ({
        id: player.id,
        team_id: player.team_id,
        fullname: player.fullname,
        firstname: player.firstname,
        lastname: player.lastname,
        position: player.position?.name || '',
      })) || [],
      status: {
        tossCompleted: apiData.tosswon !== null,
        tossWinner: apiData.tosswon 
          ? { 
              id: apiData.tosswon, 
              name: apiData.tosswon === apiData.localteam_id 
                ? apiData.localteam?.name || 'Local Team' 
                : apiData.visitorteam?.name || 'Visitor Team',
              image_path: apiData.tosswon === apiData.localteam_id 
                ? apiData.localteam?.image_path || '' 
                : apiData.visitorteam?.image_path || '',
            }
          : undefined,
        battingFirst: apiData.batting_first !== null
          ? {
              id: apiData.batting_first,
              name: apiData.batting_first === apiData.localteam_id
                ? apiData.localteam?.name || 'Local Team'
                : apiData.visitorteam?.name || 'Visitor Team',
              image_path: apiData.batting_first === apiData.localteam_id
                ? apiData.localteam?.image_path || ''
                : apiData.visitorteam?.image_path || '',
            }
          : undefined,
        innings: apiData.innings,
        currentInnings: apiData.innings
          ? {
              battingTeam: {
                id: apiData.innings % 2 === 1 ? apiData.batting_first : (apiData.batting_first === apiData.localteam_id ? apiData.visitorteam_id : apiData.localteam_id),
                name: apiData.innings % 2 === 1 
                  ? (apiData.batting_first === apiData.localteam_id 
                      ? apiData.localteam?.name || 'Local Team' 
                      : apiData.visitorteam?.name || 'Visitor Team')
                  : (apiData.batting_first === apiData.localteam_id 
                      ? apiData.visitorteam?.name || 'Visitor Team' 
                      : apiData.localteam?.name || 'Local Team'),
                image_path: apiData.innings % 2 === 1
                  ? (apiData.batting_first === apiData.localteam_id
                      ? apiData.localteam?.image_path || ''
                      : apiData.visitorteam?.image_path || '')
                  : (apiData.batting_first === apiData.localteam_id
                      ? apiData.visitorteam?.image_path || ''
                      : apiData.localteam?.image_path || ''),
              },
              bowlingTeam: {
                id: apiData.innings % 2 === 1 ? (apiData.batting_first === apiData.localteam_id ? apiData.visitorteam_id : apiData.localteam_id) : apiData.batting_first,
                name: apiData.innings % 2 === 1
                  ? (apiData.batting_first === apiData.localteam_id
                      ? apiData.visitorteam?.name || 'Visitor Team'
                      : apiData.localteam?.name || 'Local Team')
                  : (apiData.batting_first === apiData.localteam_id
                      ? apiData.localteam?.name || 'Local Team'
                      : apiData.visitorteam?.name || 'Visitor Team'),
                image_path: apiData.innings % 2 === 1
                  ? (apiData.batting_first === apiData.localteam_id
                      ? apiData.visitorteam?.image_path || ''
                      : apiData.localteam?.image_path || '')
                  : (apiData.batting_first === apiData.localteam_id
                      ? apiData.localteam?.image_path || ''
                      : apiData.visitorteam?.image_path || ''),
              },
            }
          : undefined,
        matchStarted: apiData.status === 'In Progress' || apiData.status === 'Finished',
        matchCompleted: apiData.status === 'Finished',
      },
    };
  };

  const generateMatchCardData = () => {
    if (!currentMatch) return null;

    const localTeamId = currentMatch.localTeam.id?.toString() || "local-id";
    const visitorTeamId = currentMatch.visitorTeam.id?.toString() || "visitor-id";
    const localTeamName = currentMatch.localTeam.name || "Local Team";
    const visitorTeamName = currentMatch.visitorTeam.name || "Visitor Team";
    const localTeamShort =
      localTeamName.length > 15
        ? `${localTeamName.substring(0, 12)}...`
        : localTeamName;
    const visitorTeamShort =
      visitorTeamName.length > 15
        ? `${visitorTeamName.substring(0, 12)}...`
        : visitorTeamName;

    return {
      matchId: currentMatch.id,
      userId: "current-user-id",
      matchOdds: [
        {
          teamId: localTeamId,
          team: localTeamName,
          back: generateRandomOdds(),
          lay: (parseFloat(generateRandomOdds()) + 0.01).toFixed(2),
          stake: "100",
        },
        {
          teamId: visitorTeamId,
          team: visitorTeamName,
          back: generateRandomOdds(),
          lay: (parseFloat(generateRandomOdds()) + 0.01).toFixed(2),
          stake: "100",
        },
      ],
      bookmakerOdds: [
        {
          teamId: localTeamId,
          team: localTeamShort,
          back: rand(80, 90).toString(),
          lay: rand(85, 95).toString(),
          stake: "100",
        },
        {
          teamId: visitorTeamId,
          team: visitorTeamShort,
          back: rand(110, 120).toString(),
          lay: rand(115, 125).toString(),
          stake: "100",
        },
      ],
      tossOdds: currentMatch.status.tossCompleted
        ? []
        : [
            {
              teamId: localTeamId,
              team: localTeamShort,
              back: rand(95, 100).toString(),
              lay: "0",
              stake: "100",
            },
            {
              teamId: visitorTeamId,
              team: visitorTeamShort,
              back: rand(95, 100).toString(),
              lay: "0",
              stake: "100",
            },
          ],
      winPrediction: [
        {
          teamId: localTeamId,
          team: localTeamName,
          odds: generateRandomOdds(),
        },
        {
          teamId: visitorTeamId,
          team: visitorTeamName,
          odds: generateRandomOdds(),
        },
      ],
    };
  };

  const matchCardData = generateMatchCardData();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-center sm:space-x-8 md:space-x-20 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white text-center mb-2 sm:mb-0 hover:text-yellow-400 transition-colors">
          General Betting Options
        </h2>
      </div>
      {loading && (
        <div className="text-center text-gray-400 mb-4">
          Updating match data...
        </div>
      )}
      <div className="text-center text-gray-400 text-sm mb-2">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
      <div className="flex items-center justify-center">
        {matchCardData ? (
          <MatchCard
            {...matchCardData}
            key={`match-card-${oddsUpdateCount}-${currentMatch.status.tossCompleted}`}
            hideToss={currentMatch.status.tossCompleted}
          />
        ) : (
          <p className="text-gray-500">Match betting data not available yet.</p>
        )}
      </div>
    </div>
  );
}