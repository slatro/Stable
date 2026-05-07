import React, { useState, useEffect } from 'react';
import { Droplets, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import FAUCET_ABI from '../abis/ArcMultiFaucet.json';
import { useNotifications } from '../context/NotificationContext';

export const FaucetCard = () => {
  const { address, isConnected } = useAccount();
  const { notify, dismiss } = useNotifications();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);

  // Read next available time from contract
  const { data: nextTime, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`,
    abi: FAUCET_ABI.abi as any,
    functionName: 'getNextAvailableTime',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!nextTime) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const target = Number(nextTime);
      const diff = target - now;

      if (diff > 0) {
        setIsCooldown(true);
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setIsCooldown(false);
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextTime]);

  const handleClaim = () => {
    if (!isConnected) {
      notify({ type: 'error', title: 'Connect Wallet', message: 'Please connect your wallet to use the faucet.' });
      return;
    }

    const tid = notify({ type: 'loading', title: 'Claiming Tokens', message: 'Minting your daily test asset bundle...' });

    writeContract({
      address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`,
      abi: FAUCET_ABI.abi as any,
      functionName: 'claim',
    }, {
      onSuccess: () => {
        dismiss(tid);
        notify({ type: 'success', title: 'Success', message: 'Your daily tokens have been sent!' });
        refetch();
      },
      onError: (err) => {
        dismiss(tid);
        notify({ type: 'error', title: 'Faucet Error', message: err.message || 'Could not claim tokens.' });
      }
    });
  };

  return (
    <div className="glass-panel p-8 rounded-3xl w-full max-w-4xl mx-auto mt-12 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-blue-600/20" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
        <div className="max-w-md transition-all duration-500">
          <h2 className={`font-black text-white uppercase tracking-tighter transition-all duration-500 ${isCooldown ? 'text-lg text-white/40' : 'text-3xl'}`}>
            ArcFX Faucet
          </h2>
          
          {isCooldown ? (
            <div className="mt-2 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-700">
              <div className="flex items-center gap-2 text-blue-400 font-black tracking-widest text-xl tabular-nums">
                <Clock size={18} className="animate-pulse" />
                {timeLeft}
              </div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Next claim available in {timeLeft}</p>
            </div>
          ) : (
            <p className="text-white/40 text-xs font-medium leading-relaxed mt-2 uppercase tracking-wide">
              Get your daily test asset bundle: 100 USDC/EUR/GBP, 5k TRY, and 15k JPY.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 min-w-[280px]">
          <button 
            onClick={handleClaim}
            disabled={isCooldown || isPending || isWaiting}
            className={`relative overflow-hidden group py-5 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-3
              ${isCooldown 
                ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' 
                : 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-2xl shadow-white/10'
              }`}
          >
            {isPending || isWaiting ? (
              <span className="flex items-center gap-2 animate-pulse">
                <Droplets size={16} className="animate-bounce" /> Processing...
              </span>
            ) : isCooldown ? (
              <span className="flex items-center gap-2 opacity-50">
                <Clock size={16} /> Locked
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Droplets size={16} /> Claim Bundle
              </span>
            )}
            
            {!isCooldown && (
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            )}
          </button>
          
          <div className="flex justify-center gap-4 text-[9px] font-black text-white/20 uppercase tracking-widest">
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500/50" /> 24h Cooldown</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500/50" /> Instant Mint</span>
          </div>
        </div>
      </div>
    </div>
  );
};
