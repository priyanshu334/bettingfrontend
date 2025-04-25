"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { CalendarIcon, DollarSign, Percent, Trophy, AlertCircle } from "lucide-react";

interface Bet {
  _id: string;
  matchId: string;
  type: string;
  status?: "won" | "lost" | "pending" | string;
  amount: number;
  odds: number;
  createdAt?: string;
  potentialWinnings?: number;
  teamNames?: {
    team1: string;
    team2: string;
  };
  [key: string]: any;
}

export default function UserBets() {
  const { user, token } = useAuthStore();
  const userId = user?._id;
  
  const [placedBets, setPlacedBets] = useState<Bet[]>([]);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    profit: 0
  });

  useEffect(() => {
    const fetchBets = async () => {
      if (!userId || !token) return;
      
      setLoading(true);
      try {
        const res = await axios.get(`https://backend.nurdcells.com/api/userbets/userBets/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Add team names mock data for better UI display
        const mockTeams = [
          { team1: "CSK", team2: "MI" },
          { team1: "RCB", team2: "KKR" },
          { team1: "DC", team2: "PBKS" },
          { team1: "RR", team2: "SRH" },
          { team1: "GT", team2: "LSG" }
        ];
        
        // Calculate potential winnings for each bet
        const processedPlacedBets = res.data.placedBets.map((bet: Bet, index: number) => ({
          ...bet,
          potentialWinnings: bet.amount * bet.odds,
          teamNames: mockTeams[index % mockTeams.length]
        }));
        
        const processedSettledBets = res.data.settledBets.map((bet: Bet, index: number) => ({
          ...bet,
          potentialWinnings: bet.amount * bet.odds,
          teamNames: mockTeams[index % mockTeams.length]
        }));
        
        setPlacedBets(processedPlacedBets);
        setSettledBets(processedSettledBets);
        
        // Calculate stats
        const wonBets = processedSettledBets.filter((bet:Bet)=> bet.status === "won");
        const totalWon = wonBets.length;
        const totalLost = processedSettledBets.length - totalWon;
        const winRate = processedSettledBets.length > 0 ? 
          Math.round((totalWon / processedSettledBets.length) * 100) : 0;
        
        const profit = processedSettledBets.reduce((acc:any, bet:any) => {
          if (bet.status === "won") {
            return acc + (bet.amount * bet.odds - bet.amount);
          } else if (bet.status === "lost") {
            return acc - bet.amount;
          }
          return acc;
        }, 0);
        
        setStats({
          totalWon,
          totalLost,
          winRate,
          profit
        });
        
      } catch (err) {
        console.error("Failed to fetch bets", err);
        setError("Failed to load your bets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [userId, token]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-200 text-gray-800";
    
    switch (status.toLowerCase()) {
      case "won":
        return "bg-green-500 text-white";
      case "lost":
        return "bg-red-500 text-white";
      case "pending":
        return "bg-amber-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const CricketBallIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="text-orange-500"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 8a4.5 4.5 0 0 1 6.7 2.4" />
      <path d="M6.5 14.5A4.5 4.5 0 0 0 12 18" />
    </svg>
  );

  const BatIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15 7-7" />
      <path d="m14 12 6.5-6.5a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0L11 9" />
    </svg>
  );

  const renderBetCard = (bet: Bet) => (
    <Card key={bet._id} className="mb-4 overflow-hidden transition-all hover:shadow-xl border-b-4 border-orange-500 rounded-lg">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-400 pb-3 pt-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
            <CricketBallIcon /> {bet.type}
          </CardTitle>
          {bet.status && (
            <Badge className={`${getStatusColor(bet.status)} font-semibold px-3 py-1 rounded-full shadow-md`}>
              {bet.status.toUpperCase()}
            </Badge>
          )}
        </div>
        
        {bet.teamNames && (
          <div className="mt-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center justify-center text-black">
              <span className="font-bold">{bet.teamNames.team1}</span>
              <span className="mx-2 text-orange-100">vs</span>
              <span className="font-bold">{bet.teamNames.team2}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full shadow-md">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Bet Amount</p>
              <p className="text-base font-bold text-orange-700">₹{(bet.amount || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full shadow-md">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Odds</p>
              <p className="text-base font-bold text-orange-700">{bet.odds}x</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full shadow-md">
              <CalendarIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Placed On</p>
              <p className="text-base font-bold text-orange-700">{formatDate(bet.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-full shadow-md">
              <Trophy className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Potential Win</p>
              <p className="text-base font-bold text-orange-700">₹{(bet.potentialWinnings || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-2 mt-1 text-sm text-slate-600 border-t border-orange-100">
          <p className="flex items-center gap-2">
            <span className="bg-orange-100 px-2 py-1 rounded text-orange-700 font-medium text-xs">Match Reference:</span> 
            <span className="truncate text-xs">{bet.matchId}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4">
          <Skeleton className="h-48 w-full rounded-lg bg-orange-100" />
        </div>
      ))}
    </>
  );

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 py-6 px-4">
            <h1 className="text-3xl font-bold text-black flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-8 w-8" /> IPL Betting Dashboard
            </h1>
            <p className="text-orange-100">Experience the thrill of IPL with real-time betting</p>
          </div>
          
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 animate-ping"></div>
              <CricketBallIcon />
            </div>
            <p className="text-slate-700 font-medium mb-4">Please log in to view your bets and join the IPL action!</p>
            <button className="bg-orange-500 text-black px-8 py-3 rounded-full hover:bg-orange-600 transition-colors shadow-lg font-medium flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header and Stats */}
      <div className="mb-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl p-5 shadow-lg text-black">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8" /> IPL Betting Dashboard
            </h1>
            <p className="text-orange-100 mt-1 flex items-center gap-2">
              <BatIcon /> Track your cricket betting performance
            </p>
          </div>
          <div className="text-right bg-white bg-opacity-10 p-4 rounded-xl backdrop-blur-sm mt-4 md:mt-0 shadow-md w-full md:w-auto">
            <p className="text-sm text-orange-100">Available Balance</p>
            <p className="text-2xl font-bold">₹{(user?.money || 0).toLocaleString()}</p>
          </div>
        </div>

        {!loading && settledBets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white bg-opacity-5 backdrop-blur-sm p-4 rounded-xl">
            <div className="text-center p-2 bg-white bg-opacity-10 rounded-lg">
              <p className="text-xs text-black">Win Rate</p>
              <p className="text-xl font-bold">{stats.winRate}%</p>
            </div>
            <div className="text-center p-2 bg-white bg-opacity-10 rounded-lg">
              <p className="text-xs text-black">Total Won</p>
              <p className="text-xl font-bold text-green-400">{stats.totalWon}</p>
            </div>
            <div className="text-center p-2 bg-white bg-opacity-10 rounded-lg">
              <p className="text-xs text-black">Total Lost</p>
              <p className="text-xl font-bold text-red-300">{stats.totalLost}</p>
            </div>
            <div className="text-center p-2 bg-white bg-opacity-10 rounded-lg">
              <p className="text-xs text-black">Net Profit</p>
              <p className={`text-xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-300'}`}>
                ₹{stats.profit.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4 shadow-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      <Tabs defaultValue="placed" className="w-full text-black">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-orange-100 p-1 rounded-xl shadow-md">
          <TabsTrigger 
            value="placed" 
            className="text-base data-[state=active]:bg-orange-500 data-[state=active]:text-black data-[state=active]:shadow-md rounded-lg py-3"
          >
            Active Bets
          </TabsTrigger>
          <TabsTrigger 
            value="settled" 
            className="text-base data-[state=active]:bg-orange-500 data-[state=active]:text-black data-[state=active]:shadow-md rounded-lg py-3"
          >
            Settled Bets
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="placed">
          {loading ? renderSkeletons() : (
            placedBets.length > 0 ? (
              <div className="space-y-4">
                {placedBets.map(renderBetCard)}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-200 shadow-inner">
                <div className="inline-block p-4 bg-orange-100 rounded-full mb-4 animate-pulse">
                  <CricketBallIcon />
                </div>
                <p className="text-xl text-orange-800 font-bold">No active bets found</p>
                <p className="text-orange-600 mt-2 max-w-md mx-auto">Experience the excitement of IPL! Place your first bet to get started with the cricket action.</p>
                <button className="mt-6 bg-orange-500 text-black px-8 py-3 rounded-full hover:bg-orange-600 transition-colors shadow-lg font-medium flex items-center gap-2 mx-auto">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Place New Bet
                </button>
              </div>
            )
          )}
        </TabsContent>
        
        <TabsContent value="settled">
          {loading ? renderSkeletons() : (
            settledBets.length > 0 ? (
              <div className="space-y-4">
                {settledBets.map(renderBetCard)}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-b from-orange-50 to-white rounded-2xl border border-orange-200 shadow-inner">
                <Trophy className="h-16 w-16 text-orange-300 mx-auto mb-4" />
                <p className="text-xl text-orange-800 font-bold">No settled bets yet</p>
                <p className="text-orange-600 mt-2 max-w-md mx-auto">Your completed bets will appear here after matches are finished and results are processed</p>
              </div>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}