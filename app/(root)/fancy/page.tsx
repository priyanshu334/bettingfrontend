"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore"; // Adjust path as needed
import { toast } from "sonner"; // Import toast for notifications

// Define types for the stat items and bet data
interface Stat {
  title: string;
  pink: number | string;
  blue: number | string;
  total: string;
}

interface Bet {
  id?: string;
  _id?: string;
  userId: string;
  amount: number;
  betTitle: string;
  selectedTeam: 'pink' | 'blue';
  odds: number | string;
  won: boolean;
  creditedTo: 'admin' | 'member';
  timestamp?: string;
  createdAt?: string;
}

const statsData: Stat[] = [
  { title: "Lowest inning Runs IPL", pink: 100, blue: 144, total: "" },
  { title: "Highest inning Runs IPL", pink: 240, blue: 260, total: "" },
  { title: "Tournament topBatsman Runs in IPL", pink: 140, blue: 150, total: "" },
  { title: "Highest Runs Scorer", pink: 730, blue: 765, total: "" },
  { title: "Highest Partnership Runs in IPL", pink: 166, blue: 174, total: "" },
  { title: "Highest Wicket Taker IPL", pink: 27, blue: 29, total: "" },
  { title: "How many times 5 or More wickets taken by a Bowler", pink: 5, blue: 4, total: "" },
  { title: "Fastest 50 of IPL", pink: 15, blue: 17, total: "" },
  { title: "Total 4's in IPL", pink: 2215, blue: 2255, total: "" },
  { title: "Total 6's in IPL", pink: 1300, blue: 1345, total: "" },
  { title: "Total 30's in IPL", pink: 190, blue: 196, total: "" },
  { title: "Total 50s in IPL", pink: 146, blue: 153, total: "" },
  { title: "Total 100s in IPL", pink: 9, blue: 16, total: "" },
  { title: "Total No Ball's in IPL", pink: 68, blue: 73, total: "" },
  { title: "Total Caught outs in IPL", pink: 655, blue: 680, total: "" },
  { title: "Total Bowled in IPL", pink: 139, blue: 150, total: "" },
  { title: "Total Wickets in IPL", pink: 925, blue: 995, total: "" },
  { title: "Total Wides in IPL", pink: 865, blue: 895, total: "" },
  { title: "Total LWB's in IPL", pink: 44, blue: 49, total: "" },
  { title: "Most Ducks by Team", pink: 47, blue: 54, total: "" },
  { title: "Total Runout's in IPL", pink: 84, blue: 90, total: "" },
];

interface BetResponse {
  message: string;
  newBalance?: number;
  error?: string;
  bet?: Bet;
}

const IPLStatsPage: React.FC = () => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [selectedBet, setSelectedBet] = useState<Stat | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'pink' | 'blue'>('pink');
  const [amount, setAmount] = useState<number>(0);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [showBetsSidebar, setShowBetsSidebar] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Get auth data from store
  const { user, token, updateUserBalance, isAuthenticated } = useAuthStore();

  // Fetch user bets on component mount
  useEffect(() => {
    if (!isAuthenticated || !token || !user) return;
    
    const fetchUserBets = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bet/user/${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserBets(data);
        } else {
          toast.error("Failed to fetch your bets");
          console.error("Failed to fetch user bets");
        }
      } catch (err) {
        console.error("Error fetching user bets:", err);
        toast.error("Error loading bets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserBets();
  }, [token, user, isAuthenticated]);

  const handlePlaceBet = async (): Promise<void> => {
    if (!isAuthenticated || !user || !token) {
      toast.error("Please login to place bets");
      setError("Please login to place bets");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (selectedBet && amount > 0) {
      // Validate bet amount
      if (amount < 100 || amount > 200000) {
        setError("Bet amount must be between 100 and 2L");
        toast.error("Bet amount must be between 100 and 2L");
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      // Check if user has enough balance
      if (user.money < amount) {
        setError("Insufficient balance");
        toast.error("Insufficient balance");
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const betData: Bet = {
          userId: user._id,
          amount,
          betTitle: selectedBet.title,
          selectedTeam,
          odds: selectedTeam === 'pink' ? selectedBet.pink : selectedBet.blue,
          won: false,
          creditedTo: "admin"
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bet/place`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(betData),
        });

        const responseData: BetResponse = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to place bet');
        }

        // Update user balance in state using newBalance from response if available
        if (responseData.newBalance !== undefined && updateUserBalance) {
          updateUserBalance(responseData.newBalance);
        } else if (user && updateUserBalance) {
          // Fallback to calculated balance
          updateUserBalance(user.money - amount);
        }
        
      // Add new bet to user bets list
if (responseData.bet) {
    setUserBets(prev => [...prev, responseData.bet as Bet]);
  }
        
        resetBetState();
        setShowConfirmation(true);
        toast.success(responseData.message || "Bet placed successfully!");
        setTimeout(() => setShowConfirmation(false), 3000);
      } catch (err) {
        console.error("Error placing bet:", err);
        setError(err instanceof Error ? err.message : 'Failed to place bet');
        toast.error(err instanceof Error ? err.message : 'Failed to place bet');
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openBetDialog = (item: Stat, team: 'pink' | 'blue') => {
    if (!isAuthenticated || !user || !token) {
      setError("Please login to place bets");
      toast.error("Please login to place bets");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setSelectedBet(item);
    setSelectedTeam(team);
    setAmount(0);
    setShowDialog(true);
    setError(null);
  };

  const resetBetState = () => {
    setShowDialog(false);
    setSelectedBet(null);
    setAmount(0);
  };

  const calculatePotentialWin = (bet: Bet): number => {
    const odds = typeof bet.odds === 'string' ? parseFloat(bet.odds) : bet.odds;
    return bet.amount * odds;
  };
  
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Show full-featured success popup like in PlayerWicketsCard
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);

  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  const navigateToBets = () => {
    window.location.href = '/my-bets'; // Simple navigation
    closeSuccessPopup();
  };

  return (
    <div className="flex p-4 bg-gray-100 min-h-screen">
      {/* Main Content */}
      <div className={`${showBetsSidebar ? 'w-3/4' : 'w-full'} transition-all duration-300`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">IPL Match Stats</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="bg-white px-4 py-2 rounded-md shadow">
                <span className="font-medium">Balance:</span> ₹{user.money.toLocaleString()}
              </div>
            )}
            <button 
              onClick={() => setShowBetsSidebar(!showBetsSidebar)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              {showBetsSidebar ? 'Hide Bets' : 'Show Bets'}
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white shadow rounded-xl overflow-hidden">
          {statsData.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-4 items-center text-center border-b last:border-b-0"
            >
              <div className="col-span-1 p-3 font-semibold text-sm text-left border-r">
                {item.title}
              </div>
              <div
                className="col-span-1 p-3 bg-pink-100 font-semibold cursor-pointer hover:bg-pink-200 transition-colors"
                onClick={() => openBetDialog(item, 'pink')}
              >
                <div className="text-base">{item.pink}</div>
                <div className="text-xs text-gray-600">100</div>
              </div>
              <div
                className="col-span-1 p-3 bg-blue-100 font-semibold cursor-pointer hover:bg-blue-200 transition-colors"
                onClick={() => openBetDialog(item, 'blue')}
              >
                <div className="text-base">{item.blue}</div>
                <div className="text-xs text-gray-600">100</div>
              </div>
              <div className="col-span-1 p-3 text-red-600 text-sm">{item.total}</div>
            </div>
          ))}
        </div>

        {/* Betting Dialog */}
        {showDialog && selectedBet && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-pink-200 border-t-[6px] border-orange-700 rounded-xl p-5 w-[400px] shadow-lg space-y-4 relative">
              <button
                onClick={resetBetState}
                className="absolute top-2 right-3 text-white bg-red-500 rounded-full px-2 text-sm"
                disabled={isLoading}
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold text-orange-900">Place Bet</h2>
              <p className="text-sm font-medium text-black">{selectedBet.title}</p>
              
              <div className={`p-2 rounded-md ${selectedTeam === 'pink' ? 'bg-pink-100' : 'bg-blue-100'}`}>
                <p className="font-bold">
                  {selectedTeam === 'pink' ? 'Pink' : 'Blue'}: {selectedTeam === 'pink' ? selectedBet.pink : selectedBet.blue}
                </p>
              </div>

              {user && (
                <div className="text-sm bg-white p-2 rounded-md">
                  <span className="font-medium">Your Balance:</span> ₹{user.money.toLocaleString()}
                </div>
              )}

              <div>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="p-2 rounded-md bg-white w-full"
                  placeholder="Amount"
                  min="100"
                  max={user?.money || 200000}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1000, 2000, 5000, 10000, 20000, 25000, 50000, 75000, 90000, 95000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(Math.min((user?.money || 0), amount + val))}
                    className="bg-orange-400 hover:bg-orange-500 text-white py-1 rounded text-sm disabled:opacity-50"
                    disabled={isLoading || (amount + val) > (user?.money || 0)}
                  >
                    +{val / 1000}k
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-700">Range: 100 to 2L</p>

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={() => setAmount(0)}
                  className="text-blue-700 underline text-sm"
                  disabled={isLoading}
                >
                  Clear
                </button>
                <button
                  onClick={handlePlaceBet}
                  disabled={amount <= 0 || isLoading || amount > (user?.money || 0)}
                  className={`px-4 py-2 rounded ${
                    amount > 0 && !isLoading && amount <= (user?.money || 0)
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-400 cursor-not-allowed text-gray-200'
                  }`}
                >
                  {isLoading ? 'Processing...' : 'Place Bet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Confirmation Popup */}
        {showConfirmation && (
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300">
            🎉 Bet placed successfully!
          </div>
        )}

        {/* Success Popup - Enhanced Version */}
        {showSuccessPopup && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
              <button
                onClick={closeSuccessPopup}
                className="absolute top-3 right-3 text-xl font-bold text-gray-700 hover:text-red-600 transition-colors"
              >
                ×
              </button>
              
              <div className="text-center">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Bet Placed Successfully!</h2>
                <p className="text-gray-600 mb-6">Your bet has been placed successfully and can be viewed in your bet history.</p>
                
                <div className="flex gap-4">
                  <button
                    onClick={navigateToBets}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    See Bets
                  </button>
                  
                  <button
                    onClick={closeSuccessPopup}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                  >
                    Continue Betting
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Popup */}
        {error && (
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300">
            {error}
          </div>
        )}
      </div>

      {/* Bets Sidebar */}
      {showBetsSidebar && (
        <div className="w-1/4 pl-4 transition-all duration-300">
          <div className="bg-white shadow rounded-xl p-4 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Your Bets</h2>
            
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">
                Loading your bets...
              </div>
            ) : !isAuthenticated ? (
              <div className="text-center text-gray-500 py-8">
                Please login to view your bets
              </div>
            ) : userBets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No bets placed yet
              </div>
            ) : (
              <div className="space-y-3">
                {userBets.map((bet, index) => (
                  <div 
                    key={bet._id || bet.id || index} 
                    className={`p-3 rounded-lg border ${bet.selectedTeam === 'pink' ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{bet.betTitle}</h3>
                        <p className="text-xs text-gray-600">
                          On: <span className="font-medium capitalize">{bet.selectedTeam}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${bet.won ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {bet.won ? 'Won' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium">₹{bet.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Odds</p>
                        <p className="font-medium">{bet.odds}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Potential Win</p>
                        <p className="font-medium">₹{calculatePotentialWin(bet).toLocaleString()}</p>
                      </div>
                    </div>
                    {(bet.timestamp || bet.createdAt) && (
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDateTime(bet.timestamp || bet.createdAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {user && userBets.length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <div className="flex justify-between font-medium">
                  <span>Total Bets:</span>
                  <span>{userBets.length}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>₹{userBets.reduce((sum, bet) => sum + bet.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Potential Wins:</span>
                  <span>₹{userBets.reduce((sum, bet) => sum + calculatePotentialWin(bet), 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IPLStatsPage;