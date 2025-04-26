// File: /components/match-card/SectionHeader.tsx
import React from "react";

interface SectionHeaderProps {
  title: string;
  showCashout?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, showCashout = false }) => {
  return (
    <div className="flex items-center justify-between bg-emerald-800 text-white font-semibold px-4 py-3 rounded-t-md">
      <span className="text-base">{title}</span>
      {showCashout && (
        <button className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1 rounded transition duration-200">
          CASHOUT
        </button>
      )}
    </div>
  );
};

export default SectionHeader;