import React from 'react';
import { TOKENS } from '../config/contracts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { usePrices } from '../context/PriceContext';

export const ActivityTicker = () => {
  const priceContext = usePrices();
  const prices = priceContext?.prices || {};
  
  // Only show synthetic a-Assets in the ticker
  const tickerItems = TOKENS.filter(t => t.symbol.startsWith('a') && t.symbol !== 'astUSDC').map((t) => {
    const pData = prices[t.symbol] || { price: 0, change24h: '+0.00%' };
    return {
      symbol: t.symbol,
      price: pData.price > 1 ? pData.price.toFixed(4) : pData.price.toFixed(6),
      change: pData.change24h,
      isUp: !pData.change24h.startsWith('-')
    };
  }).filter(item => parseFloat(item.price) > 0);

  // Duplicate for seamless loop
  const displayItems = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="w-full bg-white/[0.02] border-y border-white/[0.05] backdrop-blur-md flex items-center relative overflow-hidden h-10">
      {/* LEFT STATUS - FEEDS */}
      <div className="h-full flex items-center px-6 bg-black/40 border-r border-white/10 z-20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white uppercase tracking-[0.2em] leading-none mb-0.5">Live Feed</span>
            <span className="text-[7px] font-bold text-blue-400/60 uppercase tracking-tighter leading-none">Realtime</span>
          </div>
        </div>
      </div>

      {/* Ticker Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="flex whitespace-nowrap animate-ticker py-2.5">
          {displayItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-10 border-r border-white/5 last:border-r-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.symbol}</span>
                <span className="text-[10px] font-mono font-black text-white tabular-nums">${item.price}</span>
              </div>
              <div className={`flex items-center gap-1 ${item.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {item.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span className="text-[9px] font-black tabular-nums">{item.change}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Status - FIXED ON THE RIGHT */}
      <div className="h-full flex items-center px-6 bg-white/[0.08] border-l border-white/10 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white uppercase tracking-[0.2em] leading-none mb-0.5">Arc Testnet</span>
            <span className="text-[7px] font-bold text-emerald-400/60 uppercase tracking-tighter leading-none">Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};
