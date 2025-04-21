"use client";
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

interface Position {
  row: number;
  col: number;
}

interface Tile extends Position {
  revealed: boolean;
  isBomb: boolean;
}

interface GameSettings {
  gridSize: number;
  bombCount: number;
  minBet: number;
  maxBet: number;
  baseMultiplier: number;
  multiplierIncrement: number;
}

const DEFAULT_SETTINGS: GameSettings = {
  gridSize: 5, // Fixed 5x5 grid
  bombCount: 5,
  minBet: 10,
  maxBet: 1000,
  baseMultiplier: 1.0,
  multiplierIncrement: 0.2
};

const MinesGame: React.FC = () => {
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [reward, setReward] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [cashoutMessage, setCashoutMessage] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [bombs, setBombs] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(1000);

  // Initialize 5x5 grid
  useEffect(() => {
    const initialGrid: Tile[][] = [];
    for (let i = 0; i < DEFAULT_SETTINGS.gridSize; i++) {
      const row: Tile[] = [];
      for (let j = 0; j < DEFAULT_SETTINGS.gridSize; j++) {
        row.push({
          row: i,
          col: j,
          revealed: false,
          isBomb: false
        });
      }
      initialGrid.push(row);
    }
    setGrid(initialGrid);
  }, []);

  // Generate random bomb positions (5 bombs for 5x5 grid)
  const generateBombs = (clickedPosition: Position): Position[] => {
    const bombs: Position[] = [];
    const gridSize = DEFAULT_SETTINGS.gridSize;
    
    // Ensure the clicked position is not a bomb
    const availablePositions: Position[] = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (i !== clickedPosition.row || j !== clickedPosition.col) {
          availablePositions.push({ row: i, col: j });
        }
      }
    }
    
    // Shuffle and pick bomb positions
    for (let i = 0; i < DEFAULT_SETTINGS.bombCount; i++) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      bombs.push(availablePositions[randomIndex]);
      availablePositions.splice(randomIndex, 1);
    }
    
    return bombs;
  };

  const startGame = (): void => {
    if (!betAmount || isNaN(Number(betAmount))) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    const amount = Number(betAmount);
    if (amount < DEFAULT_SETTINGS.minBet || amount > DEFAULT_SETTINGS.maxBet) {
      toast.error(`Bet must be between ${DEFAULT_SETTINGS.minBet} and ${DEFAULT_SETTINGS.maxBet}`);
      return;
    }

    if (amount > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setBalance(prev => prev - amount);
    setGameStarted(true);
    setGameOver(false);
    setCashoutMessage(null);
    setMultiplier(DEFAULT_SETTINGS.baseMultiplier);
    setReward(amount * DEFAULT_SETTINGS.baseMultiplier);
    
    // Reset grid
    const newGrid = Array(5).fill(0).map((_, row) => 
      Array(5).fill(0).map((_, col) => ({
        row,
        col,
        revealed: false,
        isBomb: false
      }))
    );
    setGrid(newGrid);
    setBombs([]);
    
    setIsLoading(false);
    toast.success('Game started! Click any tile to begin.');
  };

  const handleTileClick = (row: number, col: number): void => {
    if (gameOver || grid[row][col].revealed || !gameStarted) return;

    setIsLoading(true);
    
    let currentBombs = [...bombs];
    if (currentBombs.length === 0) {
      currentBombs = generateBombs({ row, col });
      setBombs(currentBombs);
    }

    const isBomb = currentBombs.some(bomb => bomb.row === row && bomb.col === col);
    
    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      revealed: true,
      isBomb
    };
    setGrid(newGrid);

    if (isBomb) {
      currentBombs.forEach(bomb => {
        if (!newGrid[bomb.row][bomb.col].revealed) {
          newGrid[bomb.row][bomb.col] = {
            ...newGrid[bomb.row][bomb.col],
            revealed: true,
            isBomb: true
          };
        }
      });
      setGrid(newGrid);
      setGameOver(true);
      setCashoutMessage("Game Over! You hit a bomb!");
      toast.error('You hit a bomb! Game over.');
    } else {
      const newMultiplier = multiplier + DEFAULT_SETTINGS.multiplierIncrement;
      setMultiplier(newMultiplier);
      setReward(Number(betAmount) * newMultiplier);
      toast.success(`Safe! Multiplier increased to ${newMultiplier.toFixed(1)}x`);
    }
    
    setIsLoading(false);
  };

  const cashOut = (): void => {
    if (!gameStarted) return;

    const winnings = Number(betAmount) * multiplier;
    setBalance(prev => prev + winnings);
    setGameOver(true);
    setCashoutMessage(`Congratulations! You cashed out ₹${winnings.toFixed(2)}!`);
    toast.success(`Successfully cashed out ₹${winnings.toFixed(2)}!`);
  };

  const resetGame = (): void => {
    setGrid(Array(5).fill(0).map((_, row) => 
      Array(5).fill(0).map((_, col) => ({
        row,
        col,
        revealed: false,
        isBomb: false
      }))
    ))
    setReward(0);
    setGameOver(false);
    setGameStarted(false);
    setCashoutMessage(null);
    setMultiplier(DEFAULT_SETTINGS.baseMultiplier);
    setBombs([]);
    setBetAmount("");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Mines Game</h1>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="font-bold text-green-400">₹{balance.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <Card className="bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border border-gray-700">
        {cashoutMessage && (
          <div className={`mb-4 p-3 rounded-lg text-center font-semibold text-lg bg-gradient-to-r ${cashoutMessage.includes("Congratulations") ? 'from-green-500/20 to-emerald-500/20 border border-green-500/30' : 'from-blue-500/20 to-purple-500/20 border border-blue-500/30'}`}>
            {cashoutMessage}
          </div>
        )}
        
        {!gameStarted ? (
          <div className="mb-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Enter Bet Amount (₹)</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                placeholder={`${DEFAULT_SETTINGS.minBet} - ${DEFAULT_SETTINGS.maxBet}`}
                className="bg-gray-700 border-gray-600 text-white"
                min={DEFAULT_SETTINGS.minBet}
                max={DEFAULT_SETTINGS.maxBet}
              />
              <p className="text-xs text-gray-500">Min: ₹{DEFAULT_SETTINGS.minBet}, Max: ₹{DEFAULT_SETTINGS.maxBet}</p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 font-medium"
              onClick={startGame}
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Current Multiplier</span>
                <span className="text-2xl font-bold text-purple-400">{multiplier.toFixed(1)}x</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-400">Potential Reward</span>
                <span className="text-2xl font-bold text-green-400">₹{reward.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Fixed 5x5 grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {grid.map((row, rowIndex) =>
                row.map((tile, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleTileClick(rowIndex, colIndex)}
                    className={`aspect-square flex items-center justify-center text-xl
                      ${!tile.revealed ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500' : 
                        tile.isBomb ? 'bg-gradient-to-br from-red-500 to-orange-600' : 
                        'bg-gradient-to-br from-blue-500 to-purple-600'}
                      border ${!tile.revealed ? 'border-gray-600' : 'border-gray-500'} rounded-lg transition-all duration-200`}
                    disabled={gameOver || tile.revealed || isLoading}
                  >
                    {tile.revealed && (tile.isBomb ? '💣' : '💎')}
                  </Button>
                ))
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 font-medium"
                onClick={cashOut}
                disabled={gameOver || isLoading}
              >
                {isLoading ? 'Processing...' : 'Cash Out'}
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-2 font-medium"
                onClick={resetGame}
                disabled={isLoading}
              >
                New Game
              </Button>
            </div>
          </>
        )}
      </Card>
      
      <div className="mt-6 text-sm text-gray-400 text-center max-w-md">
        <p>Click tiles to reveal diamonds (💎) and increase your multiplier. Avoid bombs (💣) or you'll lose your bet!</p>
        {gameStarted && <p className="mt-2">Current bet: ₹{betAmount || "0.00"}</p>}
      </div>
    </div>
  );
};

export default MinesGame;