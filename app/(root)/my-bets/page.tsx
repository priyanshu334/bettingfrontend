"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore"; // Update path as needed
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
  const { user } = useAuthStore();
  const userId = user?._id;
  
  const [placedBets, setPlacedBets] = useState<Bet[]>([]);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBets = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const res = await axios.get(`https://backend.nurdcells.com/api/userbets/${userId}`);
        
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
  }, [userId]);

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
        return "bg-green-100 text-green-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderBetCard = (bet: Bet) => (
    <Card key={bet._id} className="mb-4 overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-slate-50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{bet.type}</CardTitle>
          {bet.status && (
            <Badge className={getStatusColor(bet.status)}>
              {bet.status.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Amount</p>
              <p className="text-sm text-slate-600">₹{bet.amount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Odds</p>
              <p className="text-sm text-slate-600">{bet.odds}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Date</p>
              <p className="text-sm text-slate-600">{formatDate(bet.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-sm font-medium text-slate-900">Potential Win</p>
              <p className="text-sm text-slate-600">₹{bet.potentialWinnings?.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="pt-2 text-sm text-slate-600">
          <p>Match ID: {bet.matchId}</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderSkeletons = () => (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ))}
    </>
  );

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Bets</h1>
        <p className="text-slate-600">Please log in to view your bets.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Bets</h1>
        <div className="text-right">
          <p className="text-sm text-slate-600">Available Balance</p>
          <p className="text-lg font-semibold">₹{user?.money.toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <Tabs defaultValue="placed" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="placed" className="text-base">
            Active Bets
          </TabsTrigger>
          <TabsTrigger value="settled" className="text-base">
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
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <p className="text-slate-600">No active bets found.</p>
                <p className="text-sm text-slate-500 mt-1">Place a bet to get started!</p>
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
              <div className="text-center py-12 bg-slate-50 rounded-lg">
                <p className="text-slate-600">No settled bets found.</p>
              </div>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}