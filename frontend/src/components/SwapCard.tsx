import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const SwapCard = () => {
  const [fromToken, setFromToken] = useState('mUSDC');
  const [toToken, setToToken] = useState('mEURC');
  const [amount, setAmount] = useState('');

  const handleSwitch = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const expectedOutput = amount ? (parseFloat(amount) * 0.918).toFixed(4) : '0.00';

  return (
    <div className="glass-panel p-8 rounded-3xl w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-white">Swap</h2>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>Slippage 0.5%</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* From */}
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>From</span>
            <span>Balance: 1,000.00</span>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number" placeholder="0.00" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-2xl font-bold text-white w-full focus:outline-none"
            />
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <span className="font-bold text-sm text-white">{fromToken}</span>
            </div>
          </div>
        </div>

        {/* Switch */}
        <div className="relative h-4 flex justify-center items-center">
          <button onClick={handleSwitch} className="absolute z-10 bg-[#0a0c14] border border-white/10 p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* To */}
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>To (Estimated)</span>
            <span>Balance: 500.00</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-white w-full">{expectedOutput}</div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
              <span className="font-bold text-sm text-white">{toToken}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex justify-between text-sm text-white/40">
          <span>Minimum Received</span>
          <span className="text-white/60">{(parseFloat(expectedOutput) * 0.995).toFixed(4)} {toToken}</span>
        </div>
        <div className="flex justify-between text-sm text-white/40">
          <span>Price Impact</span>
          <span className="text-blue-400">{"< 0.01%"}</span>
        </div>
        <button className="btn-primary w-full mt-4">
          Swap
        </button>
      </div>
    </div>
  );
};
