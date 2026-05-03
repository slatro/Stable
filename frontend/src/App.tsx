import React, { useState } from "react";
import { Header } from "./components/Header";
import { SwapCard } from "./components/SwapCard";
import { TradingViewChart as PriceChart } from "./components/PriceChart";
import { TransactionPanel } from "./components/TransactionPanel";
import { Logo } from "./components/Logo";
import { ActivityTicker } from "./components/ActivityTicker";
import { Zap, Edit2, ShieldCheck, Wallet } from "lucide-react";

export default function App() {
  const [slippage, setSlippage] = useState('3.00');

  return (
    <div className="min-h-screen flex flex-col selection:bg-white/10 relative">
      <div className="bg-arcs">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none">
          <path id="snake-path-1" className="arc-line" d="M -100 200 C 200 100, 400 900, 700 500 S 1200 800, 1500 200" stroke="white" strokeWidth="0.6" style={{ animationDuration: '14s' }} />
          <path id="snake-path-2" className="arc-line" d="M -200 800 C 300 900, 100 100, 500 500 S 900 100, 1200 800" stroke="white" strokeWidth="0.4" style={{ animationDuration: '18s', animationDelay: '4s' }} />
        </svg>
      </div>

      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      
      <Header />
      
      <div className="bg-white/[0.02] border-b border-white/[0.05] py-2 px-4 md:px-6 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-[12px] bg-blue-500/10 border border-blue-500/20">
              <Zap size={10} className="text-blue-400" />
              <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">v2.0 Active</span>
            </div>
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] hidden md:block">Settlement Protocol</span>
          </div>
          <div className="flex-1 overflow-hidden pointer-events-none">
            <ActivityTicker isMinimal />
          </div>
          <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.05] shrink-0">
            <img src="/assets/logo-final.png" alt="Arc" className="w-4 h-4 mix-blend-screen" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:block">Arc Ecosystem</span>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative py-4 md:py-8 px-4 md:px-6">
        <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 md:gap-8 items-stretch">
          
          <div className="flex flex-col items-center order-1 xl:order-2">
            <SwapCard slippage={slippage} setSlippage={setSlippage} />
            <div className="flex items-center gap-4 px-1 mt-8 text-[9px] font-bold text-white/20 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span>Slippage Tolerance</span>
                <span className="text-blue-400">{slippage}%</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2">
                <span>Network Fee</span>
                <span className="text-white/40">~$0.12</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 order-2 xl:order-1">
            <div className="glass-frame h-[518px] xl:h-[518px]">
              <PriceChart />
            </div>
            <div className="flex items-center gap-4 mt-2 px-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Market Live</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                24h Vol: <span className="text-white/50">$1.42M</span>
              </div>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                Liquidity: <span className="text-white/50">$840K</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1600px] mt-8 md:mt-12 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-4">
            <h2 className="text-sm md:text-lg font-bold tracking-tight">Ecosystem Activity</h2>
            <div className="h-px flex-1 bg-white/[0.05] mx-4 md:mx-8" />
            <button className="text-[9px] md:text-[10px] font-bold text-blue-400 hover:text-white transition-colors uppercase tracking-widest">Scan Explorer</button>
          </div>
          <TransactionPanel />
        </div>
      </main>

      <footer className="py-12 px-8 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <Logo />
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
