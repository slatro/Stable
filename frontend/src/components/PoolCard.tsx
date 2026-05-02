import React, { useState } from 'react';

export const PoolCard = () => {
  const [tab, setTab] = useState('add');

  return (
    <div className="glass-panel p-8 rounded-3xl w-full max-w-md mx-auto h-fit">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-white">Pool</h2>
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setTab('add')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'add' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            Add
          </button>
          <button 
            onClick={() => setTab('remove')} 
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === 'remove' ? 'bg-white/10 text-white' : 'text-white/40'}`}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Reserve mUSDC</span>
            <span className="text-lg font-bold text-white">10,000.00</span>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Reserve mEURC</span>
            <span className="text-lg font-bold text-white">9,200.00</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-white/40">Your Share</span>
            <span className="text-white">0.00%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-white/40">1 mUSDC</span>
            <span className="text-white">0.92 mEURC</span>
          </div>
        </div>

        {tab === 'add' ? (
          <div className="space-y-4">
            <input type="number" placeholder="mUSDC Amount" className="input-field w-full text-sm" />
            <input type="number" placeholder="mEURC Amount" className="input-field w-full text-sm" />
            <button className="btn-secondary w-full text-sm py-4 mt-2">Add Liquidity</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">Amount to remove</span>
              <span className="text-xs text-blue-400">Max</span>
            </div>
            <input type="range" className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
            <button className="btn-secondary w-full text-sm py-4 mt-2 text-red-400 border-red-400/20 hover:bg-red-400/5">Remove Liquidity</button>
          </div>
        )}
      </div>
    </div>
  );
};
