import React, { useState } from "react";
import { Header } from "./components/Header";
import { SwapCard } from "./components/SwapCard";
import { TradingViewChart as PriceChart } from "./components/PriceChart";
import { TransactionPanel } from "./components/TransactionPanel";
import { Logo } from "./components/Logo";
import { ActivityTicker } from "./components/ActivityTicker";
import { Zap, Info, Settings, ShieldCheck } from "lucide-react";

export default function App() {
  const [slippage, setSlippage] = useState('3.00');

  return (
    <div className="min-h-screen flex flex-col selection:bg-white/10 relative">
      {/* Dynamic Background Energy Layer - Snake Paths */}
      <div className="bg-arcs">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none">
          {/* Master Snake 1 */}
          <path id="snake-path-1" className="arc-line" d="M -100 200 C 200 100, 400 900, 700 500 S 1200 800, 1500 200" stroke="white" strokeWidth="0.6" style={{ animationDuration: '14s', animationDelay: '0s' }} />
          <circle r="2.5" className="snake-head">
            <animateMotion dur="14s" repeatCount="indefinite">
              <mpath href="#snake-path-1" />
            </animateMotion>
          </circle>

          {/* Master Snake 2 */}
          <path id="snake-path-2" className="arc-line" d="M -200 800 C 300 900, 100 100, 500 500 S 900 100, 1200 800" stroke="white" strokeWidth="0.4" style={{ animationDuration: '18s', animationDelay: '4s' }} />
          <circle r="2" className="snake-head" style={{ opacity: 0.6 }}>
            <animateMotion dur="18s" begin="4s" repeatCount="indefinite">
              <mpath href="#snake-path-2" />
            </animateMotion>
          </circle>

          {/* Master Snake 3 */}
          <path id="snake-path-3" className="arc-line" d="M 500 -100 C 200 400, 800 600, 500 1100" stroke="white" strokeWidth="0.5" style={{ animationDuration: '20s', animationDelay: '8s' }} />
          <circle r="2.2" className="snake-head">
            <animateMotion dur="20s" begin="8s" repeatCount="indefinite">
              <mpath href="#snake-path-3" />
            </animateMotion>
          </circle>
        </svg>
      </div>

      {/* Frosted Glass Background Elements */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-1 opacity-5 left-[20%] top-[40%]" />
      </div>
      
      <Header />
      
      {/* Composite Live Terminal Bar */}
      <div className="bg-white/[0.02] border-b border-white/[0.05] py-2 px-4 md:px-6 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 md:gap-8">
          
          {/* Left: Protocol Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-[12px] bg-blue-500/10 border border-blue-500/20">
              <Zap size={10} className="text-blue-400" />
              <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">v2.0 Active</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] hidden md:block">
              Settlement Protocol
            </span>
          </div>

          {/* Middle: Integrated Ticker (Takes remaining space) */}
          <div className="flex-1 overflow-hidden pointer-events-none">
            <ActivityTicker isMinimal />
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:block">Arc Ecosystem</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative py-4 md:py-8 px-4 md:px-6">
        {/* Professional 2-Column Layout - REORDERED FOR MOBILE (SWAP FIRST) */}
        <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 md:gap-8 items-stretch">
          
          {/* Swap Column (Order-1 on mobile, Order-2 on desktop) */}
          <div className="flex flex-col items-center order-1 xl:order-2">
            <SwapCard slippage={slippage} setSlippage={setSlippage} />
            {/* Restored Swap Detail Bar */}
            <div className="w-full mt-4 flex flex-col gap-2 px-6">
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-white/30">
                <span>Slippage Tolerance</span>
                <span className="text-blue-400">{slippage}%</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-white/30">
                <span>Network Fee</span>
                <span className="text-white/60">~$0.12</span>
              </div>
            </div>
          </div>

          {/* Chart Column (Order-2 on mobile, Order-1 on desktop) */}
          <div className="flex flex-col gap-4 order-2 xl:order-1">
            <div className="glass-frame h-[480px] xl:h-[480px]">
              <PriceChart />
            </div>
            {/* Restored Chart Detail Bar */}
            <div className="flex items-center gap-4 mt-2 px-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Market Live</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                24h Vol: <span className="text-white/60">$1.42M</span>
              </div>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                Liquidity: <span className="text-white/60">$840K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section - COMPRESSED & NO SCROLL */}
        <div className="w-full max-w-[1600px] mt-8 md:mt-12 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm md:text-lg font-bold tracking-tight">Ecosystem Activity</h2>
            </div>
            <div className="h-px flex-1 bg-white/[0.05] mx-4 md:mx-8" />
            <button className="text-[9px] md:text-[10px] font-bold text-blue-400 hover:text-white transition-colors uppercase tracking-widest">
              Scan Explorer
            </button>
          </div>
          <div className="no-scrollbar overflow-hidden">
            <TransactionPanel />
          </div>
        </div>
      </main>

      <footer className="py-12 px-8 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-4 items-start">
              <Logo />
              <p className="text-[10px] text-white/30 font-bold max-w-xs uppercase tracking-[0.2em] mt-1 text-left">
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
