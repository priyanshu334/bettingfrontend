"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ColorOption = "red" | "green" | "blue";
const colors: ColorOption[] = ["red", "green", "blue"];
const colorMultipliers: Record<ColorOption, number> = {
  red: 2,
  green: 3,
  blue: 1.5
};

export default function ColorPredictionGame() {
  const [balance, setBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(0); // Changed to 0
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [predictedColor, setPredictedColor] = useState<ColorOption | null>(null);
  const [result, setResult] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handlePlaceBet = () => {
    if (betAmount <= 0 || betAmount > balance || !selectedColor) return;
    
    setIsProcessing(true);
    setResult("Spinning...");
    
    // Deduct bet amount immediately
    setBalance(prev => prev - betAmount);
    
    // Simulate spinning delay
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * colors.length);
      const randomColor = colors[randomIndex];
      setPredictedColor(randomColor);
      
      if (randomColor === selectedColor) {
        const winAmount = betAmount * colorMultipliers[selectedColor];
        setBalance(prev => prev + winAmount);
        setResult(`You won ₹${winAmount.toFixed(2)}!`);
        setShowConfetti(true);
        setGameHistory(prev => [...prev, `Won ₹${winAmount.toFixed(2)} on ${selectedColor}`]);
      } else {
        setResult(`You lost ₹${betAmount.toFixed(2)}`);
        setGameHistory(prev => [...prev, `Lost ₹${betAmount.toFixed(2)} on ${selectedColor}`]);
      }
      
      setIsProcessing(false);
    }, 1500);
  };

  const resetGame = () => {
    setSelectedColor(null);
    setPredictedColor(null);
    setResult("");
    setShowConfetti(false);
  };

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    // Only allow values between 0 and balance
    if (value >= 0 && value <= balance) {
      setBetAmount(value);
    } else if (value > balance) {
      setBetAmount(balance);
    }
  };

  // Auto-reset confetti after 3 seconds
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(150)].map((_, i) => (
        <div 
          key={i}
          className="absolute animate-fall"
          style={{
            top: '-10px',
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: '50%',
            animation: `fall ${Math.random() * 3 + 2}s linear ${Math.random() * 0.5}s forwards`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br w-full from-gray-900 to-gray-800 text-white p-4 flex flex-col items-center">
      {showConfetti && <Confetti />}
      
      <h1 className="text-3xl font-bold my-6 text-center">Color Prediction Game</h1>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 w-full max-w-md shadow-lg">
        {/* Balance Display */}
        <div className="text-2xl font-bold mb-6 text-center">
          Balance: ₹{balance.toFixed(2)}
        </div>
        
        {/* Game Area */}
        {!predictedColor ? (
          <>
            {/* Bet Amount Input */}
            <div className="mb-6">
              <label className="block mb-2 text-lg">Bet Amount (₹)</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={betAmount || ""} // Show empty when 0 for better UX
                  onChange={handleBetChange}
                  className="text-black text-lg py-4"
                  min="0"
                  max={balance}
                  disabled={isProcessing}
                  placeholder="Enter bet amount"
                />
                <Button 
                  onClick={() => setBetAmount(balance)}
                  variant="secondary"
                  className="py-4"
                  disabled={isProcessing}
                >
                  Max
                </Button>
              </div>
              {betAmount <= 0 && (
                <p className="text-red-400 text-sm mt-1">Please enter a bet amount</p>
              )}
            </div>
            
            {/* Color Selection */}
            <div className="mb-8">
              <label className="block mb-4 text-lg">Select Color</label>
              <div className="flex justify-center gap-6">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`w-20 h-20 rounded-full transition-all duration-300 flex items-center justify-center ${
                      selectedColor === color ? 'ring-4 ring-white scale-110' : 'hover:scale-105'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => !isProcessing && setSelectedColor(color)}
                    disabled={isProcessing}
                  >
                    {selectedColor === color && (
                      <span className="text-white font-bold text-lg bg-black/50 px-3 py-1 rounded-full">
                        {colorMultipliers[color]}×
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {!selectedColor && (
                <p className="text-red-400 text-sm mt-2 text-center">Please select a color</p>
              )}
            </div>
            
            {/* Predict Button */}
            <Button 
              onClick={handlePlaceBet}
              disabled={!selectedColor || betAmount <= 0 || isProcessing}
              className={`w-full py-6 text-xl font-bold ${
                isProcessing ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isProcessing ? "Predicting..." : "Predict"}
            </Button>
          </>
        ) : (
          <>
            {/* Result Display */}
            <div className="mb-8 text-center">
              <div className={`text-2xl font-bold mb-6 ${
                result.includes("won") ? 'text-green-400' : 'text-red-400'
              }`}>
                {result}
              </div>
              
              <div className="flex justify-center gap-8 mb-6">
                <div>
                  <div className="text-lg mb-2">Your Choice</div>
                  <div 
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedColor || 'gray' }}
                  >
                    {selectedColor?.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-lg mb-2">Predicted</div>
                  <div 
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: predictedColor }}
                  >
                    {predictedColor.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={resetGame}
                className="w-full py-6 text-xl font-bold bg-blue-600 hover:bg-blue-700"
              >
                Play Again
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* Game History */}
      {gameHistory.length > 0 && (
        <div className="mt-8 w-full max-w-md bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <h2 className="text-xl font-bold mb-3">Game History</h2>
          <div className="max-h-40 overflow-y-auto">
            {gameHistory.slice().reverse().map((item, index) => (
              <div key={index} className="py-2 border-b border-white/10">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}