import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, ShieldCheck, Wallet, Loader2, Zap, ExternalLink, CheckCircle2, Droplets } from 'lucide-react';
import { useAccount, useReadContract, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { formatUnits } from 'viem';
import { Logo } from './Logo';
import { ProfileModal, AVATARS } from './ProfileModal';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { triggerIsland } from './TransactionIsland';
import ERC20_ABI from '../abis/ERC20.json';
import FAUCET_ABI from '../abis/ArcMultiFaucet.json';

export const Header = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('arc_profile_avatar');
    if (saved) setSelectedAvatar(saved);
  }, [isProfileOpen]);

  const handleSetAvatar = (url: string) => {
    setSelectedAvatar(url);
    localStorage.setItem('arc_profile_avatar', url);
  };

  const { data: rawUsdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC_NATIVE as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const { data: usdcDecimals } = useReadContract({
    address: CONTRACT_ADDRESSES.USDC_NATIVE as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const formattedNative = rawUsdcBalance !== undefined ? parseFloat(formatUnits(rawUsdcBalance as bigint, (usdcDecimals as number) || 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

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
      setLocalLastMint(now);
      localStorage.setItem(`faucet_${address}`, now.toString());
      setShowSuccess(true);
      triggerIsland('success', 'ArcFX Assets (aUSDC, aEURC, etc.) Claimed', faucetHash, { type: 'Faucet Claim', asset: 'Multiple', amount: '+10' });
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [isFaucetSuccess, address, faucetHash]);

  // Points/Check-in Logic
  const { data: nextCheckIn, refetch: refetchCheckIn } = useReadContract({
    address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`,
    abi: [
      { name: 'getNextCheckInTime', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    ],
    functionName: 'getNextCheckInTime',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  });

  const { writeContract: checkInWrite, data: checkInHash, isPending: isCheckInPending } = useWriteContract();
  const { isLoading: isCheckInConfirming, isSuccess: isCheckInSuccess } = useWaitForTransactionReceipt({ hash: checkInHash });

  useEffect(() => {
    if (isCheckInSuccess) {
      refetchCheckIn();
      triggerIsland('success', 'Daily Check-in Successful', checkInHash, { type: 'check-in' });
    }
  }, [isCheckInSuccess, checkInHash]);

  const { data: userData } = useReadContract({
    address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`,
    abi: [
      { name: 'users', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ name: 'totalPoints', type: 'uint256' }, { name: 'lastCheckIn', type: 'uint256' }, { name: 'currentStreak', type: 'uint256' }, { name: 'totalSwaps', type: 'uint256' }, { name: 'totalLiquidityAdded', type: 'uint256' }] },
    ],
    functionName: 'users',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  });

  const streak = userData ? Number(userData[2]) : 0;

  useEffect(() => {
    if (faucetError) {
      setErrorMsg(faucetError.message);
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [faucetError]);

  return (
    <>
      <header className="w-full h-[76px] flex items-center z-50 border-b border-white/[0.03] backdrop-blur-md">
        <div className="w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="flex items-center p-1 bg-white/[0.03] border border-white/[0.05] rounded-md">
              {['dashboard', 'swap', 'pools', 'leaderboard'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Check-in Button */}
              {(() => {
                const nowUnix = Math.floor(Date.now() / 1000);
                const canCheckIn = !nextCheckIn || nowUnix >= Number(nextCheckIn);
                const checkInDisabled = !isConnected || isCheckInPending || isCheckInConfirming || !canCheckIn;

                return (
                  <button 
                    onClick={() => {
                      checkInWrite({
                        address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`,
                        abi: [{ name: 'checkIn', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] }],
                        functionName: 'checkIn',
                      });
                      triggerIsland('processing', 'Authenticating Check-in...');
                    }}
                    disabled={checkInDisabled}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-all duration-700 shadow-lg group ${
                      !isConnected ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 
                      !canCheckIn ? 'bg-white/5 border-white/10 text-white/40 cursor-default' :
                      'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isCheckInPending || isCheckInConfirming ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={10} className={canCheckIn ? "text-emerald-400" : "text-white/40"} />
                    )}
                    <span className="text-[7px] font-black uppercase tracking-widest">
                      {canCheckIn ? 'Check-in' : `${streak} Day Streak`}
                    </span>
                  </button>
                );
              })()}

              {/* Faucet Button */}
              {(() => {
                const nowUnix = Math.floor(Date.now() / 1000);
                const inCooldown = localLastMint > 0 && (nowUnix - localLastMint) < 86400;
                const cooldownRemaining = 86400 - (nowUnix - localLastMint);
                const hours = Math.floor(cooldownRemaining / 3600);
                const mins = Math.floor((cooldownRemaining % 3600) / 60);

                return (
                  <button 
                    onClick={() => {
                      faucetWrite({
                        address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`,
                        abi: FAUCET_ABI.abi || FAUCET_ABI,
                        functionName: 'claim',
                      });
                      triggerIsland('processing', 'Minting ArcFX Assets...');
                    }}
                    disabled={!isConnected || isFaucetPending || isFaucetConfirming || inCooldown}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all duration-700 shadow-lg group ${
                      !isConnected ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed' : 
                      inCooldown ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed' :
                      'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                    }`}
                  >
                    {isFaucetPending || isFaucetConfirming ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Droplets size={10} className={inCooldown ? "text-white/40" : "text-blue-400"} />
                    )}
                    <span className="text-[8px] font-black uppercase tracking-[0.15em]">
                      {inCooldown ? `WAIT ${hours}H ${mins}M` : 'ArcFX Faucet'}
                    </span>
                  </button>
                );
              })()}

              {/* External Circle Faucet Link */}
              <a 
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all duration-500 group shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
              >
                <ExternalLink size={10} className="animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.15em]">USDC Faucet</span>
              </a>
            </div>

            {/* Wallet Connection */}
            {!isConnected ? (
              <button 
                onClick={openConnectModal}
                className="px-6 py-3 rounded-md bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                Connect Wallet
              </button>
            ) : (
              <button 
                onClick={() => setIsProfileOpen(true)}
                className="group flex items-center h-9 rounded-md bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all pl-3 pr-1.5 gap-3 backdrop-blur-xl"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-white leading-none mb-0.5">
                    {formattedNative} <span className="text-blue-400">USDC</span>
                  </span>
                  <span className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md border border-white/10 p-0.5 bg-black/40 group-hover:scale-110 transition-transform relative overflow-hidden">
                    <img src={selectedAvatar} alt="Profile" className="w-full h-full rounded-md object-cover" />
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

      {/* Popups */}
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
