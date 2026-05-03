import React, { useState } from 'react';
import { ArrowDown, Settings, Info, ChevronDown } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="premium-card p-6 md:p-8 space-y-6 relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg tracking-tight">Swap</h3>
        <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
          <Settings size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {/* Input From */}
        <div className="input-group">
          <div className="flex justify-between mb-3 text-xs font-bold uppercase tracking-widest text-white/30">
            <span>Pay</span>
            <span>Balance: 2,450.00</span>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              placeholder="0.0" 
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shrink-0">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold">€</div>
              <span className="font-bold text-sm">mEURC</span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* Swap Divider */}
        <div className="flex justify-center -my-4 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-[#0a0b14] border border-white/10 flex items-center justify-center text-blue-500 shadow-2xl">
            <ArrowDown size={20} />
          </div>
        </div>

        {/* Input To */}
        <div className="input-group">
          <div className="flex justify-between mb-3 text-xs font-bold uppercase tracking-widest text-white/30">
            <span>Receive</span>
            <span>Balance: 1,200.00</span>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              placeholder="0.0" 
              value={toAmount}
              readOnly
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white/40"
            />
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all shrink-0">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px] font-bold">$</div>
              <span className="font-bold text-sm">mUSDC</span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/30 font-medium flex items-center gap-1.5">Exchange Rate <Info size={12} /></span>
          <span className="font-bold">1 mEURC ≈ 1.084 mUSDC</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/30 font-medium flex items-center gap-1.5">Slippage Tolerance <Info size={12} /></span>
          <span className="font-bold text-blue-400">0.5%</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button className="btn-premium px-8 py-3 text-[10px] uppercase tracking-[0.2em]">
          SWAP
        </button>
      </div>

      <div className="text-center">
        <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">
          Powered by Arc Settlement Network
        </p>
      </div>
    </div>
  );
};
