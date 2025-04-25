"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

// Define types for the stat items and bet data
interface Stat {
  title: string;
  pink: number | string;
  blue: number | string;
  total: string;
}

interface Bet {
  id?: string;
  userId: string;
  amount: number;
  betTitle: string;
  selectedTeam: 'pink' | 'blue';
  odds: number | string;
  won: boolean;
  creditedTo?: 'admin' | 'member';
  timestamp?: string;
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

const IPLStatsPage: React.FC = () => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [selectedBet, setSelectedBet] = useState<Stat | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'pink' | 'blue'>('pink');
  const [amount, setAmount] = useState<number>(0);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [showBetsSidebar, setShowBetsSidebar] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Get auth state from store
  const { user, token, isAuthenticated, updateUserBalance } = useAuthStore();

  // Check mobile view on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowBetsSidebar(true);
      } else {
        setShowBetsSidebar(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Fetch user bets on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserBets();
    }
  }, [isAuthenticated, user]);

  const fetchUserBets = async () => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bet/user/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserBets(data.bets || []);
      } else {
        console.error("Failed to fetch bets:", await response.text());
      }
    } catch (err) {
      console.error("Error fetching user bets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBet = async (): Promise<void> => {
    if (!isAuthenticated) {
      setError("Please login first to place bets");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!user) {
      setError("User information not available");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (selectedBet && amount > 0) {
      // Check if user has enough balance
      if (user.money < amount) {
        setError("Insufficient balance to place this bet");
        setTimeout(() => setError(null), 3000);
        return;
      }

      setIsLoading(true);
      try {
        const betData: Bet = {
          userId: user._id,
          amount,
          betTitle: selectedBet.title,
          selectedTeam,
          odds: selectedTeam === 'pink' ? selectedBet.pink : selectedBet.blue,
          won: false
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bet/place`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(betData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to place bet');
        }

        const responseData = await response.json();
        
        // Update local state
        setUserBets(prev => [responseData.bet, ...prev]);
        
        // Update user balance in global state
        updateUserBalance(user.money - amount);
        
        resetBetState();
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 3000);
      } catch (err) {
        console.error("Error placing bet:", err);
        setError(err instanceof Error ? err.message : 'Failed to place bet');
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openBetDialog = (item: Stat, team: 'pink' | 'blue') => {
    if (!isAuthenticated) {
      setError("Please login first to place bets");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* IPL Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-4 md:py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-md">
              <span className="text-orange-600 font-bold text-xl md:text-3xl">IPL</span>
            </div>
            <h1 className="ml-3 text-2xl md:text-3xl font-bold">IPL Stats & Betting</h1>
          </div>
          
          {isAuthenticated && user && (
            <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg shadow">
              <div className="mr-2">
                <span className="text-white text-sm">Balance</span>
                <div className="font-bold text-xl">₹{user.money.toLocaleString()}</div>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">₹</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Toast */}
      {showConfirmation && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in-down">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Bet placed successfully!</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Stats Table - Main Content */}
          <div className={`${showBetsSidebar ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-orange-800">Match Statistics</h2>
              {isMobile && (
                <button 
                  onClick={() => setShowBetsSidebar(!showBetsSidebar)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg shadow-md transition-all duration-200 text-sm md:text-base flex items-center"
                >
                  {showBetsSidebar ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Hide Bets
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      My Bets ({userBets.length})
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-orange-100">
              <div className="grid grid-cols-4 bg-orange-600 text-white font-bold text-sm md:text-base py-3">
                <div className="col-span-1 pl-4">Stat Category</div>
                <div className="col-span-1 text-center">Under</div>
                <div className="col-span-1 text-center">Over</div>
                <div className="col-span-1 text-center">Result</div>
              </div>
              
              {statsData.map((item, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-4 items-center text-center border-b last:border-b-0 ${idx % 2 === 0 ? 'bg-orange-50' : 'bg-white'} hover:bg-orange-100 transition-colors`}
                >
                  <div className="col-span-1 py-3 px-4 font-medium text-sm md:text-base text-left">
                    {item.title}
                  </div>
                  <div
                    className="col-span-1 py-3 cursor-pointer transition-all duration-200 hover:bg-pink-200 hover:shadow-inner"
                    onClick={() => openBetDialog(item, 'pink')}
                  >
                    <div className="bg-pink-100 rounded-lg py-2 px-1 mx-1 md:mx-4">
                      <div className="text-base font-bold text-pink-800">{item.pink}</div>
                      <div className="text-xs text-pink-600 font-medium">Odds: 1.0</div>
                    </div>
                  </div>
                  <div
                    className="col-span-1 py-3 cursor-pointer transition-all duration-200 hover:bg-blue-200 hover:shadow-inner"
                    onClick={() => openBetDialog(item, 'blue')}
                  >
                    <div className="bg-blue-100 rounded-lg py-2 px-1 mx-1 md:mx-4">
                      <div className="text-base font-bold text-blue-800">{item.blue}</div>
                      <div className="text-xs text-blue-600 font-medium">Odds: 1.0</div>
                    </div>
                  </div>
                  <div className="col-span-1 py-3 text-red-600 text-sm">{item.total}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bets Sidebar */}
          {showBetsSidebar && (
            <div className={`${isMobile ? 'fixed inset-0 z-40 bg-black bg-opacity-50' : 'lg:w-1/3'}`}>
              <div className={`bg-white shadow-lg rounded-xl p-4 ${isMobile ? 'absolute right-0 top-0 h-full w-11/12 max-w-md overflow-y-auto' : 'sticky top-4 overflow-y-auto max-h-[calc(100vh-8rem)]'} border-2 border-orange-200`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-xl font-bold ml-2 text-orange-800">Your Bets</h2>
                  </div>
                  {isMobile && (
                    <button 
                      onClick={() => setShowBetsSidebar(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {!isAuthenticated ? (
                  <div className="bg-orange-50 rounded-lg p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-orange-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-orange-800 font-medium">Please login to view your bets</p>
                    <button className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow transition-colors">
                      Login Now
                    </button>
                  </div>
                ) : isLoading ? (
                  <div className="text-center text-orange-600 py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-3"></div>
                    Loading bets...
                  </div>
                ) : userBets.length === 0 ? (
                  <div className="bg-orange-50 rounded-lg p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-orange-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-orange-800 font-medium">No bets placed yet</p>
                    <p className="text-sm text-orange-600 mt-2">Click on any odds to place your first bet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                    {userBets.map((bet, index) => (
                      <div 
                        key={bet.id || index} 
                        className={`p-3 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg ${
                          bet.selectedTeam === 'pink' 
                            ? 'bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-400' 
                            : 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-800">{bet.betTitle}</h3>
                            <p className="text-xs text-gray-600">
                              Prediction: <span className="font-medium capitalize">{bet.selectedTeam === 'pink' ? 'Under' : 'Over'}</span>
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            bet.won 
                              ? 'bg-green-100 text-green-800 border border-green-300' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          }`}>
                            {bet.won ? 'Won' : 'Pending'}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium text-orange-800">₹{bet.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Runs</p>
                            <p className="font-medium text-orange-800">{bet.odds}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500">Potential Win</p>
                            <p className="font-bold text-green-600">₹{calculatePotentialWin(bet).toLocaleString()}</p>
                          </div>
                        </div>
                        {bet.timestamp && (
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(bet.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isAuthenticated && userBets.length > 0 && (
                  <div className="mt-4 bg-orange-100 rounded-lg p-4 border border-orange-200">
                    <div className="text-lg font-bold text-orange-800 mb-2">Bet Summary</div>
                    <div className="flex justify-between font-medium text-sm">
                      <span>Total Bets:</span>
                      <span className="text-orange-800">{userBets.length}</span>
                    </div>
                    <div className="flex justify-between font-medium text-sm border-b border-orange-200 pb-1">
                      <span>Total Amount:</span>
                      <span className="text-orange-800">₹{userBets.reduce((sum, bet) => sum + bet.amount, 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-1 text-green-700">
                      <span>Potential Wins:</span>
                      <span>₹{userBets.reduce((sum, bet) => sum + calculatePotentialWin(bet), 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Betting Dialog */}
      {showDialog && selectedBet && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-orange-100 to-white border-t-[6px] border-orange-600 rounded-xl p-5 w-full max-w-md shadow-2xl space-y-4 relative animate-pop-in">
            <button
              onClick={resetBetState}
              className="absolute top-2 right-3 text-white bg-orange-500 hover:bg-orange-600 rounded-full px-2.5 py-0.5 text-sm transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-orange-800 ml-2">Place Your Bet</h2>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <p className="font-medium text-gray-700">{selectedBet.title}</p>
              <div className={`mt-2 p-3 rounded-md font-bold ${
                selectedTeam === 'pink' 
                  ? 'bg-pink-100 text-pink-800 border border-pink-300' 
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
              }`}>
                <div className="flex justify-between items-center">
                  <span>{selectedTeam === 'pink' ? 'Under' : 'Over'}</span>
                  <span>{selectedTeam === 'pink' ? selectedBet.pink : selectedBet.blue}</span>
                </div>
              </div>
            </div>

            {user && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Available Balance:</span>
                <span className="font-bold text-green-700">₹{user.money.toLocaleString()}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Enter Bet Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  id="amount"
                  type="number"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="pl-8 p-2 rounded-md bg-white w-full border-2 border-orange-200 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50 transition-all outline-none"
                  placeholder="Min: ₹100"
                  min="100"
                  max={user ? user.money : 200000}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Add</label>
              <div className="grid grid-cols-5 gap-2">
                {[1000, 2000, 5000, 10000, 20000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(prev => Math.min(prev + val, user ? user.money : Infinity))}
                    disabled={!user || user.money < val}
                    className={`${
                      !user || user.money < val 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    } text-white py-1 rounded text-sm font-medium transition-colors`}
                  >
                    +{val/1000}k
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {[25000, 50000, 75000, 90000, 95000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(prev => Math.min(prev + val, user ? user.money : Infinity))}
                    disabled={!user || user.money < val}
                    className={`${
                      !user || user.money < val 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    } text-white py-1 rounded text-sm font-medium transition-colors`}
                  >
                    +{val/1000}k
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-700 bg-orange-50 p-2 rounded">Range: ₹100 to ₹2,00,000 (Max: {user ? `₹${user.money.toLocaleString()}` : 'Login required'})</p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm animate-shake">
                <span className="block">{error}</span>
              </div>
            )}

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setAmount(0)}
                className="text-orange-600 underline text-sm hover:text-orange-800 transition-colors"
              >
                Clear Amount
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={amount <= 0 || isLoading || (!user || (user && amount > user.money))}
                className={`px-6 py-2 rounded-lg font-bold shadow-md transform transition-all duration-200 ${
                  amount > 0 && !isLoading && (user && amount <= user.money) 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:-translate-y-0.5 hover:shadow-lg' 
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Place Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPLStatsPage;