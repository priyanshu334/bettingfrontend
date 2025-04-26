// File: /components/match-card/UserBalanceDisplay.tsx
import React from "react";

interface UserBalanceDisplayProps {
  balance: number;
}

const UserBalanceDisplay: React.FC<UserBalanceDisplayProps> = ({ balance }) => {
  return (
    <div className="bg-amber-100 p-3 rounded-md shadow-sm text-center">
      <div className="text-sm text-gray-700">Current Balance</div>
      <div className="text-2xl font-bold text-amber-800">₹{balance.toLocaleString()}</div>
    </div>
  );
};

export default UserBalanceDisplay;