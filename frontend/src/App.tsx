import React from "react";
import { Header } from "./components/Header";
import { SwapCard } from "./components/SwapCard";
import { TradingViewChart as PriceChart } from "./components/PriceChart";
import { TransactionPanel } from "./components/TransactionPanel";
import { Zap, Info, Settings, ShieldCheck } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30 relative">
      {/* Architectural Background Patterns & Lines */}
      <div className="bg-patterns" />
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Large Abstract SVG Arch based on requested image */}
        <svg className="absolute w-[120%] h-[120%] -top-[10%] -left-[10%] opacity-20" viewBox="0 0 1000 1000" fill="none">
          <path 
            d="M50 800 Q 300 200, 950 500" 
            stroke="white" 
            strokeWidth="1" 
            strokeOpacity="0.4" 
          />
          <path 
            d="M100 900 Q 400 300, 900 600" 
            stroke="white" 
            strokeWidth="0.5" 
            strokeOpacity="0.2" 
          />
          <line x1="240" y1="0" x2="240" y2="1000" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />
          <line x1="0" y1="200" x2="1000" y2="200" stroke="white" strokeWidth="0.5" strokeOpacity="0.1" />
        </svg>
      </div>
      
      <Header />
      
      {/* Restructured Top Info Bar with Restored Ticker */}
      <div className="bg-white/[0.02] border-b border-white/[0.05] py-2.5 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
          
          {/* Left: Protocol Status */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap size={10} className="text-blue-400" />
              <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">v2.0 Active</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <p className="text-[10px] text-white/40 font-medium hidden md:block uppercase tracking-wider">
              Settlement Protocol
            </p>
          </div>

          {/* Middle: Restored Live Swap Ticker (Centered & Elegant) */}
          <div className="flex-1 max-w-2xl overflow-hidden pointer-events-none">
            <div className="flex items-center gap-12 animate-infinite-scroll whitespace-nowrap">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                  <span className="text-blue-400">#SWAP</span>
                  <span className="text-white/80">0x71...3912 swapped 1.2k mEURC → 1.3k mUSDC</span>
                  <span className="text-white/20">•</span>
                  <span className="text-blue-400">#SWAP</span>
                  <span className="text-white/80">0xA4...9281 swapped 500 mUSDC → 462 mEURC</span>
                  <span className="text-white/20">•</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Arc Ecosystem Section */}
          <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.05] shrink-0">
            <img 
              src="/assets/logo-final.png" 
              alt="Arc" 
              className="w-4 h-4 mix-blend-screen" 
              style={{ 
                filter: 'contrast(1.6) brightness(0.85)',
                maskImage: 'radial-gradient(circle, black 60%, transparent 95%)',
                WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 95%)'
              }}
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Arc Ecosystem</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative py-8 px-6">
        {/* Professional 2-Column Layout - STRETCHED for Symmetry */}
        <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-8 items-stretch">
          
          {/* Left Column: Chart + Bottom Bar */}
          <div className="flex flex-col gap-4">
            <PriceChart />
            <div className="flex items-center gap-4 px-6 py-4 premium-card bg-blue-500/[0.03] h-[52px]">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Market Status: Highly Liquid</span>
              <div className="flex-1" />
              <div className="flex gap-6">
                 <span className="text-[10px] font-mono text-white/30 tracking-tight uppercase">Vol (24h): $12.4m</span>
                 <span className="text-[10px] font-mono text-white/30 tracking-tight uppercase">Slippage: 0.02%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Swap + Bottom Bar (Compact & Aligned) */}
          <div className="flex flex-col gap-4 items-center xl:items-start">
            <SwapCard />
            <div className="flex items-center w-full max-w-[440px] premium-card bg-blue-500/[0.03] h-[52px] divide-x divide-white/10">
              <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[7px] font-extrabold text-white/20 uppercase tracking-[0.2em]">Slippage</span>
                <span className="text-[10px] font-bold text-blue-400">0.5%</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[7px] font-extrabold text-white/20 uppercase tracking-[0.2em]">Fee</span>
                <span className="text-[10px] font-bold text-white/70">0.03%</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                <span className="text-[7px] font-extrabold text-white/20 uppercase tracking-[0.2em]">Stability</span>
                <span className="text-[10px] font-bold text-emerald-500/80">99.9%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Transaction History Section */}
        <div className="w-full max-w-[1600px] mt-12">
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight">Ecosystem Activity</h2>
            </div>
            <div className="h-px flex-1 bg-white/[0.05] mx-8" />
            <button className="text-[10px] font-bold text-blue-400 hover:text-white transition-colors uppercase tracking-widest">
              Scan Explorer
            </button>
          </div>
          <TransactionPanel />
        </div>
      </main>

      <footer className="py-12 px-8 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/logo-final.png" 
                alt="ArcFX" 
                className="w-6 h-6 mix-blend-screen" 
                style={{ 
                  filter: 'contrast(1.6) brightness(0.85)',
                  maskImage: 'radial-gradient(circle, black 60%, transparent 95%)',
                  WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 95%)'
                }}
              />
              <span className="text-sm font-black text-white uppercase tracking-tighter">ARCFX</span>
            </div>
            <p className="text-[10px] text-white/30 font-bold max-w-xs uppercase tracking-[0.2em]">
              Institutional Stablecoin Settlement Network
            </p>
          </div>
          <div className="flex gap-12 text-[10px] font-bold uppercase tracking-widest text-white/20">
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Arcscan</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
