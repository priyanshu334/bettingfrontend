"use client";

import React, { useState } from "react";
import { toast } from "sonner";

interface Player {
  name: string;
  boundaries: number;
  id?: number; // Added for API integration
  teamName?: string; // Added for API integration
}

interface PlayerBoundariesCardProps {
  heading: string;
  players: Player[];
  matchId: number; // Added for API integration
  userId: string; // Added for API integration
}

interface BetResponse {
  message: string;
  newBalance?: number;
  error?: string;
  bet?: any;
}

const PlayerBoundariesCard: React.FC<PlayerBoundariesCardProps> = ({ 
  heading, 
  players, 
  matchId,
  userId 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const openBetModal = (player: Player) => {
    setSelectedPlayer(player);
  };

  const closeModal = () => {
    setSelectedPlayer(null);
    setAmount(100);
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !userId || !matchId) return;

    setIsProcessing(true);

    try {
      toast.promise(
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/boundarybet/place`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add authorization header if needed
            // "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            matchId,
            teamName: selectedPlayer.teamName,
            playerName: selectedPlayer.name,
            predictedBoundaries: selectedPlayer.boundaries,
            betAmount: amount
          })
        }).then(async (response) => {
          const data: BetResponse = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to place bet");
          }
          return data;
        }),
        {
          loading: 'Placing your boundary bet...',
          success: (data) => {
            closeModal();
            return `${data.message}. New balance: ₹${data.newBalance}`;
          },
          error: (error) => error.message || "Boundary bet placement failed",
        }
      );
    } catch (error) {
      console.error("Bet Error:", error);
      toast.error("Bet Failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white shadow-md rounded-lg w-full overflow-hidden border border-gray-200">
        {/* Heading */}
        <div className="bg-blue-200 px-4 py-3 text-left font-semibold text-gray-800 border-b border-gray-300">
          {heading}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-2 md:grid-cols-3 text-sm font-semibold border-b border-gray-300 text-center">
          <div className="text-left px-4 py-2 bg-gray-50 col-span-1">Player</div>
          <div className="bg-blue-500 text-white py-2 hidden md:block">Boundaries</div>
          <div className="bg-gray-100 py-2">Bet</div>
        </div>

        {/* Player Rows */}
        {players.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-2 md:grid-cols-3 border-b border-gray-100 items-center text-sm text-gray-700 text-center"
          >
            <div className="text-left px-4 py-3 font-medium capitalize">{player.name}</div>
            <div className="py-3 hidden md:block text-blue-700 font-semibold">
              {player.boundaries}
            </div>
            <div className="py-3">
              <button
                onClick={() => openBetModal(player)}
                className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold hover:bg-blue-200 transition"
              >
                100
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-pink-100 rounded-lg shadow-xl w-[90%] max-w-md p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-lg font-bold text-gray-700 hover:text-red-600"
              disabled={isProcessing}
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center text-red-900">Place Boundary Bet</h2>
            <div className="text-sm text-gray-700 mb-2">
              Player: <span className="font-medium">{selectedPlayer.name}</span>
            </div>
            <div className="text-sm text-gray-700 mb-2">
              Team: <span className="font-medium">{selectedPlayer.teamName || 'N/A'}</span>
            </div>
            <div className="text-sm text-gray-700 mb-4">
              Predicted Boundaries: <span className="font-medium">{selectedPlayer.boundaries}</span>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              min={100}
              max={200000}
              disabled={isProcessing}
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1000, 2000, 5000, 10000, 20000, 25000, 50000, 75000, 90000, 95000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(amount + val)}
                  className="bg-orange-300 text-white py-2 rounded font-semibold text-sm hover:bg-orange-400 disabled:opacity-50"
                  disabled={isProcessing}
                >
                  +{val / 1000}k
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={handlePlaceBet}
                className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 font-semibold disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Place Bet'}
              </button>
              <button
                onClick={closeModal}
                className="bg-red-500 text-white w-full py-2 rounded hover:bg-red-600 font-semibold disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerBoundariesCard;