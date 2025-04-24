"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import axios from "axios";
import { CalendarIcon, DollarSign, Percent, Trophy } from "lucide-react";

interface Bet {
  _id: string;
  matchId: string;
  type: string;
  status?: "won" | "lost" | "pending" | string;
  amount: number;
  odds: number;
  createdAt?: string;
  potentialWinnings?: number;
  [key: string]: any;
}

export default function UserBets() {
  const { user, token } = useAuthStore();
  const userId = user?._id;
  
  const [placedBets, setPlacedBets] = useState<Bet[]>([]);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Calculate potential winnings for each bet
        const processedPlacedBets = res.data.placedBets.map((bet: Bet) => ({
          ...bet,
          potentialWinnings: bet.amount * bet.odds
        }));
        
        const processedSettledBets = res.data.settledBets.map((bet: Bet) => ({
          ...bet,
          potentialWinnings: bet.amount * bet.odds
        }));
        
        setPlacedBets(processedPlacedBets);
        setSettledBets(processedSettledBets);
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
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9 8a4.5 4.5 0 0 1 6.7 2.4" />
      <path d="M6.5 14.5A4.5 4.5 0 0 0 12 18" />
    </svg>
  );

  const renderBetCard = (bet: Bet) => (
    <Card key={bet._id} className="mb-4 overflow-hidden transition-all hover:shadow-md border-l-4 border-orange-500">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-400 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <CricketBallIcon /> {bet.type}
          </CardTitle>
          {bet.status && (
            <Badge className={`${getStatusColor(bet.status)} font-semibold px-3 py-1`}>
              {bet.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 bg-gradient-to-b from-orange-50 to-white">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <DollarSign className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Amount</p>
              <p className="text-sm font-bold text-orange-700">₹{(bet.amount || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <Percent className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Odds</p>
              <p className="text-sm font-bold text-orange-700">{bet.odds}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <CalendarIcon className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Date</p>
              <p className="text-sm font-bold text-orange-700">{formatDate(bet.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <Trophy className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Potential Win</p>
              <p className="text-sm font-bold text-orange-700">₹{(bet.potentialWinnings || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-2 mt-2 text-sm text-slate-600 border-t border-orange-100">
          <p className="flex items-center gap-2">
            <span className="bg-orange-100 px-2 py-1 rounded text-orange-700 font-medium">Match ID:</span> 
            {bet.matchId}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4">
          <Skeleton className="h-40 w-full rounded-lg bg-orange-100" />
        </div>
      ))}
    </>
  );

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-orange-700">Your IPL Bets</h1>
        <div className="p-8 flex flex-col items-center justify-center">
          <Trophy className="h-16 w-16 text-orange-500 mb-4" />
          <p className="text-slate-700 font-medium">Please log in to view your bets.</p>
          <button className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-colors shadow-md font-medium">
            Login Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg p-4 shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="h-6 w-6" /> Your IPL Bets
          </h1>
          <p className="text-orange-100 text-sm mt-1">Track your cricket betting performance</p>
        </div>
        <div className="text-right bg-white bg-opacity-20 p-3 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-orange-100">Available Balance</p>
          <p className="text-xl font-bold text-white">₹{(user?.money || 0).toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4 shadow">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      <Tabs defaultValue="placed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-orange-100 p-1 rounded-lg">
          <TabsTrigger 
            value="placed" 
            className="text-base data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md"
          >
            Active Bets
          </TabsTrigger>
          <TabsTrigger 
            value="settled" 
            className="text-base data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-md"
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
              <div className="text-center py-12 bg-orange-50 rounded-lg border border-orange-200 shadow-inner">
                <CricketBallIcon />
                <p className="text-orange-800 font-medium mt-2">No active bets found.</p>
                <p className="text-sm text-orange-600 mt-1">Place your first IPL bet to get started!</p>
                <button className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600 transition-colors shadow-md text-sm font-medium">
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
              <div className="text-center py-12 bg-orange-50 rounded-lg border border-orange-200 shadow-inner">
                <Trophy className="h-12 w-12 text-orange-300 mx-auto mb-2" />
                <p className="text-orange-800 font-medium">No settled bets found.</p>
                <p className="text-sm text-orange-600 mt-1">Your completed bets will appear here</p>
              </div>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}