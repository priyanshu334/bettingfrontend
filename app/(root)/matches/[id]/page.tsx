"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RunsOptionsCard from "@/components/RunsOptionCard"; // Assuming export
import PlayerRunsCard from "@/components/PlayerRunsCard";
import PlayerWicketsCard from "@/components/PlayerWicketsCard";
import PlayerBoundariesCard from "@/components/PlayerBoundariesCard";
import BowlerRunsCard from "@/components/BowlerRunsCard";
import MatchCard from "@/components/MatchCard";
import { MdLocationOn, MdCalendarToday } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import LiveScoreDisplay from "@/components/Scoredisplay";


// --- Interfaces (Updated Match interface) ---
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

// Represents live scoreboard data from API (ASSUMED STRUCTURE)
interface LiveScoreboard {
    team_id: number;
    inning: number;
    score: number;
    wickets: number;
    overs: number; // e.g., 5.2 means 5 overs and 2 balls completed
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
  score?: string; // Overall status/score summary
  lineup?: Player[];
  status: string; // 'NS', 'Live', 'Finished', 'Abnd.' etc.
  tossWinnerTeamId?: number;
  tossDecision?: string; // 'bat' or 'bowl'
  currentBattingTeamId?: number;
  currentOver?: number; // The completed overs (e.g., 5.2 -> treat as 5 for disabling)
  firstInningsTeamId?: number;
  // Optional: Store the raw scoreboards if needed elsewhere
  // scoreboards?: LiveScoreboard[];
}


// --- Other Interfaces (Player Data, Runs Options) ---
// (Keep existing PlayerRunsDisplayData, PlayerWicketsDisplayData, etc.)

// Add specific fields needed for disabling logic
interface EnhancedRunsOptionsOption  {
  id: number;
  label: string;
  noOdds: number;
  yesOdds: number;
  marketType: "runs" | "wickets" | "totals";
  teamId?: number; // ID of the team this option applies to
  overMilestone?: number; // Over number (e.g., 1, 6, 10, 15, 20)
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

  // --- Improved Odds Generation (Still Simulated) ---
  const generateRealisticOdds = useCallback((base: number = 1.90, volatility: number = 0.10): string => {
      // Ensure volatility doesn't make odds <= 1.0
      const safeVolatility = Math.min(volatility, base - 1.01);
      const fluctuation = (Math.random() * 2 - 1) * safeVolatility; // Random number between -volatility and +volatility
      const odd = base + fluctuation;
      return odd.toFixed(2);
  }, []);

  const rand = (min: number, max: number): number => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const updateAllOdds = useCallback(() => {
      setOddsUpdateCount(prev => prev + 1);
  }, []);

  useEffect(() => {
      // Update odds every 50 seconds (as before)
      // Consider a shorter interval if reflecting live odds changes rapidly
      const interval = setInterval(updateAllOdds, 50000);
      return () => clearInterval(interval);
  }, [updateAllOdds]);

  // --- Fetch Match Data ---
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
              // *** IMPORTANT: Ensure this API endpoint provides the enhanced live data ***
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

              // --- Extract Live State ---
              const status = fixture.status || 'NS';
              const tossWinnerTeamId = fixture.toss_winner_team_id; // Assume API provides this
              const tossDecision = fixture.elected; // Assume API provides this ('bat' or 'bowl')

              let currentBattingTeamId: number | undefined = undefined;
              let currentOver: number | undefined = undefined;
              let firstInningsTeamId: number | undefined = undefined;

              if (status === 'Live' && tossWinnerTeamId && tossDecision) {
                 // Determine who bats first
                 firstInningsTeamId = (tossDecision === 'bat') ? tossWinnerTeamId : (tossWinnerTeamId === localTeam.id ? visitorTeam.id : localTeam.id);

                 // Find the current scoreboard (assuming API provides `scoreboards` array)
                 const liveScoreboard: LiveScoreboard | undefined = (fixture.scoreboards as LiveScoreboard[])?.find(
                     // Logic to find the *current* inning's scoreboard might vary based on API
                     // Simple approach: find the latest inning or a specific 'live' flag
                     // This example assumes the highest inning number is the current one
                     (s, _, arr) => s.inning === Math.max(...arr.map(i => i.inning))
                 );

                 if (liveScoreboard) {
                     currentBattingTeamId = liveScoreboard.team_id;
                     currentOver = liveScoreboard.overs; // e.g., 5.2
                 } else {
                    // If no live scoreboard yet, but toss happened, assume first innings, 0 overs
                    currentBattingTeamId = firstInningsTeamId;
                    currentOver = 0.0;
                 }
              } else if (status === 'Finished' && tossWinnerTeamId && tossDecision) {
                 // Determine who batted first for context if needed
                 firstInningsTeamId = (tossDecision === 'bat') ? tossWinnerTeamId : (tossWinnerTeamId === localTeam.id ? visitorTeam.id : localTeam.id);
                 // Set state to indicate end? Maybe currentOver to 20 for both?
                 // For simplicity, we'll leave currentBattingTeamId/currentOver undefined post-match
              }


              const matchData: Match = {
                  id: fixture.id,
                  match: `${localTeam.name} vs. ${visitorTeam.name}`,
                  date: formattedDate,
                  venue: venueName,
                  localTeam: localTeam,
                  visitorTeam: visitorTeam,
                  localTeamLogo: localTeam.image_path || '/team-placeholder.png',
                  visitorTeamLogo: visitorTeam.image_path || '/team-placeholder.png',
                  score: fixture.status === 'Finished' ? `Score: ${fixture.scoreboards?.find((s: any) => s.type === 'total')?.score || 'N/A'}` : (fixture.note || fixture.status || "Match status unknown"), // Use 'note' field if available for live summary
                  lineup: processedLineup,
                  status: status,
                  tossWinnerTeamId: tossWinnerTeamId,
                  tossDecision: tossDecision,
                  currentBattingTeamId: currentBattingTeamId,
                  currentOver: currentOver,
                  firstInningsTeamId: firstInningsTeamId,
                  // scoreboards: fixture.scoreboards // Optionally store raw scoreboards
              };
              setMatch(matchData);

              const localTeamId = localTeam.id;
              const visitorTeamId = visitorTeam.id;

              setLocalPlayers(processedLineup.filter(p => p.team_id === localTeamId));
              setVisitorPlayers(processedLineup.filter(p => p.team_id === visitorTeamId));

          } catch (err) {
              console.error("Error fetching match details:", err);
              setError(err instanceof Error ? err.message : "An unknown error occurred while fetching match data.");
          } finally {
              setLoading(false);
          }
      };

      fetchMatch();
      // Re-fetch periodically if you want live updates for disabling/hiding during the match
      // const liveUpdateInterval = setInterval(fetchMatch, 30000); // e.g., every 30 seconds
      // return () => clearInterval(liveUpdateInterval);

  }, [id]); // Dependency array includes id

  // --- Helper Functions ---
  const filterPlayersByRole = useCallback((team: "local" | "visitor", roleFilter: string[]): Player[] => {
      const teamPlayers = team === "local" ? localPlayers : visitorPlayers;
      if (!teamPlayers || teamPlayers.length === 0) {
          return [];
      }
      return teamPlayers.filter(player => roleFilter.includes(player.position));
  }, [localPlayers, visitorPlayers]);

  // --- Data Generation for Components (with updated odds/logic) ---

  const generateMatchCardData = useCallback(() => {
    if (!match) return null;

    const localTeamIdStr = match.localTeam.id?.toString() || 'local-id';
    const visitorTeamIdStr = match.visitorTeam.id?.toString() || 'visitor-id';
    const localTeamName = match.localTeam.name || 'Local Team';
    const visitorTeamName = match.visitorTeam.name || 'Visitor Team';
    const localTeamShort = localTeamName.length > 15 ? `${localTeamName.substring(0, 12)}...` : localTeamName;
    const visitorTeamShort = visitorTeamName.length > 15 ? `${visitorTeamName.substring(0, 12)}...` : visitorTeamName;

    // Basic simulation: Slightly favor home team or based on a random factor
    const localWinProb = 0.5 + (Math.random() * 0.1 - 0.05); // Base 50% +/- 5%
    const visitorWinProb = 1 - localWinProb;

    // Convert probability to decimal odds (simplified, ignores bookmaker margin)
    const localBackOdds = (1 / localWinProb).toFixed(2);
    const visitorBackOdds = (1 / visitorWinProb).toFixed(2);
    // Lay odds slightly higher than back odds
    const localLayOdds = (parseFloat(localBackOdds) + Math.random() * 0.05 + 0.01).toFixed(2);
    const visitorLayOdds = (parseFloat(visitorBackOdds) + Math.random() * 0.05 + 0.01).toFixed(2);

    const data: any = {
      matchId: match.id,
      userId: "current-user-id", // Replace this with actual user ID
      matchOdds: [
        { teamId: localTeamIdStr, team: localTeamName, back: localBackOdds, lay: localLayOdds, stake: "100" },
        { teamId: visitorTeamIdStr, team: visitorTeamName, back: visitorBackOdds, lay: visitorLayOdds, stake: "100" }
      ],
      bookmakerOdds: [ // Simulating bookmaker odds (often presented differently)
        { teamId: localTeamIdStr, team: localTeamShort, back: (parseFloat(localBackOdds) * 100 - rand(5,15)).toFixed(0), lay: (parseFloat(localLayOdds) * 100 + rand(0,5)).toFixed(0), stake: "100" },
        { teamId: visitorTeamIdStr, team: visitorTeamShort, back: (parseFloat(visitorBackOdds) * 100 - rand(5,15)).toFixed(0), lay: (parseFloat(visitorLayOdds) * 100 + rand(0,5)).toFixed(0), stake: "100" }
      ],
      // Removed tossOdds from here, will add conditionally below
      winPrediction: [ // Can use the same simulated odds
          { teamId: localTeamIdStr, team: localTeamName, odds: localBackOdds },
          { teamId: visitorTeamIdStr, team: visitorTeamName, odds: visitorBackOdds }
      ]
    };

    // *** Conditionally add Toss Odds ***
    if (!match.tossWinnerTeamId) { // Only show if toss hasn't happened
      data.tossOdds = [
        { teamId: localTeamIdStr, team: localTeamShort, back: generateRealisticOdds(1.95, 0.05), lay: "0", stake: "100" }, // Lay=0 often means not available for toss
        { teamId: visitorTeamIdStr, team: visitorTeamShort, back: generateRealisticOdds(1.95, 0.05), lay: "0", stake: "100" }
      ];
    }

    return data;
  }, [match, generateRealisticOdds]); // Removed generateRandomOdds dependency

  // --- Render Logic ---
  if (loading) {
      return <div className="flex justify-center items-center h-screen text-white bg-gray-900">Loading match details...</div>;
  }

  if (error || !match) {
      // ... (error display remains the same)
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

  // --- Prepare Data for Child Components ---

  const localBattingPlayers = filterPlayersByRole("local", battingRoles);
  const visitorBattingPlayers = filterPlayersByRole("visitor", battingRoles);
  const localBowlingPlayers = filterPlayersByRole("local", bowlingRoles);
  const visitorBowlingPlayers = filterPlayersByRole("visitor", bowlingRoles);

  // Use improved odds generation
  const playerRunsData = localBattingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      runs: rand(10, 80), // Keep random target runs for display
      buttons: [`Over:${generateRealisticOdds(1.95)}`, `Under:${generateRealisticOdds(1.85)}`],
  }));

  const visitorPlayerRunsData = visitorBattingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      runs: rand(10, 80),
      buttons: [`Over:${generateRealisticOdds(1.95)}`, `Under:${generateRealisticOdds(1.85)}`],
  }));

  const playerWicketsData = localBowlingPlayers.map(p => ({
    id: p.id,
    name: p.fullname || `Player #${p.id}`,
    wickets: rand(0, 3), // Keep random target wickets
    buttons: [`Over:${generateRealisticOdds(2.0, 0.15)}`, `Under:${generateRealisticOdds(1.8, 0.15)}`], // Slightly different base for wickets
  }));

  const visitorPlayerWicketsData = visitorBowlingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      wickets: rand(0, 3),
      buttons: [`Over:${generateRealisticOdds(2.0, 0.15)}`, `Under:${generateRealisticOdds(1.8, 0.15)}`],
  }));

  const playerBoundariesData = localBattingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      boundaries: rand(0, 6), // Keep random target boundaries
      buttons: [`Over:${generateRealisticOdds(1.95)}`, `Under:${generateRealisticOdds(1.85)}`],
  }));

  const visitorPlayerBoundariesData = visitorBattingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      boundaries: rand(0, 6),
      buttons: [`Over:${generateRealisticOdds(1.95)}`, `Under:${generateRealisticOdds(1.85)}`],
  }));

    const bowlerRunsData = localBowlingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      runsConceded: rand(15, 50), // Keep random target runs conceded
      buttons: [`Over:${generateRealisticOdds(1.90)}`, `Under:${generateRealisticOdds(1.90)}`], // Often close odds for bowler runs
  }));

    const visitorBowlerRunsData = visitorBowlingPlayers.map(p => ({
      id: p.id,
      name: p.fullname || `Player #${p.id}`,
      runsConceded: rand(15, 50),
      buttons: [`Over:${generateRealisticOdds(1.90)}`, `Under:${generateRealisticOdds(1.90)}`],
  }));


  // --- Generate Runs & Wickets Data with Enhancements ---
  const runsAndWicketsDataOptions: EnhancedRunsOptionsOption[] = [
      // Local Team Runs
      { id: 1, label: `1 Over (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.localTeam.id, overMilestone: 1 },
      { id: 2, label: `6 Overs (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.localTeam.id, overMilestone: 6 },
      { id: 3, label: `10 Overs (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.localTeam.id, overMilestone: 10 },
      { id: 4, label: `15 Overs (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.localTeam.id, overMilestone: 15 },
      { id: 5, label: `20 Overs (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.localTeam.id, overMilestone: 20 },
      // Visitor Team Runs
      { id: 6, label: `1 Over (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.visitorTeam.id, overMilestone: 1 },
      { id: 7, label: `6 Overs (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.visitorTeam.id, overMilestone: 6 },
      { id: 8, label: `10 Overs (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.visitorTeam.id, overMilestone: 10 },
      { id: 9, label: `15 Overs (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.visitorTeam.id, overMilestone: 15 },
      { id: 10, label: `20 Overs (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.85)), yesOdds: parseFloat(generateRealisticOdds(1.95)), marketType: "runs", teamId: match.visitorTeam.id, overMilestone: 20 },
      // Total Match Markets (No team/over specific disabling needed)
      { id: 11, label: `Total Match Runs (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.90)), yesOdds: parseFloat(generateRealisticOdds(1.90)), marketType: "totals" },
      { id: 12, label: `Total Match 4s (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.90)), yesOdds: parseFloat(generateRealisticOdds(1.90)), marketType: "totals" },
      { id: 13, label: `Total Match 6s (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.90)), yesOdds: parseFloat(generateRealisticOdds(1.90)), marketType: "totals" },
      // Local Team Wickets
      { id: 14, label: `6 Over Wickets (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.localTeam.id, overMilestone: 6 },
      { id: 15, label: `10 Over Wickets (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.localTeam.id, overMilestone: 10 },
      { id: 16, label: `15 Over Wickets (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.localTeam.id, overMilestone: 15 },
      { id: 17, label: `20 Over Wickets (${match.localTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.localTeam.id, overMilestone: 20 },
      // Visitor Team Wickets
      { id: 18, label: `6 Over Wickets (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.visitorTeam.id, overMilestone: 6 },
      { id: 19, label: `10 Over Wickets (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.visitorTeam.id, overMilestone: 10 },
      { id: 20, label: `15 Over Wickets (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.visitorTeam.id, overMilestone: 15 },
      { id: 21, label: `20 Over Wickets (${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.80)), yesOdds: parseFloat(generateRealisticOdds(2.00)), marketType: "wickets", teamId: match.visitorTeam.id, overMilestone: 20 },
      // Total Match Wickets
      { id: 22, label: `Total Match Wickets (${match.localTeam.name} vs ${match.visitorTeam.name})`, noOdds: parseFloat(generateRealisticOdds(1.90)), yesOdds: parseFloat(generateRealisticOdds(1.90)), marketType: "totals" }
  ];


  const matchCardData = generateMatchCardData(); // Generate this after match state is set

  // --- JSX Structure ---
  return (
      <div className="container mx-auto p-4 bg-gray-900 min-h-screen text-gray-200">
          {/* Match Header Card (remains largely the same) */}
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
                         src={match.localTeamLogo} alt={`${match.localTeam.name} logo`} width={64} height={64}
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
                         src={match.visitorTeamLogo} alt={`${match.visitorTeam.name} logo`} width={64} height={64}
                         className="rounded-full mb-2 border-2 border-gray-600 bg-gray-700"
                         onError={(e) => { (e.target as HTMLImageElement).src = '/team-placeholder.png'; }}
                       />
                   )}
                   <span className={`font-semibold text-base md:text-lg text-white px-3 py-1 rounded break-words ${teamColors[match.visitorTeam.name] || 'bg-gray-600'}`}>{match.visitorTeam.name}</span>
                 </div>
                 {match.score && ( // Display live score/status from note or status field
                   <div className="w-full text-center mt-4 sm:mt-0 sm:absolute sm:top-2 sm:right-4">
                     <Badge variant="secondary" className="text-xs sm:text-sm bg-gray-700 text-gray-200 px-2 py-1">{match.score}</Badge>
                   </div>
                 )}
               </CardContent>
           </Card>

          <LiveScoreDisplay/> {/* Assuming this component fetches its own live data or receives props */}

          {/* General/Fancy Betting Links */}
          <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-center sm:space-x-8 md:space-x-20 mb-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-white text-center mb-2 sm:mb-0 hover:text-yellow-400 transition-colors">General Betting Options</h2>
                  <Link href="/fancy" className="text-center"><h2 className="text-xl md:text-2xl font-semibold text-white hover:text-yellow-400 transition-colors">Fancy Betting Options</h2></Link>
              </div>
              <div className="flex items-center justify-center">
                  {/* Pass match data including conditional toss odds */}
                  {matchCardData ? (
                      // Key forces remount when odds update, ensuring toss section hides/shows
                      <MatchCard {...matchCardData} key={`match-card-${oddsUpdateCount}-${match.tossWinnerTeamId || 'no-toss'}`} />
                  ) : (
                      <p className="text-gray-500">Match betting data not available yet.</p>
                  )}
              </div>
          </div>

          {/* Match Runs & Wickets Card */}
          <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Match Runs & Wickets</h2>
              {/*
                *** IMPORTANT: Pass live match state to RunsOptionsCard ***
                The RunsOptionsCard component itself needs to be modified
                to accept these props and implement the disabling logic.
              */}
              <RunsOptionsCard
                  key={`runs-wickets-${oddsUpdateCount}`} // Update with odds changes
                  matchId={match.id}
                  heading="Runs & Wickets"
                  options={runsAndWicketsDataOptions} // Pass the enhanced options
                  // Pass the necessary live state for disabling logic
                  currentBattingTeamId={match.currentBattingTeamId}
                  currentOver={match.currentOver}
                  // teamId prop might not be needed if options contain teamId
              />
          </div>

          {/* Player Runs Cards */}
          <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">Player Runs</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <PlayerRunsCard
                      key={`local-runs-${oddsUpdateCount}`}
                      matchId={match.id}
                      heading={`${match.localTeam.name}`}
                      players={playerRunsData}
                      // Pass other necessary props like userId if needed
                  />
                  <PlayerRunsCard
                      key={`visitor-runs-${oddsUpdateCount}`}
                      matchId={match.id}
                      heading={`${match.visitorTeam.name}`}
                      players={visitorPlayerRunsData}
                  />
              </div>
          </div>

          {/* Player Wickets Cards */}
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

          {/* Player Boundaries Cards */}
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

          {/* Bowler Runs Conceded Cards */}
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