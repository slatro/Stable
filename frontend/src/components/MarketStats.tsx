import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, Activity, Info, ShieldCheck } from 'lucide-react';

import { usePrices } from '../context/PriceContext';

export const MarketStats = () => {
  const { prices } = usePrices();
  const eurcData = prices['EURC'] || { price: 1.0842, change24h: '+0.05%' };

  return (
    <div className="w-full flex items-center justify-between px-2 py-1 bg-transparent">
      {/* PRICE */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
          <Activity size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Price</span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-black text-emerald-400 tracking-tight">${eurcData.price.toFixed(4)}</span>
            <span className={`text-[8px] font-black italic ${eurcData.change24h.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{eurcData.change24h}</span>
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-white/20" />

      {/* VOLUME */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
          <BarChart3 size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">24h Volume</span>
          <span className="text-[13px] font-black text-white/80 tracking-tight">$4.8M</span>
        </div>
      </div>

      <div className="h-8 w-px bg-white/20" />

      {/* LIQUIDITY */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <TrendingUp size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Liquidity</span>
          <span className="text-[13px] font-black text-white/80 tracking-tight">$42.2M</span>
        </div>
      </div>

      <div className="h-8 w-px bg-white/20" />

      {/* NETWORK STATUS */}
      <div className="flex items-center gap-3 pr-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <ShieldCheck size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Network</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
