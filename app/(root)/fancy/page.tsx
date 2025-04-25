"use client";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

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
  
  const { user, token, isAuthenticated, updateUserBalance } = useAuthStore();

  useEffect(() => {
    // Show sidebar by default on larger screens
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowBetsSidebar(true);
      } else {
        setShowBetsSidebar(false);
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        // Show bet history on mobile after placing a bet
        if (window.innerWidth < 1024) {
          setShowBetsSidebar(true);
        }
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
    <div className="flex flex-col lg:flex-row bg-orange-50 min-h-screen">
      {/* Header - visible on all devices */}
      <div className="sticky top-0 z-30 w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white p-3 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold flex items-center">
            <span className="bg-white text-orange-600 rounded-full p-1 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5" />
              </svg>
            </span>
            IPL Stats & Betting
          </h1>
          
          {isAuthenticated && user && (
            <div className="bg-white bg-opacity-20 border border-white border-opacity-30 px-3 py-1 rounded-full backdrop-blur-sm">
              <span className="text-white text-sm">Balance: </span>
              <span className="font-semibold text-white">₹{user.money.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 p-3 transition-all duration-300 ${showBetsSidebar ? 'lg:pr-[350px]' : ''}`}>
        {/* Mobile navigation buttons */}
        <div className="sticky top-16 z-20 mb-3 flex justify-between lg:hidden">
          <button 
            onClick={() => setShowBetsSidebar(!showBetsSidebar)}
            className={`flex-1 mx-1 py-2 rounded-md font-medium text-white shadow-md ${showBetsSidebar ? 'bg-orange-400' : 'bg-orange-600'}`}
          >
            {showBetsSidebar ? 'View Stats' : 'View My Bets'}
          </button>
        </div>

        {/* Stats table - hidden on mobile when sidebar is showing */}
        <div className={`${showBetsSidebar ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white shadow-xl rounded-xl overflow-hidden border-t-4 border-orange-600">
            {statsData.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-7 items-center text-center border-b last:border-b-0 hover:bg-orange-50"
              >
                <div className="col-span-3 p-3 font-semibold text-sm text-left border-r">
                  {item.title}
                </div>
                <div
                  className="col-span-2 p-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold cursor-pointer hover:from-orange-600 hover:to-orange-500 active:from-orange-700 active:to-orange-600 transition-colors"
                  onClick={() => openBetDialog(item, 'pink')}
                >
                  <div className="text-base">{item.pink}</div>
                  <div className="text-xs bg-white bg-opacity-20 rounded-full mx-auto w-12 py-1">PINK</div>
                </div>
                <div
                  className="col-span-2 p-3 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-semibold cursor-pointer hover:from-blue-600 hover:to-blue-500 active:from-blue-700 active:to-blue-600 transition-colors"
                  onClick={() => openBetDialog(item, 'blue')}
                >
                  <div className="text-base">{item.blue}</div>
                  <div className="text-xs bg-white bg-opacity-20 rounded-full mx-auto w-12 py-1">BLUE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bets Sidebar - fixed on desktop, full page on mobile when active */}
      {showBetsSidebar && (
        <div className={`
          ${showBetsSidebar ? 'block' : 'hidden lg:block'}
          lg:fixed lg:top-16 lg:right-0 lg:w-[350px] lg:h-[calc(100vh-4rem)] 
          w-full p-3 bg-orange-50 lg:overflow-auto lg:shadow-xl
        `}>
          <div className="sticky top-0 z-10 bg-white shadow rounded-xl p-4 border-t-4 border-orange-600">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-orange-800">Your Bets</h2>
              <button 
                onClick={() => setShowBetsSidebar(false)}
                className="lg:hidden bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded-md"
              >
                Close
              </button>
            </div>
            
            {!isAuthenticated ? (
              <div className="text-center text-gray-500 py-8">
                Please login to view your bets
              </div>
            ) : isLoading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Loading bets...
              </div>
            ) : userBets.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No bets placed yet
              </div>
            ) : (
              <div className="space-y-3">
                {userBets.map((bet, index) => (
                  <div 
                    key={bet.id || index} 
                    className={`p-3 rounded-lg border ${
                      bet.selectedTeam === 'pink' 
                        ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200' 
                        : 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-sm">{bet.betTitle}</h3>
                        <p className="text-xs text-gray-600">
                          Team: <span className={`font-medium capitalize ${
                            bet.selectedTeam === 'pink' ? 'text-orange-600' : 'text-blue-600'
                          }`}>{bet.selectedTeam}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        bet.won 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bet.won ? 'Won' : 'Pending'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white bg-opacity-50 p-2 rounded">
                        <p className="text-gray-500 text-xs">Amount</p>
                        <p className="font-medium">₹{bet.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white bg-opacity-50 p-2 rounded">
                        <p className="text-gray-500 text-xs">Runs</p>
                        <p className="font-medium">{bet.odds}</p>
                      </div>
                      <div className="col-span-2 bg-white bg-opacity-70 p-2 rounded">
                        <p className="text-gray-500 text-xs">Potential Win</p>
                        <p className="font-medium text-green-600">₹{calculatePotentialWin(bet).toLocaleString()}</p>
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
              <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg border border-orange-200">
                <div className="flex justify-between font-medium">
                  <span>Total Bets:</span>
                  <span>{userBets.length}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>₹{userBets.reduce((sum, bet) => sum + bet.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-green-600">
                  <span>Potential Wins:</span>
                  <span>₹{userBets.reduce((sum, bet) => sum + calculatePotentialWin(bet), 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Betting Dialog */}
      {showDialog && selectedBet && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-orange-50 to-white border-t-[6px] border-orange-600 rounded-xl p-5 w-full max-w-sm shadow-lg space-y-4 relative">
            <button
              onClick={resetBetState}
              className="absolute top-2 right-3 text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold text-orange-800">Place Bet</h2>
            <p className="text-sm font-medium text-black">{selectedBet.title}</p>
            
            {user && (
              <div className="text-sm text-gray-700 bg-white p-2 rounded-md">
                Available Balance: <span className="font-bold">₹{user.money.toLocaleString()}</span>
              </div>
            )}
            
            <div className={`p-3 rounded-md ${
              selectedTeam === 'pink' 
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white'
            }`}>
              <p className="font-bold text-center">
                {selectedTeam === 'pink' ? 'PINK' : 'BLUE'}: {selectedTeam === 'pink' ? selectedBet.pink : selectedBet.blue}
              </p>
            </div>

            <div>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="p-3 rounded-md bg-white w-full border border-orange-200 focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                placeholder="Enter bet amount"
                min="100"
                max={user ? user.money : 200000}
              />
            </div>

            <p className="text-center text-sm text-gray-600">Quick Add:</p>
            <div className="grid grid-cols-5 gap-2">
              {[1000, 2000, 5000, 10000, 20000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(prev => Math.min(prev + val, user ? user.money : Infinity))}
                  disabled={!user || user.money < val}
                  className={`${
                    !user || user.money < val 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  } text-white py-2 rounded text-sm`}
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-700 text-center">Min: ₹100 | Max: {user ? `₹${user.money.toLocaleString()}` : 'Login required'}</p>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                onClick={() => setAmount(0)}
                className="text-orange-600 underline text-sm"
              >
                Clear
              </button>
              <button
                onClick={handlePlaceBet}
                disabled={amount <= 0 || isLoading || (!user || (user && amount > user.money))}
                className={`px-4 py-2 rounded-md ${
                  amount > 0 && !isLoading && (user && amount <= user.money) 
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white' 
                    : 'bg-gray-400 cursor-not-allowed text-gray-200'
                }`}
              >
                {isLoading ? 'Processing...' : 'Place Bet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Bet placed successfully!</span>
        </div>
      )}

      {/* Error Popup */}
      {error && !showDialog && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 transition-all duration-300 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default IPLStatsPage;