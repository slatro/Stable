import React, { useState } from 'react';
import { ArrowDown, Settings, Info, ChevronDown } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  return (
    <div className="premium-card p-6 space-y-4 relative overflow-hidden max-w-[440px]">
      {/* Subtle inner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter">SWAP</h3>
        <button className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white transition-all">
          <Settings size={18} />
        </button>
      </div>

      <div className="space-y-1 relative">
        {/* PAY Section - Synchronized Height */}
        <div className="p-4 rounded-[24px] bg-white/[0.02] border border-white/[0.05]">
          <div className="flex justify-between mb-2 px-1 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40">
            <span>Pay</span>
            <span className="text-white/80">Balance: 2,450.00</span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              placeholder="0.0" 
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="swap-input !text-xl !py-2"
            />
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-white hover:bg-blue-500/20 transition-all shrink-0">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shadow-lg">€</div>
              <span className="font-bold text-xs tracking-tight">mEURC</span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
          </div>
        </div>

        {/* Swap Divider - Centered perfectly */}
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button className="w-9 h-9 rounded-xl bg-[#081121] border border-white/[0.1] flex items-center justify-center text-blue-400 shadow-2xl hover:scale-110 transition-transform">
            <ArrowDown size={16} />
          </button>
        </div>

        {/* RECEIVE Section - Identical to Pay */}
        <div className="p-4 rounded-[24px] bg-white/[0.02] border border-white/[0.05] pt-6">
          <div className="flex justify-between mb-2 px-1 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40">
            <span>Receive</span>
            <span className="text-white/80">Balance: 1,200.00</span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              placeholder="0.0" 
              value={toAmount}
              readOnly
              className="swap-input !text-xl !py-2 opacity-70"
            />
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.05] text-white hover:bg-white/[0.08] transition-all shrink-0">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold shadow-lg">$</div>
              <span className="font-bold text-xs tracking-tight">mUSDC</span>
              <ChevronDown size={12} className="text-white/40" />
            </button>
          </div>
        </div>
      </div>

      {/* Market Info - Compact & Sharp */}
      <div className="p-4 rounded-2xl bg-blue-500/[0.02] border border-blue-500/10 space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-white/50 uppercase tracking-widest flex items-center gap-2">Rate <Info size={10} /></span>
          <span className="text-white">1 mEURC ≈ 1.084 mUSDC</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-white/50 uppercase tracking-widest flex items-center gap-2">Slippage <Settings size={10} /></span>
          <span className="text-blue-400">0.5%</span>
        </div>
      </div>

      {/* SWAP Button - Bold, Wide, and Stylish */}
      <div className="mt-4">
        <button className="btn-premium w-full py-4 text-[12px] uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          SWAP
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-[8px] font-extrabold text-white/10 uppercase tracking-[0.4em]">
          Powered by Arc Settlement Network
        </p>
      </div>
    </div>
  );
};
