import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, ShieldCheck, Wallet, Loader2, Zap } from 'lucide-react';
import { useAccount, useConnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { Logo } from './Logo';
import { ProfileModal, AVATARS } from './ProfileModal';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import ERC20_ABI from '../abis/ERC20.json';
import FAUCET_ABI from '../abis/MultiFaucet.json';

export const Header = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const { data: mintHash, writeContract: mintWrite, isPending: isMintPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: mintHash });

  useEffect(() => {
    const saved = localStorage.getItem('arc_avatar');
    if (saved) setSelectedAvatar(saved);
  }, []);

  const handleSetAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('arc_avatar', url);
  };

  const { data: balanceUSDC } = useReadContract({
    address: CONTRACT_ADDRESSES.mUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const handleFaucet = async () => {
    if (!address) return;
    const tokens = [CONTRACT_ADDRESSES.mUSDC, CONTRACT_ADDRESSES.mEURC, CONTRACT_ADDRESSES.mTRYC, CONTRACT_ADDRESSES.mGBPC, CONTRACT_ADDRESSES.mJPYC];
    const amounts = [BigInt(10000 * 10**6), BigInt(10000 * 10**18), BigInt(10000 * 10**18), BigInt(10000 * 10**18), BigInt(10000 * 10**18)];
    mintWrite({ address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`, abi: FAUCET_ABI, functionName: 'getTokens', args: [tokens, amounts, address] });
  };

  const formattedBalance = balanceUSDC ? parseFloat(formatUnits(balanceUSDC as bigint, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  return (
    <>
      <header className="w-full z-50 px-8 py-5 grid grid-cols-3 items-center">
        {/* LEFT: Logo */}
        <div className="flex justify-start items-center">
          <Logo />
        </div>

        {/* CENTER: Navigation (Restored Design) */}
        <div className="flex justify-center items-center">
          <nav className="flex items-center p-1 bg-white/[0.03] border border-white/5 backdrop-blur-xl rounded-2xl">
            {['dashboard', 'swap', 'pools'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                  activeTab === tab 
                    ? "bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.25)]" 
                    : "text-white/30 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* RIGHT: Faucet, Network, Wallet */}
        <div className="flex justify-end items-center gap-4">
          <button 
            onClick={handleFaucet}
            disabled={isMintPending || isConfirming || !isConnected}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] disabled:opacity-20"
          >
            {isMintPending || isConfirming ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} className="animate-pulse" />}
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">USDC Faucet</span>
          </button>

          <div className="hidden xl:flex items-center gap-4 px-4 py-2 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-[9px] font-bold text-white uppercase tracking-widest whitespace-nowrap">Arc Testnet</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <ShieldCheck size={12} className="text-emerald-500" />
          </div>

          {!isConnected ? (
            <button 
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="px-6 py-3 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-black/50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Connect Wallet'}
            </button>
          ) : (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="group flex items-center h-12 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all pl-5 pr-2 gap-4 backdrop-blur-xl"
            >
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white leading-none mb-1">{formattedBalance} <span className="text-blue-400">USDC</span></span>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">Verified</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/10 p-0.5 bg-black/40 group-hover:scale-110 transition-transform">
                  <img src={selectedAvatar} alt="Profile" className="w-full h-full rounded-full" />
                </div>
                <ChevronDown size={10} className="text-white/20 group-hover:text-blue-400 group-hover:rotate-180 transition-all mr-2" />
              </div>
            </button>
          )}
          
          <button className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white/40 hover:text-white transition-all">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={handleSetAvatar}
      />
    </>
  );
};
