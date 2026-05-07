import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, ShieldCheck, Wallet, Loader2, Zap, ExternalLink, CheckCircle2, Droplets } from 'lucide-react';
import { useAccount, useReadContract, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { Logo } from './Logo';
import { ProfileModal, AVATARS } from './ProfileModal';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import ERC20_ABI from '../abis/ERC20.json';

export const Header = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('arc_avatar');
    if (saved) setSelectedAvatar(saved);
  }, []);

  const handleSetAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('arc_avatar', url);
  };

  const { data: nativeBalance } = useBalance({
    address: address,
  });

  const formattedBalance = nativeBalance ? parseFloat(nativeBalance.formatted).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0.0000';

  // Faucet Logic
  const [localLastMint, setLocalLastMint] = useState<number>(0);

  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`faucet_${address}`);
      if (saved) setLocalLastMint(Number(saved));
    }
  }, [address]);

  const { data: faucetHash, writeContract: faucetWrite, isPending: isFaucetPending, error: faucetError } = useWriteContract();
  const { isLoading: isFaucetConfirming, isSuccess: isFaucetSuccess } = useWaitForTransactionReceipt({ hash: faucetHash });

  useEffect(() => {
    if (isFaucetSuccess) {
      const now = Math.floor(Date.now() / 1000);
      if (address) localStorage.setItem(`faucet_${address}`, now.toString());
      setLocalLastMint(now);
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFaucetSuccess, address]);

  useEffect(() => {
    if (faucetError) {
      setErrorMsg(faucetError.message);
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [faucetError]);

  const handleFaucet = async () => {
    try {
      if (!address) return;
      
      const faucetAssets = [
        { addr: CONTRACT_ADDRESSES.aUSDC, decimals: 6, symbol: 'aUSDC' },
        { addr: CONTRACT_ADDRESSES.aEURC, decimals: 18, symbol: 'aEURC' },
        { addr: CONTRACT_ADDRESSES.aTRYC, decimals: 18, symbol: 'aTRYC' },
        { addr: CONTRACT_ADDRESSES.aGBPC, decimals: 18, symbol: 'aGBPC' },
        { addr: CONTRACT_ADDRESSES.aJPYC, decimals: 18, symbol: 'aJPYC' }
      ];

      const tokenAddresses = faucetAssets.map(a => a.addr as `0x${string}`);
      const amounts = faucetAssets.map(a => {
        let baseAmount = 10;
        if (a.symbol === 'aTRYC') baseAmount = 500;
        else if (a.symbol === 'aJPYC') baseAmount = 3000;
        return BigInt(baseAmount) * BigInt(10 ** a.decimals);
      });

      faucetWrite({
        address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`,
        abi: [
          {
            "inputs": [
              { "internalType": "address[]", "name": "tokens", "type": "address[]" },
              { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" },
              { "internalType": "address", "name": "to", "type": "address" }
            ],
            "name": "getTokens",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'getTokens',
        args: [tokenAddresses, amounts, address]
      });
    } catch (err) {
      console.error("Faucet error:", err);
    }
  };

  return (
    <>
      <header className="w-full h-[76px] flex items-center justify-start z-50 transition-all border-b border-white/[0.03] backdrop-blur-md">
        <div className="w-full px-8 flex items-center gap-12">
          <div className="flex items-center gap-10">
            <Logo />
            
            <nav className="flex items-center p-1 bg-white/[0.03] border border-white/[0.05] rounded-xl">
              {['dashboard', 'swap', 'pools', 'leaderboard'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
                    activeTab === tab 
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1" /> {/* Spacer to keep right group on the right but allow flexibility */}


        {/* RIGHT SIDE GROUP */}
        <div className="flex items-center gap-4">
          {/* FAUCET BUTTONS */}
          <div className="flex items-center gap-2">
            {(() => {
              const nowUnix = Math.floor(Date.now() / 1000);
              const inCooldown = localLastMint > 0 && (nowUnix - localLastMint) < 86400;
              const cooldownRemaining = 86400 - (nowUnix - localLastMint);
              const cooldownHours = Math.floor(cooldownRemaining / 3600);
              const cooldownMinutes = Math.floor((cooldownRemaining % 3600) / 60);
              const faucetDisabled = !isConnected || isFaucetPending || isFaucetConfirming || inCooldown;

              return (
                <button 
                  onClick={handleFaucet}
                  disabled={faucetDisabled}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 shadow-xl group ${
                    !isConnected ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 
                    inCooldown ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed' :
                    'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-blue-500/20 text-blue-400 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isFaucetPending || isFaucetConfirming ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : inCooldown ? (
                    <ShieldCheck size={12} className="text-white/40" />
                  ) : (
                    <Zap size={12} className="text-purple-400" />
                  )}
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                    {inCooldown ? `Wait ${cooldownHours}h ${cooldownMinutes}m` : 'ArcFX Faucet'}
                  </span>
                </button>
              );
            })()}

            <a 
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:scale-105 transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 group"
            >
              <ExternalLink size={10} className="text-blue-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Circle Faucet</span>
            </a>
          </div>



          {/* WALLET CONNECTION */}
          {!isConnected ? (
            <button 
              onClick={openConnectModal}
              className="px-6 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              Connect Wallet
            </button>
          ) : (
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="group flex items-center h-9 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all pl-3 pr-1.5 gap-3 backdrop-blur-xl"
            >
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white leading-none mb-0.5">
                  {formattedBalance} <span className="text-blue-400">USDC</span>
                </span>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-white/10 p-0.5 bg-black/40 group-hover:scale-110 transition-transform relative overflow-hidden">
                  <img src={selectedAvatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
                <ChevronDown size={8} className="text-white/20 group-hover:text-blue-400 group-hover:rotate-180 transition-all mr-1" />
              </div>
            </button>
          )}
          </div>
        </div>
      </header>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        selectedAvatar={selectedAvatar}
        setSelectedAvatar={handleSetAvatar}
      />

      {/* SUCCESS POPUP (SWEET BOX) */}
      {showSuccess && (
        <div className="fixed top-28 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-500">
          <div className="glass-frame bg-emerald-500/10 border-emerald-500/30 p-4 pr-12 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Success!</span>
              <span className="text-[11px] font-bold text-white uppercase tracking-tight">10 Units of each a-Asset Claimed</span>
            </div>
            <button onClick={() => setShowSuccess(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
              <ShieldCheck size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ERROR POPUP */}
      {errorMsg && (
        <div className="fixed top-28 right-8 z-[100] animate-in slide-in-from-right-10 fade-in duration-500">
          <div className="glass-frame bg-rose-500/10 border-rose-500/30 p-4 pr-12 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Zap size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Faucet Error</span>
              <span className="text-[9px] font-bold text-white/40 max-w-[200px] truncate">{errorMsg}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
