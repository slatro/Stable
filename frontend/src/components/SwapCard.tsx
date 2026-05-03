import React, { useState } from 'react';
import { ArrowDown, Settings, Info, ChevronDown } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="premium-card p-8 space-y-6 relative overflow-hidden">
      {/* Decorative inner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Swap</h3>
        <button className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white transition-all">
          <Settings size={20} />
        </button>
      </div>

      <div className="space-y-2 relative">
        {/* Input From */}
        <div className="p-5 rounded-[28px] bg-white/[0.02] border border-white/[0.05]">
          <div className="flex justify-between mb-4 px-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40">
            <span>Pay</span>
            <span className="text-white/80">Balance: 2,450.00</span>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              placeholder="0.0" 
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="swap-input"
            />
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-white hover:bg-blue-500/20 transition-all shrink-0">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold shadow-lg">€</div>
              <span className="font-bold text-sm tracking-tight">mEURC</span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* Swap Divider */}
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button className="w-11 h-11 rounded-2xl bg-[#0a1931] border border-white/[0.1] flex items-center justify-center text-blue-400 shadow-2xl hover:scale-110 transition-transform">
            <ArrowDown size={20} />
          </button>
        </div>

        {/* Input To */}
        <div className="p-5 rounded-[28px] bg-white/[0.02] border border-white/[0.05] pt-10">
          <div className="flex justify-between mb-4 px-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/40">
            <span>Receive</span>
            <span className="text-white/80">Balance: 1,200.00</span>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              placeholder="0.0" 
              value={toAmount}
              readOnly
              className="swap-input opacity-70"
            />
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.05] text-white hover:bg-white/[0.08] transition-all shrink-0">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[11px] font-bold shadow-lg">$</div>
              <span className="font-bold text-sm tracking-tight">mUSDC</span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 p-5 rounded-[24px] bg-blue-500/[0.02] border border-blue-500/10 space-y-3">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-white/50 uppercase tracking-widest flex items-center gap-2">Rate <Info size={12} /></span>
          <span className="text-white">1 mEURC ≈ 1.084 mUSDC</span>
        </div>
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-white/50 uppercase tracking-widest flex items-center gap-2">Slippage <Settings size={12} /></span>
          <span className="text-blue-400">0.5%</span>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button className="btn-premium px-20 py-4.5 text-[12px] uppercase tracking-[0.25em]">
          SWAP
        </button>
      </div>

      <div className="text-center mt-6">
        <p className="text-[9px] font-extrabold text-white/10 uppercase tracking-[0.3em]">
          Powered by Arc Settlement Network
        </p>
      </div>
    </div>
  );
};
