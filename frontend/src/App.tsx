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
import { SocialWalletModals } from './components/SocialWalletModals';
import { Twitter, Github, BookOpen, Search } from 'lucide-react';

const XIcon = ({ size = 12, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.045 4.126H5.078z" />
  </svg>
);

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
            <SocialWalletModals />
            {/* ATMOSPHERIC BACKGROUND HANDLED BY CSS */}
            <div className="bg-orbs" />

            <div className={`flex flex-col min-h-screen relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
              <Header activeTab={activeTab} setActiveTab={setActiveTab} />
              <div>
                <ActivityTicker />
              </div>

              <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-7 pb-10">
                  {renderContent()}
                  
                  <div className={activeTab === 'swap' ? 'mt-12 space-y-12 animate-in fade-in duration-700 block' : 'hidden'}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                       <LimitOrders />
                       <TransactionHistory />
                    </div>
                  </div>
                </div>
              </main>

              <footer className="py-8 md:py-12 px-4 md:px-8 border-t border-white/[0.03] mt-auto bg-transparent">
                <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-8 md:gap-4">
                  <div className="flex justify-center md:justify-start">
                    <Logo size={14} />
                  </div>
                  
                  <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
                     <a href="https://x.com/slatro_eth" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors group">
                       <XIcon size={12} className="text-white group-hover:scale-110 transition-transform" />
                       X
                     </a>
                     <div className="hidden md:block w-px h-3 bg-white/10" />
                     <a href="https://github.com/slatro" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors group">
                       <Github size={12} className="text-white group-hover:scale-110 transition-transform" />
                       Github
                     </a>
                     <div className="hidden md:block w-px h-3 bg-white/10" />
                     <a href="https://testnet.arcscan.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors group">
                       <Search size={12} className="text-blue-400 group-hover:scale-110 transition-transform" />
                       Scan
                     </a>
                     <div className="hidden md:block w-px h-3 bg-white/10" />
                     <a href="#" className="flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors group">
                       <BookOpen size={12} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                       Docs
                     </a>
                  </div>

                  <div className="flex justify-center md:justify-end text-[8px] font-black text-white/10 uppercase tracking-[0.2em] md:tracking-[0.4em]">
                    © 2026 STABLR PROTOCOL.
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </PointsProvider>
      </SoundProvider>
    </NotificationProvider>
  );
}
