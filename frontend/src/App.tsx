// Vercel Rebuild Trigger - ArcFX Deployment Sync - TS: 2026-05-04 05:18
import React, { useState } from "react";
import { Header } from "./components/Header";
import { SwapCard } from "./components/SwapCard";
import { TradingViewChart as PriceChart } from "./components/PriceChart";
import { TransactionPanel } from "./components/TransactionPanel";
import { Logo } from "./components/Logo";
import { ActivityTicker } from "./components/ActivityTicker";
import { InvoiceForm } from "./components/InvoiceForm";
import { PoolsPanel } from "./components/PoolsPanel";
import { Dashboard } from "./components/Dashboard";
import { Zap } from "lucide-react";
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';

const queryClient = new QueryClient();

export default function App() {
  const [slippage, setSlippage] = useState('3.00');
  const [activeTab, setActiveTab] = useState('swap');

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
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
      
      {/* FIXED TOP NAVIGATION AREA */}
      <div className="fixed top-0 left-0 w-full z-50 flex flex-col">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* ACTIVITY TICKER BAR */}
        <div className="bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/[0.05] py-2 px-6 relative overflow-hidden">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
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
              <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 hidden sm:block">Arc Ecosystem</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT WITH TOP SPACING FOR FIXED HEADER/TICKER */}
      <main className="flex-1 flex flex-col items-center relative pt-[140px] pb-8 px-4 md:px-6">
        {activeTab === 'swap' ? (
          <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 md:gap-8 items-stretch animate-in fade-in duration-700">
            
            <div className="flex flex-col items-center gap-4 order-1 xl:order-2">
              <SwapCard slippage={slippage} setSlippage={setSlippage} />
              <div className="h-[2px] w-full" /> {/* Spacer */}
            </div>

            <div className="flex flex-col gap-4 order-2 xl:order-1">
              <div className="glass-frame h-[506px] xl:h-[506px] my-0">
                <PriceChart />
              </div>
              <div className="flex items-center gap-4 mt-1 px-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest">Market Live</span>
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
        ) : activeTab === 'invoices' ? (
          <InvoiceForm />
        ) : activeTab === 'pools' ? (
          <PoolsPanel />
        ) : activeTab === 'dashboard' ? (
          <Dashboard />
        ) : (
          <div className="flex items-center justify-center h-64 text-white/20 uppercase tracking-[0.5em] font-black italic">
            Coming Soon
          </div>
        )}

        {activeTab === 'swap' && (
          <div className="w-full max-w-[1600px] mt-8 md:mt-12 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-4">
              <h2 className="text-sm md:text-lg font-bold tracking-tight">Platform Activity</h2>
              <div className="h-px flex-1 bg-white/[0.05] mx-4 md:mx-8" />
              <button className="text-[9px] md:text-[10px] font-bold text-blue-400 hover:text-white transition-colors uppercase tracking-widest">Scan Explorer</button>
            </div>
            <TransactionPanel />
          </div>
        )}
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
    </QueryClientProvider>
    </WagmiProvider>
  );
}
