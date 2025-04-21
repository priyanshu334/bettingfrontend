"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MdSportsCricket, MdLocationOn, MdCalendarToday, MdAccessTime, MdStar } from "react-icons/md";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Interface for the structure coming directly from the API
interface ApiMatch {
  id: number;
  starting_at: string;
  ending_at?: string | null;
  live: boolean;
  status: string;
  localteam: Team | null;
  visitorteam: Team | null;
  venue: Venue | null;
}

// Interface for Team data within ApiMatch
interface Team {
  id: number;
  name: string;
  image_path: string;
}

// Interface for Venue data within ApiMatch
interface Venue {
  id: number;
  name: string;
}

// Interface for the formatted data used within the component
interface FormattedMatch {
  id: number;
  match: string;
  date: string;
  timestamp: number;
  endingTimestamp?: number | null;
  venue: string;
  localTeam: string;
  visitorTeam: string;
  localTeamLogo: string;
  visitorTeamLogo: string;
  starting_at: string;
  ending_at?: string | null;
  live: boolean;
  status: string;
}

// --- Status Code Constants ---
const LIVE_STATUSES = ["1st Innings", "2nd Innings", "Innings Break", "Live", "Int.", "Lunch", "Tea", "Stumps", "Rain Delay", "Review", "Delayed"];
const UPCOMING_STATUSES = ["NS"];
const COMPLETED_STATUSES = ["Finished", "Aban.", "Cancl.", "Postp.", "Awarded", "Complete", "Cancelled", "Walkover", "Ended"];

// --- Main React Component ---
const IPLMatches = () => {
  const router = useRouter();
  const [matches, setMatches] = useState<FormattedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Status Determination Logic ---
  const getMatchStatusInfo = (match: FormattedMatch): { status: 'live' | 'upcoming' | 'completed' | 'unknown', text: string } => {
    const now = new Date().getTime();
    const startTime = match.timestamp;

    // --- Prioritize Definitive Statuses ---

    // 1. Check for explicitly COMPLETED statuses first
    if (COMPLETED_STATUSES.includes(match.status)) {
        const completedText = (match.status === "Finished" || match.status === "Complete" || match.status === "Ended") ? 'Match Completed' : `Finished (${match.status})`;
        if(match.live && (match.status !== 'Postp.' && match.status !== 'Cancl.' && match.status !== 'Aban.')) {
             console.warn(`Match ${match.id} has completed status '${match.status}' but live flag is true.`);
        }
        return { status: 'completed', text: completedText };
    }
    
    if (match.live === false && now > startTime && !UPCOMING_STATUSES.includes(match.status)) {
        console.warn(`Match ${match.id} has live: false and start time is past, assuming completed.`);
        return { status: 'completed', text: 'Match Finished' };
    }

    // 2. Check for explicitly LIVE statuses OR live flag is true
    if (match.live || LIVE_STATUSES.includes(match.status)) {
        if (startTime > now + (60 * 60 * 1000)) {
             console.warn(`Match ${match.id} has live status/flag but start time is >1hr in future. Treating as upcoming.`);
        } else {
             const statusText = LIVE_STATUSES.includes(match.status) && match.status !== "Live" ? `Live: ${match.status}` : 'Live Now';
             return { status: 'live', text: statusText };
        }
    }

    // 3. Check for explicitly UPCOMING status ("NS")
    if (UPCOMING_STATUSES.includes(match.status)) {
         if (now >= startTime) {
             if (match.live || now < startTime + (5 * 60 * 1000)) {
                return { status: 'upcoming', text: 'Starting Soon...' };
             } else {
                  console.warn(`Match ${match.id} status is 'NS' but start time is significantly past. Assuming completed/error.`);
                  return { status: 'completed', text: 'Status Error' };
             }
         }

         const diff = startTime - now;
         const days = Math.floor(diff / (1000 * 60 * 60 * 24));
         const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
         const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

         if (days > 0) return { status: 'upcoming', text: `Starts in ${days}d ${hours}h` };
         if (hours > 0) return { status: 'upcoming', text: `Starts in ${hours}h ${minutes}m` };
         if (minutes > 5) return { status: 'upcoming', text: `Starts in ${minutes}m` };
         return { status: 'upcoming', text: 'Starting Soon' };
    }

    // --- Handle Ambiguous Cases / Fallbacks ---
    if (now < startTime) {
        console.warn(`Match ${match.id} has unknown status '${match.status}', but start time is future. Treating as upcoming.`);
        const diff = startTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) return { status: 'upcoming', text: `Starts in ${days}d ${hours}h` };
        if (hours > 0) return { status: 'upcoming', text: `Starts in ${hours}h ${minutes}m` };
        if (minutes > 5) return { status: 'upcoming', text: `Starts in ${minutes}m` };
        return { status: 'upcoming', text: 'Starting Soon' };
    } else {
        console.warn(`Match ${match.id} has unknown status '${match.status}' and start time is past. Assuming completed.`);
        return { status: 'completed', text: 'Match Finished (Unknown Status)' };
    }
  };

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/fixtures");

        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }

        const data = await res.json();
        const apiMatches: ApiMatch[] = data?.data;

        if (!apiMatches || apiMatches.length === 0) {
           setMatches([]);
           setError(null);
           console.log("No match data found in the API response.");
        } else {
            const formatted = apiMatches.map((m: ApiMatch) => {
              const startingAt = new Date(m.starting_at);
              const endingAt = m.ending_at ? new Date(m.ending_at) : null;
              const options: Intl.DateTimeFormatOptions = {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
                hour12: true
              };
              return {
                id: m.id,
                match: `${m.localteam?.name || 'TBD'} vs. ${m.visitorteam?.name || 'TBD'}`,
                date: startingAt.toLocaleString("en-IN", options),
                timestamp: startingAt.getTime(),
                endingTimestamp: endingAt ? endingAt.getTime() : null,
                venue: m.venue?.name || "Venue TBD",
                localTeam: m.localteam?.name || 'TBD',
                visitorTeam: m.visitorteam?.name || 'TBD',
                localTeamLogo: m.localteam?.image_path || '/images/team-placeholder.png',
                visitorTeamLogo: m.visitorteam?.image_path || '/images/team-placeholder.png',
                starting_at: m.starting_at,
                ending_at: m.ending_at,
                live: m.live,
                status: m.status,
              };
            });
             formatted.sort((a, b) => a.timestamp - b.timestamp);
             setMatches(formatted);
             setError(null);
        }

      } catch (err) {
        console.error("Error fetching or processing match data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch matches");
         setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
    // Optional: Refresh data periodically
    const intervalId = setInterval(fetchMatches, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // --- Helper function for Card Background Colors ---
  const getTeamColors = (matchTitle: string, status: string) => {
    // Live matches get a distinct pulsing background
    if (status === 'live') {
      return "from-orange-500 via-orange-600 to-orange-700 animate-pulse";
    }
    
    // IPL Orange theme for all teams with subtle differences
    if (matchTitle.includes("Mumbai Indians")) return "from-blue-600 to-blue-800 via-orange-700/20";
    if (matchTitle.includes("Chennai Super Kings")) return "from-yellow-500 to-yellow-700 via-orange-700/30";
    if (matchTitle.includes("Royal Challengers")) return "from-red-600 to-red-800 via-orange-700/20";
    if (matchTitle.includes("Kolkata Knight Riders")) return "from-purple-600 to-purple-800 via-orange-700/20";
    if (matchTitle.includes("Sunrisers Hyderabad")) return "from-orange-500 to-orange-700";
    if (matchTitle.includes("Delhi Capitals")) return "from-blue-500 to-blue-700 via-orange-700/20";
    if (matchTitle.includes("Rajasthan Royals")) return "from-pink-500 to-pink-700 via-orange-700/20";
    if (matchTitle.includes("Punjab Kings")) return "from-red-500 to-red-700 via-orange-700/20";
    if (matchTitle.includes("Gujarat Titans")) return "from-cyan-600 to-blue-800 via-orange-700/20";
    if (matchTitle.includes("Lucknow Super Giants")) return "from-teal-500 to-teal-700 via-orange-700/20";
    
    // Default orange gradient for IPL theme
    return "from-orange-600 to-orange-800";
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="p-6 w-full bg-gradient-to-br from-orange-900 to-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl flex flex-col items-center">
           <div className="relative w-16 h-16 mb-4">
             <div className="absolute w-16 h-16 rounded-full border-4 border-orange-500 opacity-30"></div>
             <div className="absolute w-16 h-16 rounded-full border-t-4 border-orange-300 animate-spin"></div>
             <MdSportsCricket className="absolute inset-0 m-auto text-orange-400 text-2xl" />
           </div>
           <span className="text-orange-300 font-semibold">Loading IPL Matches...</span>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="p-6 w-full bg-gradient-to-br from-orange-900 to-red-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl text-center p-6 bg-red-900 rounded-xl border border-red-800 shadow-lg">
          <div className="text-red-300 text-5xl mb-4"><MdSportsCricket /></div>
          <p className="font-bold text-2xl mb-2">Error Loading Matches</p>
          <p className="text-sm mt-2 text-gray-300">{error}</p>
          <p className="text-xs mt-3 text-gray-400">Please try refreshing the page or check back later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md transition-all">
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // --- Filter Matches: Keep only Live and Upcoming ---
  const visibleMatches = matches.filter(match => {
    const statusInfo = getMatchStatusInfo(match);
    return statusInfo.status === 'live' || statusInfo.status === 'upcoming';
  });

  // --- Main Render ---
  return (
    <div className="p-4 sm:p-6 w-full bg-gradient-to-br from-orange-600 via-orange-950 to-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header with IPL-style branding */}
        <div className="flex flex-col items-center justify-center mb-8 sm:mb-10 text-center">
          <div className="mb-3 relative">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 opacity-30 blur-lg"></div>
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-full">
              <MdSportsCricket className="text-4xl sm:text-5xl" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-500 mb-2">
            IPL 2025
          </h1>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span className="text-orange-400 font-medium">LIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
            <span className="text-orange-400 font-medium">& UPCOMING MATCHES</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Last updated: {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true, hour: 'numeric', minute: '2-digit'})}</p>
        </div>

        {/* Match Grid or Empty State */}
        {visibleMatches.length === 0 ? (
           <div className="text-center text-gray-400 p-12 mt-8 bg-gray-800/40 rounded-2xl border border-gray-700/30 shadow-xl max-w-lg mx-auto">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 opacity-20 blur-md"></div>
                <MdSportsCricket className="w-full h-full text-orange-500 relative" />
              </div>
              <h3 className="text-xl font-bold text-orange-300 mb-2">No Matches Right Now</h3>
              <p className="text-gray-400">
                No live or upcoming matches found at the moment.
                <br />
                Check back soon for the latest IPL action!
              </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {visibleMatches.map((match) => {
              const statusInfo = getMatchStatusInfo(match);
              const isLive = statusInfo.status === 'live';

              return (
                <Card
                  key={match.id}
                  onClick={() => router.push(`/matches/${match.id}`)}
                  className="cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-0 rounded-2xl shadow-lg relative bg-gradient-to-br from-gray-900 to-gray-900"
                >
                  {/* Decorative top bar with team colors */}
                  <div className={`h-2 w-full bg-gradient-to-r ${getTeamColors(match.match, statusInfo.status)}`}></div>
                  
                  {/* Live Indicator Badge */}
                  {isLive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500/80 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                      LIVE
                    </div>
                  )}
                  
                  <CardContent className="p-6 pb-4 space-y-4 text-white">
                    {/* Team Information */}
                    <div className="flex items-center justify-between gap-2 pt-2">
                      {/* Local Team */}
                      <div className="flex flex-col items-center text-center gap-2 flex-1 min-w-0">
                        <div className="w-16 h-16 p-1 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shadow-lg">
                          <Image
                            src={match.localTeamLogo}
                            alt={match.localTeam}
                            width={56} height={56}
                            className="rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/team-placeholder.png'; }}
                          />
                        </div>
                        <span className="text-sm font-medium truncate w-full text-gray-200">{match.localTeam}</span>
                      </div>
                      
                      {/* VS Badge */}
                      <div className="flex flex-col items-center px-2">
                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                          VS
                        </div>
                        {isLive && (
                          <div className="mt-2 text-xs font-bold text-orange-500">{statusInfo.text}</div>
                        )}
                      </div>
                      
                      {/* Visitor Team */}
                      <div className="flex flex-col items-center text-center gap-2 flex-1 min-w-0">
                        <div className="w-16 h-16 p-1 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shadow-lg">
                          <Image
                            src={match.visitorTeamLogo}
                            alt={match.visitorTeam}
                            width={56} height={56}
                            className="rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/team-placeholder.png'; }}
                          />
                        </div>
                        <span className="text-sm font-medium truncate w-full text-gray-200">{match.visitorTeam}</span>
                      </div>
                    </div>

                    {/* Match Details Section */}
                    <div className="mt-4 pt-4 border-t border-gray-800 text-sm space-y-2.5">
                      <div className="flex items-center text-gray-300">
                        <MdCalendarToday className="w-4 h-4 text-orange-400 mr-2 flex-shrink-0" />
                        <span>{match.date}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <MdLocationOn className="w-4 h-4 text-orange-400 mr-2 flex-shrink-0" />
                        <span className="truncate" title={match.venue}>{match.venue}</span>
                      </div>
                      {/* Status Text - show only for upcoming matches since live is shown in the VS section */}
                      {!isLive && (
                        <div className="flex items-center font-medium text-blue-300">
                          <MdAccessTime className="w-4 h-4 text-orange-400 mr-2 flex-shrink-0" />
                          <span>{statusInfo.text}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-800">
                      {isLive ? (
                        <button
                          aria-label={`View live score for ${match.match}`}
                          className="text-xs bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition-colors shadow-md flex items-center gap-1 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/live/${match.id}`);
                          }}
                        >
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                          Live Score
                        </button>
                      ) : (
                        <button
                          aria-label={`Add reminder for ${match.match}`}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg transition-colors shadow-md flex items-center gap-1 font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add reminder functionality
                          }}
                        >
                          <MdStar className="text-orange-400" />
                          Reminder
                        </button>
                      )}
                      <button
                        aria-label={`View details for ${match.match}`}
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md flex-1 ml-2 font-medium"
                      >
                        Match Details
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-xs">
          <p>© IPL 2025 • All matches shown in Indian Standard Time (IST)</p>
        </div>
      </div>
    </div>
  );
};

export default IPLMatches;