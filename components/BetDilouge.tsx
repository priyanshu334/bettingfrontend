// File: /components/match-card/BetDialog.tsx
import React, { useState } from "react";

interface BetDialogProps {
  title: string;
  currentStake: string;
  oddsValue: string;
  onClose: () => void;
  onPlaceBet: (amount: string) => void;
  isProcessing: boolean;
}

const BetDialog: React.FC<BetDialogProps> = ({ 
  title, 
  currentStake, 
  oddsValue, 
  onClose, 
  onPlaceBet, 
  isProcessing 
}) => {
  const [amount, setAmount] = useState(currentStake);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleQuickAmountAdd = (value: number) => {
    setAmount(prev => {
      const currentAmount = parseInt(prev) || 0;
      return (currentAmount + value).toString();
    });
  };

  const handleClear = () => {
    setAmount("0");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center text-black justify-center z-50">
      <div className="w-full max-w-md rounded overflow-hidden">
        <div className="bg-orange-700 text-white p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Place Bet</h2>
          <button 
            onClick={onClose} 
            className="text-white text-3xl"
            disabled={isProcessing}
          >
            &times;
          </button>
        </div>
        
        <div className="bg-pink-200 p-4">
          <div className="flex justify-between mb-4">
            <h3 className="text-xl">{title}</h3>
            <div className="text-xl">Profit: 0</div>
          </div>
          
          <div className="flex justify-between mb-4">
            <div className="w-1/2 pr-2">
              <div className="text-xl mb-2">Odds</div>
              <input 
                type="text" 
                value={oddsValue}
                readOnly
                className="w-full p-2 border border-gray-300 rounded bg-white"
              />
            </div>
            <div className="w-1/2 pl-2">
              <div className="text-xl mb-2">Amount</div>
              <input 
                type="text" 
                value={amount}
                onChange={handleAmountChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-4">
            {[1000, 2000, 5000, 10000].map((val) => (
              <button 
                key={val}
                onClick={() => handleQuickAmountAdd(val)}
                className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded text-lg disabled:opacity-50"
                disabled={isProcessing}
              >
                +{val / 1000}k
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-4 gap-1 mb-4">
            {[20000, 25000, 50000, 75000].map((val) => (
              <button 
                key={val}
                onClick={() => handleQuickAmountAdd(val)}
                className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded text-lg disabled:opacity-50"
                disabled={isProcessing}
              >
                +{val / 1000}k
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-1 mb-6">
            {[90000, 95000].map((val) => (
              <button 
                key={val}
                onClick={() => handleQuickAmountAdd(val)}
                className="bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded text-lg disabled:opacity-50"
                disabled={isProcessing}
              >
                +{val / 1000}k
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-1 mb-4">
            <button 
              onClick={handleClear}
              className="bg-blue-500 text-white py-3 text-xl font-bold disabled:opacity-50"
              disabled={isProcessing}
            >
              Clear
            </button>
            <button 
              onClick={() => onPlaceBet(amount)}
              className="bg-green-700 hover:bg-green-800 text-white py-3 text-xl font-bold disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Place Bet'}
            </button>
          </div>
          
          <div className="mb-2 text-lg">Range: 100 to 2L</div>
          <div className="w-full h-4 bg-pink-100 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default BetDialog;