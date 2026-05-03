import React from "react";
import { Header } from "./components/Header";
import { LogoIcon } from "./components/LogoIcon";
import { SwapCard } from "./components/SwapCard";
import { TransactionPanel } from "./components/TransactionPanel";
import { TrendingUp, ShieldCheck, Globe, Zap, ArrowUpRight } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30">
      <div className="bg-glow" />
      <Header />
      
      {/* Compact Hero / Top Info Bar */}
      <div className="bg-white/[0.02] border-b border-white/[0.05] py-4 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Zap size={10} className="text-blue-400" />
              <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">v2.0 Active</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <p className="text-[11px] text-white/30 font-medium hidden md:block">
              Institutional-grade stablecoin swaps on Arc Network.
            </p>
          </div>
          
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-8 animate-infinite-scroll whitespace-nowrap">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
                  <span className="text-blue-500/50">#LIVE</span>
                  <span>0x71...3912 swapped 500 mEURC for 542.4 mUSDC</span>
                  <span className="text-white/5">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative py-8 px-6">
        {/* Decorative Background Beams */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[120%] bg-blue-500/5 blur-[120px] rotate-12" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[120%] bg-purple-500/5 blur-[120px] -rotate-12" />
        </div>

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-8 items-start">
          
          {/* Left Panel: Market Stats */}
          <aside className="hidden lg:flex flex-col gap-4 animate-fade-in-left">
            <div className="premium-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-white/40 mb-1">
                <TrendingUp size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Market Overview</span>
              </div>
              <div className="space-y-3">
                {[
                  { asset: "mUSDC", price: "$1.00", change: "+0.01%", color: "text-emerald-400" },
                  { asset: "mEURC", price: "$1.08", change: "-0.04%", color: "text-rose-400" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[10px] font-bold text-white/60">{item.asset}</span>
                    <div className="flex items-end justify-between">
                      <span className="text-base font-bold font-mono">{item.price}</span>
                      <span className={`text-[9px] font-bold ${item.color}`}>{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card p-4">
              <div className="flex items-center gap-3 text-white/60 mb-4">
                <LogoIcon size={24} glow={false} />
                <span className="text-[12px] font-bold uppercase tracking-widest text-white/80">Arc Ecosystem</span>
              </div>
              <p className="text-[10px] leading-relaxed text-white/30 mb-3">
                Sub-second finality on the Arc settlement layer.
              </p>
              <a href="#" className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">
                Arcscan <ArrowUpRight size={10} />
              </a>
            </div>
          </aside>

          {/* Center: Main Swap Card - Pushed Up */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[460px] animate-fade-in">
              <SwapCard />
            </div>
            
            <div className="mt-8 flex gap-4">
              {[
                { label: "Slippage", value: "0.1%" },
                { label: "Fee", value: "0.03%" },
                { label: "Security", value: "Verified" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/20">{item.label}</span>
                  <span className="text-[10px] font-bold text-white/60">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Protocol Health */}
          <aside className="hidden lg:flex flex-col gap-4 animate-fade-in-right">
            <div className="premium-card p-4 space-y-4">
              <div className="flex items-center gap-2 text-white/40 mb-1">
                <ShieldCheck size={12} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Security & TVL</span>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/[0.05] text-center">
                <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Total TVL</span>
                <span className="text-xl font-extrabold font-mono text-white">$12.4M</span>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/30">Audit Status</span>
                  <span className="text-emerald-400 font-bold uppercase">Simulated</span>
                </div>
              </div>
            </div>

            <div className="premium-card p-4 bg-gradient-to-br from-white/[0.03] to-transparent">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-3">Live Feed</span>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-start gap-2 text-[9px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                    <div>
                      <p className="text-white/50 font-medium">New liquidity added.</p>
                      <span className="text-white/20">4m ago</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>

        {/* Transaction History Section */}
        <div className="w-full max-w-7xl mt-16">
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold tracking-tight">Ecosystem Activity</h2>
            </div>
            <div className="h-px flex-1 bg-white/[0.05] mx-8" />
            <button className="text-[10px] font-bold text-blue-400 hover:text-white transition-colors uppercase tracking-widest">
              View All
            </button>
          </div>
          <TransactionPanel />
        </div>
      </main>

      <footer className="py-12 px-8 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">ArcFX Protocol</span>
            </div>
            <p className="text-[10px] text-white/20 font-medium max-w-xs uppercase tracking-wider">
              Institutional stablecoin settlement.
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
