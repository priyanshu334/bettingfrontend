import React from "react";

const RulesList: React.FC = () => {
  const rules = [
    "All bets will be settled based on official results from the recognized governing body of the match.",
    "If a match is abandoned, postponed, or cancelled, all bets will be void unless the game is completed within 48 hours of the original start time.",
    "Bets on match winner (outright) will be settled based on the official result. In case of a tie where no tie-breaker is used, bets will be void.",
    "For 'Top Batsman/Bowler' markets, the player must be in the starting XI for bets to stand.",
    "In 'Total Runs' markets, the full quoted overs must be bowled unless the result is already determined.",
    "For live betting, all bets stand regardless of subsequent interruptions, unless the match is abandoned.",
    "Any changes to scheduled start times (within 12 hours) will not affect betting unless the match is postponed to another day.",
    "Bets placed after the official start time will be void, except for live betting markets which are clearly indicated.",
    "In case of a player substitution before the match starts, all bets on that player will be void.",
    "All betting rules are subject to the bookmaker's terms and conditions, which take precedence in case of any dispute."
  ];

  return (
    <div className=" mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800  p-6 shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
          Cricket Betting Rules
        </h1>
        <p className="text-blue-100 text-center mt-2 max-w-2xl mx-auto">
          Understanding these rules will ensure a smooth betting experience and help avoid potential disputes.
        </p>
      </div>
      
      <div className="bg-white rounded-b-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-6 md:p-8">
          <div className="space-y-6">
            {rules.map((rule, index) => (
              <div key={index} className="flex group">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm transition-colors duration-200">
                    {index + 1}
                  </div>
                </div>
                <div className="pt-1">
                  <p className="text-gray-700 leading-relaxed">{rule}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Important Notice</h3>
                <p className="mt-1 text-sm text-blue-700">
                  These rules serve as general guidelines. In all cases, specific terms and conditions provided by your bookmaker take precedence.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            Last updated: April 2025 • Contact support for any questions regarding these rules
          </p>
        </div>
      </div>
    </div>
  );
};

export default RulesList;