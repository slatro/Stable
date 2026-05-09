import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { SwapCard } from './components/SwapCard';
import { PoolsPanel } from './components/PoolsPanel';
import { Leaderboard } from './components/Leaderboard';
import { ActivityTicker } from './components/ActivityTicker';
import { TradingChart } from './components/TradingChart';
import { NotificationProvider } from './context/NotificationContext';
import { TOKENS } from './config/contracts';
import { Logo } from './components/Logo';
import { TransactionIsland } from './components/TransactionIsland';
import { TransactionHistory } from './components/TransactionHistory';
import { LimitOrders } from './components/LimitOrders';
import { PointsProvider } from './context/PointsContext';
import { SoundProvider } from './context/SoundContext';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('arc_active_tab') || 'swap');
  const [tokenIn, setTokenIn] = useState(TOKENS.find(t => t.symbol === 'aUSDC') || TOKENS[2]);
  const [tokenOut, setTokenOut] = useState(TOKENS.find(t => t.symbol === 'aEURC') || TOKENS[3]);
  const [swapMode, setSwapMode] = useState('market');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('arc_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    // Detect Referral in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.startsWith('0x') && ref.length === 42) {
      localStorage.setItem('arc_pending_ref', ref);
      // Clean up URL without refresh
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
    setIsLoaded(true);
  }, []);

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard': return (
          <Dashboard onTradeAction={(modeOrToken: any) => {
            if (typeof modeOrToken === 'string') {
              setSwapMode(modeOrToken);
            } else if (modeOrToken?.symbol === 'astUSDC') {
              setSwapMode('stake');
            } else {
              setSwapMode('market');
            }
            setActiveTab('swap');
          }} />
        );
        case 'swap': return (
          <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-700 w-full">
            <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
              <div className="hidden lg:block flex-1 h-[600px]">
                <TradingChart tokenIn={tokenIn} tokenOut={tokenOut} />
              </div>
              <SwapCard
                tokenIn={tokenIn}
                setTokenIn={setTokenIn}
                tokenOut={tokenOut}
                setTokenOut={setTokenOut}
                initialMode={swapMode}
              />
            </div>
          </div>
        );
        case 'pools': return <PoolsPanel />;
        case 'leaderboard': return <Leaderboard />;
        default: return <Dashboard />;
      }
    } catch (err) {
      console.error("Render error:", err);
      return <div className="p-20 text-white">Error loading component. Check console.</div>;
    }
  };

  return (
    <NotificationProvider>
      <SoundProvider>
        <PointsProvider>
          <div className="min-h-screen flex flex-col font-sans relative overflow-x-hidden bg-transparent">
            <TransactionIsland />
            {/* ATMOSPHERIC BACKGROUND HANDLED BY CSS */}
            <div className="bg-orbs" />

            <div className={`flex flex-col min-h-screen relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <Header activeTab={activeTab} setActiveTab={setActiveTab} />
              <div>
                <ActivityTicker />
              </div>

              <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto px-8 pt-7 pb-10">
                  {renderContent()}
                  
                  {activeTab === 'swap' && (
                    <div className="mt-12 space-y-12 animate-in fade-in duration-700">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                         <LimitOrders />
                         <TransactionHistory />
                      </div>
                    </div>
                  )}
                </div>
              </main>

              <footer className="py-12 px-8 border-t border-white/[0.03] mt-auto bg-transparent">
                <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-12">
                    <Logo size={14} />
                    <div className="hidden md:flex items-center gap-8">
                      {['Docs', 'Github', 'Twitter', 'Status'].map(link => (
                        <a key={link} href="#" className="text-[9px] font-black text-white/20 hover:text-white uppercase tracking-[0.2em] transition-colors">{link}</a>
                      ))}
                    </div>
                  </div>
                  <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">© 2026 ARCFX PROTOCOL. ALL RIGHTS RESERVED.</div>
                </div>
              </footer>
            </div>
          </div>
        </PointsProvider>
      </SoundProvider>
    </NotificationProvider>
  );
}
