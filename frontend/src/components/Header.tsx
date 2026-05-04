import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { WalletModal } from './WalletModal';
import { NetworkInfoModal } from './NetworkInfoModal';
import { ARC_TESTNET_CONFIG } from '../config/contracts';
import { Copy, LogOut, Check, ChevronDown, ReceiptText } from 'lucide-react';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export const Header = ({ activeTab = 'swap', setActiveTab }: HeaderProps) => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isAccountBoxOpen, setIsAccountBoxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-switch to Arc Testnet if connected to wrong network
  useEffect(() => {
    if (isConnected && chainId !== ARC_TESTNET_CONFIG.chainId) {
      const timer = setTimeout(() => {
        switchChain({ chainId: ARC_TESTNET_CONFIG.chainId });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, chainId, switchChain]);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      disconnect();
      setIsAccountBoxOpen(false);
    }
  };

  const handleNetworkConfirm = () => {
    setIsNetworkModalOpen(false);
    setIsWalletModalOpen(true);
  };

  return (
    <>
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.05] relative z-[90]">
        <div className="flex items-center gap-12">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setActiveTab?.('swap')}
              className={`nav-link ${activeTab === 'swap' ? 'active text-white' : 'text-white/40'}`}
            >
              Swap
            </button>
            <button 
              onClick={() => setActiveTab?.('dashboard')}
              className={`nav-link ${activeTab === 'dashboard' ? 'active text-white' : 'text-white/40'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab?.('pools')}
              className={`nav-link ${activeTab === 'pools' ? 'active text-white' : 'text-white/40'}`}
            >
              Pools
            </button>
            <button 
              onClick={() => setActiveTab?.('invoices')}
              className={`nav-link ${activeTab === 'invoices' ? 'active text-white' : 'text-white/40'}`}
            >
              Invoices
            </button>
            <a href="#" className="nav-link text-white/40">Docs</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Arc Testnet</span>
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => isConnected ? setIsAccountBoxOpen(!isAccountBoxOpen) : setIsNetworkModalOpen(true)}
                className={`h-11 px-5 rounded-2xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${
                  isConnected 
                    ? "bg-white/5 text-white border-white/10 hover:bg-white/10" 
                    : "bg-white text-black border-transparent hover:bg-white/90 shadow-xl shadow-white/5"
                }`}
              >
                {isConnected ? (
                  <>
                    <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isAccountBoxOpen ? 'rotate-180' : ''}`} />
                  </>
                ) : "Connect Wallet"}
              </button>

              {isConnected && (
                <button 
                  onClick={handleLogout}
                  className="h-11 w-11 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>

            {/* Account Info Box */}
            {isAccountBoxOpen && isConnected && (
              <div className="absolute top-[calc(100%+12px)] right-0 w-44 bg-[#0a0a0b] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-top-2 duration-300 z-[100] backdrop-blur-2xl overflow-hidden">
                <div className="flex flex-col">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Connected</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono text-white/80 truncate">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      <button 
                        onClick={handleCopy}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all shrink-0"
                      >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full p-4 flex items-center gap-3 hover:bg-red-500/5 text-white/40 hover:text-red-400 transition-all text-[9px] font-bold uppercase tracking-[0.2em]"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <NetworkInfoModal 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
        onConfirm={handleNetworkConfirm}
      />
      
      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </>
  );
};
