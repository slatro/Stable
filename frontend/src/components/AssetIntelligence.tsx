import React from 'react';
import { Shield, Info, ExternalLink, Copy, Cpu, Globe } from 'lucide-react';

export const AssetIntelligence = ({ token }: { token: any }) => {
  const isAtoken = token.symbol.startsWith('a');
  
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Market Intelligence</h3>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <Shield size={10} className="text-emerald-400" />
          <span className="text-[8px] font-black text-emerald-400 uppercase">Verified Asset</span>
        </div>
      </div>

      <div className="premium-card p-5 space-y-5">
        {/* TOKEN INFO HEADER */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 p-2 flex items-center justify-center">
            <img src={token.logo || '/stable_logos/usdc.png'} alt={token.symbol} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-black text-white uppercase tracking-tight">{token.name}</span>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{token.symbol} • Stablecoin</span>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col gap-1">
             <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Market Cap</span>
             <span className="text-xs font-black text-white">$4.2B</span>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col gap-1">
             <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Total Supply</span>
             <span className="text-xs font-black text-white">12.5M</span>
          </div>
        </div>

        {/* DETAILS LIST */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-white/20 uppercase">Contract</span>
            <div className="flex items-center gap-2">
              <code className="text-white/40 font-mono text-[9px]">{token.addr.slice(0,6)}...{token.addr.slice(-4)}</code>
              <button onClick={() => navigator.clipboard.writeText(token.addr)} className="text-white/20 hover:text-white"><Copy size={12} /></button>
            </div>
          </div>
          <div className="h-px bg-white/[0.03]" />
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-white/20 uppercase">Standard</span>
            <span className="font-black text-blue-400 uppercase tracking-tighter">Arc-ERC20 Premium</span>
          </div>
          <div className="h-px bg-white/[0.03]" />
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-white/20 uppercase">Protocol</span>
            <span className="font-black text-white/60 uppercase">ArcFX Decentralized</span>
          </div>
        </div>

        {/* ACTION LINKS */}
        <div className="flex gap-2 pt-2">
           <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 border border-white/5 transition-all group">
             <Globe size={12} className="text-white/20 group-hover:text-blue-400" />
             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Website</span>
           </button>
           <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 border border-white/5 transition-all group">
             <ExternalLink size={12} className="text-white/20 group-hover:text-blue-400" />
             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest group-hover:text-white">Explorer</span>
           </button>
        </div>
      </div>

      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-3">
         <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
         <p className="text-[9px] text-white/40 leading-relaxed font-medium italic">
           {isAtoken ? "This is an Arc-Collateralized asset. All units are backed 1:1 by institutional-grade liquidity reserves on the ArcFX protocol." : "This is a native testnet asset for simulation purposes."}
         </p>
      </div>
    </div>
  );
};
