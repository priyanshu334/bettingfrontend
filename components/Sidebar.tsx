"use client"
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Sidebar() {
  const [othersOpen, setOthersOpen] = useState(true);
  const [sportsOpen, setSportsOpen] = useState(true);

  return (
    <div className="w-64 bg-gray-100 h-screen p-4">
      {/* Others Section */}
      <div className="mb-4">
        <button
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-500 bg-teal-400 px-3 py-2 rounded-md"
          onClick={() => setOthersOpen(!othersOpen)}
        >
          Others
          <ChevronDown className={`transform ${othersOpen ? 'rotate-180' : ''}`} />
        </button>
        {othersOpen && (
          <div className="mt-2 space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white px-3 py-2 border rounded-md text-sm">T20 League</div>
            ))}
          </div>
        )}
      </div>

      {/* All Sports Section */}
      <div>
        <button
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-500 bg-teal-400 px-3 py-2 rounded-md"
          onClick={() => setSportsOpen(!sportsOpen)}
        >
          All Sports
          <ChevronDown className={`transform ${sportsOpen ? 'rotate-180' : ''}`} />
        </button>
        {sportsOpen && (
          <div className="mt-2 space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white px-3 py-2 border rounded-md text-sm flex items-center justify-between">
                Cricket
                <ChevronDown size={16} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
