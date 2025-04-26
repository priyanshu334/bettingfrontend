// File: /components/match-card/SuccessDialog.tsx
import React from "react";

interface SuccessDialogProps {
  onClose: () => void;
  navigateToBets: () => void;
}

const SuccessDialog: React.FC<SuccessDialogProps> = ({ onClose, navigateToBets }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl font-bold text-gray-700 hover:text-red-600 transition-colors"
        >
          ×
        </button>
        
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Bet Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">Your bet has been placed successfully and can be viewed in your bet history.</p>
          
          <div className="flex gap-4">
            <button
              onClick={navigateToBets}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              See Bets
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
            >
              Continue Betting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog;