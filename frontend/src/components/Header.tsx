import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { WalletModal } from './WalletModal';
import { ARC_TESTNET_CONFIG } from '../config/contracts';

export const Header = () => {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-switch to Arc Testnet if connected to wrong network
  useEffect(() => {
    if (isConnected && chainId !== ARC_TESTNET_CONFIG.chainId) {
      switchChain({ chainId: ARC_TESTNET_CONFIG.chainId });
    }
  }, [isConnected, chainId, switchChain]);

  return (
    <>
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.05]">
        <div className="flex items-center gap-12">
          <Logo />
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="nav-link active">Swap</a>
            <a href="#" className="nav-link">Pools</a>
            <a href="#" className="nav-link">Stake</a>
            <a href="#" className="nav-link">Docs</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest">Arc Testnet</span>
          </div>
          
          <button 
            onClick={() => isConnected ? disconnect() : setIsModalOpen(true)}
            className={`h-11 px-6 rounded-2xl text-xs font-bold transition-all duration-300 border ${
              isConnected 
                ? "bg-white/5 text-white border-white/10 hover:bg-white/10" 
                : "bg-white text-black border-transparent hover:bg-white/90 shadow-xl shadow-white/5"
            }`}
          >
            {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </header>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
