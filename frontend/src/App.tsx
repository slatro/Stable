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

export default function App() {
  const [slippage, setSlippage] = useState('3.00');
  const [activeTab, setActiveTab] = useState('swap');

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
      
      {/* Passing the required props to Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="w-full bg-white/[0.02] border-b border-white/[0.05] py-2 px-8 relative overflow-hidden mt-20">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-12">
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-[12px] bg-blue-500/10 border border-blue-500/20">
              <Zap size={10} className="text-blue-400" />
              <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">v2.0 Active</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden pointer-events-none">
            <ActivityTicker isMinimal />
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center relative pt-8 pb-8 px-4 md:px-6">
        {activeTab === 'swap' ? (
          <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-[1fr_460px] gap-6 md:gap-12 items-stretch animate-in fade-in duration-700">
            <div className="flex flex-col gap-4">
              <div className="glass-frame h-[506px]">
                <PriceChart />
              </div>
              <TransactionPanel />
            </div>
            <div className="flex flex-col items-center gap-4">
              <SwapCard slippage={slippage} setSlippage={setSlippage} />
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
      </main>

      <footer className="py-12 px-8 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <Logo />
        </div>
      </footer>
    </div>
  );
}
