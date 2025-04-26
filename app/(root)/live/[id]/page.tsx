"use client";
import React, { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import useScoreStore from "@/stores/useScoreStore";

interface Team {
  id: number;
  name: string;
  code: string;
  image_path: string;
}

interface Player {
  id: number;
  name: string;
  image_path?: string;
}

interface Batting {
  id: number;
  player_id: number;
  player_name?: string;
  score: number;
  ball?: number;
  four_x: number;
  six_x: number;
  rate: number;
  team_id: number;
  active: boolean;
}

interface Bowling {
  id: number;
  player_id: number;
  player_name?: string;
  overs: number;
  runs: number;
  wickets: number;
  wide: number;
  noball: number;
  rate: number;
  team_id: number;
  active: boolean;
}

interface Runs {
  team_id: number;
  inning: number;
  score: number;
  wickets: number;
  overs: number;
}

interface FixtureData {
  id: number;
  localteam: Team;
  visitorteam: Team;
  venue: { name: string };
  starting_at: string;
  formatted_starting_at: string;
  status: string;
  note?: string;
  batting: Batting[];
  bowling: Bowling[];
  runs: Runs[];
  winner_team_id?: number;
  lineup?: {
    id: number;
    fullname: string;
    image_path: string;
    team_id: number;
  }[];
}

export default function LiveScorecard() {
  const { id } = useParams<{ id: string }>();
  const isFetching = useRef(false);
  
  // Use Zustand store
  const { 
    matches, 
    players, 
    loading, 
    error, 
    setMatch, 
    setPlayers, 
    setLoading, 
    setError, 
    setCurrentMatchId 
  } = useScoreStore();
  
  const match = id && matches[id] ? matches[id] : null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-IN", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const fetchMatchData = async (isInitialLoad = false) => {
    if (!id) {
      setError("Match ID is missing");
      setLoading(false);
      return;
    }

    if (isFetching.current) return;

    try {
      isFetching.current = true;
      if (isInitialLoad) setLoading(true);
      setError(null);

      const response = await fetch(`/api/live/${id}`);
      if (!response.ok) {
        let errorBody = "Unknown error";
        try { errorBody = await response.text(); } catch (_) {}
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
      }

      const data = await response.json();
      if (!data || !data.data) throw new Error("Invalid API response structure or empty data");
      if (!data.data.id || !data.data.localteam || !data.data.visitorteam || !data.data.starting_at) {
        throw new Error("Incomplete core data in API response");
      }

      // Process lineup data to create players map
      const playersMap: Record<number, Player> = {};
      if (data.data.lineup && Array.isArray(data.data.lineup)) {
        data.data.lineup.forEach((playerData: any) => {
          playersMap[playerData.id] = {
            id: playerData.id,
            name: playerData.fullname,
            image_path: playerData.image_path
          };
        });
      }
      setPlayers(playersMap);

      // Process the match data
      const processedData: FixtureData = {
        id: data.data.id,
        localteam: data.data.localteam,
        visitorteam: data.data.visitorteam,
        venue: data.data.venue || { name: "Unknown Venue" },
        starting_at: data.data.starting_at,
        formatted_starting_at: formatDate(data.data.starting_at),
        status: data.data.status || "Status Unknown",
        note: data.data.note,
        batting: data.data.batting || [],
        bowling: data.data.bowling || [],
        runs: data.data.runs || [],
        winner_team_id: data.data.winner_team_id,
        lineup: data.data.lineup
      };

      // Enhance player names in batting and bowling data
      processedData.batting = processedData.batting.map(batter => ({
        ...batter,
        player_name: playersMap[batter.player_id]?.name || batter.player_name || `Player ${batter.player_id}`
      }));
      
      processedData.bowling = processedData.bowling.map(bowler => ({
        ...bowler,
        player_name: playersMap[bowler.player_id]?.name || bowler.player_name || `Player ${bowler.player_id}`
      }));

      // Save match to Zustand store
      setMatch(id, processedData);
      // Set current match ID
      setCurrentMatchId(id);

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch match data");
    } finally {
      if (isInitialLoad) setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (!id) {
      setError("Match ID is missing");
      setLoading(false);
      return;
    }

    // If the match isn't in the store yet, or if we need a fresh fetch
    if (!matches[id]) {
      fetchMatchData(true);
    } else {
      setCurrentMatchId(id);
    }

    // Changed from 30000 to 60000 (1 minute) for the refresh interval
    const intervalId = setInterval(() => {
      if (id && (!matches[id] || matches[id].status !== "Finished")) {
        fetchMatchData(false);
      }
    }, 60000); // Update every 1 minute (60000ms) instead of 30 seconds

    return () => clearInterval(intervalId);
  }, [id, matches]);

  const getPlayerName = (playerId: number, defaultName?: string) => {
    return players[playerId]?.name || defaultName || `Player ${playerId}`;
  };

  const getPlayerImage = (playerId: number) => {
    return players[playerId]?.image_path || '/placeholder.png';
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 mt-6">
        <Skeleton className="w-full h-64 rounded-xl" />
        <Skeleton className="w-full h-40 rounded-xl mt-4" />
        <Skeleton className="w-full h-40 rounded-xl mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 mt-6 text-center">
        <p className="text-red-600 font-semibold">Error loading match data:</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <button
          onClick={() => fetchMatchData(true)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 mt-6 text-center text-gray-500">
        No match data available or match not found.
      </div>
    );
  }

  const getTeamRuns = (teamId: number) => {
    return match.runs.find(run => run.team_id === teamId);
  };

  const getBatters = (teamId: number) => {
    if (!match.batting) return [];
    return match.batting
      .filter(batter => batter.team_id === teamId)
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
  };

  const getBowlers = (teamId: number) => {
    if (!match.bowling) return [];
    return match.bowling
      .filter(bowler => bowler.team_id === teamId)
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
  };

  const localTeamRuns = getTeamRuns(match.localteam.id);
  const visitorTeamRuns = getTeamRuns(match.visitorteam.id);
  const isMatchFinished = match.status === "Finished";
  const localTeamBatters = getBatters(match.localteam.id);
  const localTeamBowlers = getBowlers(match.localteam.id);
  const visitorTeamBatters = getBatters(match.visitorteam.id);
  const visitorTeamBowlers = getBowlers(match.visitorteam.id);

  return (
    <Card className="w-full max-w-4xl mx-auto p-4 mt-6 shadow-lg border border-gray-200">
      <CardContent className="p-2 sm:p-4">
        {/* Match Header */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="flex items-center justify-between w-full mb-3">
            {/* Local Team Info */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0 px-1">
              <Image
                src={match.localteam.image_path || '/placeholder.png'}
                alt={match.localteam.name}
                width={56}
                height={56}
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain mb-1"
                onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
              />
              <h2 className="text-base sm:text-lg font-bold truncate w-full">{match.localteam.name}</h2>
              {localTeamRuns ? (
                <p className="text-lg sm:text-xl font-bold whitespace-nowrap">
                  {localTeamRuns.score}/{localTeamRuns.wickets}
                  <span className="text-sm font-normal"> ({localTeamRuns.overs} ov)</span>
                </p>
              ) : (
                <p className="text-lg sm:text-xl font-bold">-</p>
              )}
            </div>

            {/* VS / Result Section */}
            <div className="mx-2 sm:mx-4 flex flex-col items-center text-center">
              <span className={`text-sm font-semibold ${isMatchFinished ? 'text-green-600' : 'text-gray-500'}`}>
                {isMatchFinished ? "RESULT" : "VS"}
              </span>
              {isMatchFinished && match.winner_team_id && (
                <span className="text-xs sm:text-sm font-semibold text-blue-700 mt-0.5">
                  {match.winner_team_id === match.localteam.id
                    ? match.localteam.name
                    : match.visitorteam.name} won
                </span>
              )}
              {match.note && (
                <span className="text-[10px] sm:text-xs text-center text-gray-600 mt-1 max-w-[150px] sm:max-w-xs leading-tight">
                  {match.note}
                </span>
              )}
            </div>

            {/* Visitor Team Info */}
            <div className="flex flex-col items-center text-center flex-1 min-w-0 px-1">
              <Image
                src={match.visitorteam.image_path || '/placeholder.png'}
                alt={match.visitorteam.name}
                width={56}
                height={56}
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain mb-1"
                onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
              />
              <h2 className="text-base sm:text-lg font-bold truncate w-full">{match.visitorteam.name}</h2>
              {visitorTeamRuns ? (
                <p className="text-lg sm:text-xl font-bold whitespace-nowrap">
                  {visitorTeamRuns.score}/{visitorTeamRuns.wickets}
                  <span className="text-sm font-normal"> ({visitorTeamRuns.overs} ov)</span>
                </p>
              ) : (
                <p className="text-lg sm:text-xl font-bold">-</p>
              )}
            </div>
          </div>

          {/* Match Meta Info */}
          <div className="text-xs sm:text-sm text-gray-600 w-full text-center border-t border-b border-gray-200 py-2 px-1 space-y-0.5">
            {match.venue?.name && <div><strong>Venue:</strong> {match.venue.name}</div>}
            <div><strong>Date:</strong> {match.formatted_starting_at}</div>
            <div><strong>Status:</strong> <span className={`font-semibold ${match.status === 'Live' ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>{match.status}</span></div>
          </div>
        </div>

        {/* Scorecard Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Local Team Batting vs Visitor Team Bowling */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2">
              {match.localteam.name} Batting
            </h3>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 tracking-wider">Batter</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">R</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">B</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">4s</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">6s</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">SR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localTeamBatters.length > 0 ? localTeamBatters.map((batter) => (
                    <tr key={`bat-${batter.player_id}-${batter.id}`} className={batter.active ? "bg-blue-50 font-medium" : ""}>
                      <td className="px-2 py-1 whitespace-nowrap text-left flex items-center">
                        {batter.active && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 flex-shrink-0"></span>}
                        <span className="truncate">
                          {getPlayerName(batter.player_id, batter.player_name)}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.score}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.ball ?? '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.four_x}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.six_x}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.rate?.toFixed(2) ?? '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="text-center py-4 text-gray-500">Yet to bat</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="font-bold text-base sm:text-lg mt-4 mb-2">
              {match.visitorteam.name} Bowling
            </h3>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 tracking-wider">Bowler</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">O</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">R</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">W</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">Econ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitorTeamBowlers.length > 0 ? visitorTeamBowlers.map((bowler) => (
                    <tr key={`bowl-${bowler.player_id}-${bowler.id}`} className={bowler.active ? "bg-blue-50 font-medium" : ""}>
                      <td className="px-2 py-1 whitespace-nowrap text-left flex items-center">
                        {bowler.active && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 flex-shrink-0"></span>}
                        <span className="truncate">
                          {getPlayerName(bowler.player_id, bowler.player_name)}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.overs}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.runs}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.wickets}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.rate?.toFixed(2) ?? '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-500">No bowling data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visitor Team Batting vs Local Team Bowling */}
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2">
              {match.visitorteam.name} Batting
            </h3>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 tracking-wider">Batter</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">R</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">B</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">4s</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">6s</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">SR</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitorTeamBatters.length > 0 ? visitorTeamBatters.map((batter) => (
                    <tr key={`bat-${batter.player_id}-${batter.id}`} className={batter.active ? "bg-blue-50 font-medium" : ""}>
                      <td className="px-2 py-1 whitespace-nowrap text-left flex items-center">
                        {batter.active && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 flex-shrink-0"></span>}
                        <span className="truncate">
                          {getPlayerName(batter.player_id, batter.player_name)}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.score}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.ball ?? '-'}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.four_x}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.six_x}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{batter.rate?.toFixed(2) ?? '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="text-center py-4 text-gray-500">Yet to bat</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="font-bold text-base sm:text-lg mt-4 mb-2">
              {match.localteam.name} Bowling
            </h3>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 tracking-wider">Bowler</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">O</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">R</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">W</th>
                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 tracking-wider">Econ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {localTeamBowlers.length > 0 ? localTeamBowlers.map((bowler) => (
                    <tr key={`bowl-${bowler.player_id}-${bowler.id}`} className={bowler.active ? "bg-blue-50 font-medium" : ""}>
                      <td className="px-2 py-1 whitespace-nowrap text-left flex items-center">
                        {bowler.active && <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 flex-shrink-0"></span>}
                        <span className="truncate">
                          {getPlayerName(bowler.player_id, bowler.player_name)}
                        </span>
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.overs}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.runs}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.wickets}</td>
                      <td className="px-2 py-1 whitespace-nowrap text-right">{bowler.rate?.toFixed(2) ?? '-'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="text-center py-4 text-gray-500">No bowling data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}