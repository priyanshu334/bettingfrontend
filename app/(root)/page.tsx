'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, ChevronRight, Zap, Shield, Clock, Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTeam, setActiveTeam] = useState(0);
  
  // IPL Teams
  const iplTeams = [
    { name: "Mumbai Indians", color: "bg-blue-600", textColor: "text-blue-600" },
    { name: "Chennai Super Kings", color: "bg-yellow-500", textColor: "text-yellow-500" },
    { name: "Royal Challengers Bangalore", color: "bg-red-600", textColor: "text-red-600" },
    { name: "Delhi Capitals", color: "bg-blue-500", textColor: "text-blue-500" },
    { name: "Kolkata Knight Riders", color: "bg-purple-700", textColor: "text-purple-700" }
  ];

  // Today's matches
  const todayMatches = [
    { team1: "MI", team2: "CSK", time: "7:30 PM", odds: { 1: 1.85, 2: 1.95 } },
    { team1: "RCB", team2: "DC", time: "3:30 PM", odds: { 1: 1.75, 2: 2.05 } }
  ];

  useEffect(() => {
    setIsLoaded(true);
    
    // Auto-rotate featured team
    const teamInterval = setInterval(() => {
      setActiveTeam((prev) => (prev + 1) % iplTeams.length);
    }, 3000);
    
    return () => clearInterval(teamInterval);
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute w-96 h-96 rounded-full bg-yellow-500/20 blur-3xl -top-20 -left-20 transition-all duration-1000 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute w-80 h-80 rounded-full bg-blue-500/20 blur-3xl bottom-40 right-10 transition-all duration-1000 delay-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute w-64 h-64 rounded-full bg-purple-500/20 blur-3xl -bottom-20 left-40 transition-all duration-1000 delay-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* Cricket ball animation */}
        <div className="absolute top-20 right-10 w-16 h-16 rounded-full bg-red-600 border-2 border-red-700 shadow-lg animate-bounce hidden md:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-1 bg-red-800 rounded-full transform rotate-45"></div>
            <div className="w-12 h-1 bg-red-800 rounded-full transform -rotate-45"></div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Header */}
        <div className={`text-center space-y-6 transform transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Samrat<span className="text-yellow-400">Betting</span>
            </h1>
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-xl md:text-2xl font-medium max-w-3xl mx-auto text-white/90">
            The Ultimate IPL Betting Experience
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full mx-auto"></div>
        </div>
        
        {/* IPL Season Banner */}
        <div className={`mt-8 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-white/10 shadow-xl transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="inline-block px-4 py-1 mb-4 bg-yellow-500 text-black font-bold rounded-full text-sm">
                IPL 2025 SEASON LIVE
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                Bet on Today's IPL Matches
              </h2>
              <p className="text-white/80 text-base md:text-lg max-w-lg">
                Place your bets on live IPL matches, predict winners, and win big rewards instantly!
              </p>
            </div>
            <div className="shrink-0">
              <Link href="/cricket">
                <Button className="text-base px-6 py-6 rounded-xl shadow-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 transition border-0 font-medium group flex items-center">
                  <Zap className="mr-2 w-5 h-5" />
                  Bet Now
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/games">
                <Button className="text-base px-6 py-6 mt-5 rounded-xl shadow-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 transition border-0 font-medium group flex items-center">
                  <Zap className="mr-2 w-5 h-5" />
                  Play Games
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Today's Featured Matches */}
        <div className={`mt-10 transition-all duration-1000 delay-300 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-400" />
            Today's Featured Matches
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayMatches.map((match, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all border border-white/10 group">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                    <span className="text-sm">{match.time}</span>
                  </div>
                  <div className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full">
                    Live Betting
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/30 flex items-center justify-center text-xl font-bold">
                      {match.team1}
                    </div>
                    <div className="mt-2 text-lg font-semibold">{match.odds[1]}</div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold">VS</div>
                    <Button className="mt-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 group-hover:scale-105 transition">
                      Bet Now
                    </Button>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/30 flex items-center justify-center text-xl font-bold">
                      {match.team2}
                    </div>
                    <div className="mt-2 text-lg font-semibold">{match.odds[2]}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* IPL Teams Section */}
        <div className={`mt-10 transition-all duration-1000 delay-500 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
            IPL Team Odds
          </h2>
          
          <div className="overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-lg">{iplTeams[activeTeam].name}</h3>
              <span className="text-yellow-400">Win Rate: 1.75x</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
              {iplTeams.map((team, idx) => (
                <div
                  key={idx}
                  className={`shrink-0 w-3 h-16 rounded-full cursor-pointer transition-all duration-300 ${activeTeam === idx ? team.color : 'bg-white/30'}`}
                  onClick={() => setActiveTeam(idx)}
                ></div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-white/70">Select a team to view odds</span>
              <Link href="/cricket">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                  View Details <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className={`mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {[
            {
              icon: <Zap className="w-8 h-8 text-yellow-400" />,
              title: "Instant Betting",
              desc: "Place bets in real-time during live IPL matches",
              color: "from-yellow-600/20 to-amber-600/20"
            },
            {
              icon: <Shield className="w-8 h-8 text-green-400" />,
              title: "Secure Payments",
              desc: "Fast deposits and withdrawals with 100% security",
              color: "from-green-600/20 to-emerald-600/20"
            },
            {
              icon: <Gift className="w-8 h-8 text-purple-400" />,
              title: "Welcome Bonus",
              desc: "Get ₹500 free on your first deposit",
              color: "from-purple-600/20 to-indigo-600/20"
            }
          ].map((feature, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${feature.color} backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1`}>
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.desc}</p>
            </div>
          ))}
        </div>
        
        {/* CTA Section */}
        <div className={`mt-16 text-center transform transition-all duration-1000 delay-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Win Big?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <Button className="text-base px-8 py-6 rounded-xl shadow-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 transition border-0 font-medium">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/cricket">
              <Button className="text-base px-8 py-6 rounded-xl shadow-lg bg-white/10 border border-white/50 text-white hover:bg-white/20 transition font-medium">
                See All Matches
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`mt-16 pt-6 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60 transform transition-all duration-1000 delay-1200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            <span>100% secure & reliable | 18+ only</span>
          </div>
          
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/responsible-gaming" className="hover:text-white transition">Responsible Gaming</Link>
            <Link href="/support" className="hover:text-white transition">Support</Link>
          </div>
        </div>
      </div>
    </main>
  );
}