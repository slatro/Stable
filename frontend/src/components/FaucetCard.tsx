import React, { useState, useEffect } from 'react';
import { Droplets, Clock, Trophy, MousePointer2 } from 'lucide-react';
import { useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAccount, useWriteContract } from '../hooks/web3';
import { CONTRACT_ADDRESSES, ARC_TESTNET_CONFIG } from '../config/contracts';
import FAUCET_ABI from '../abis/ArcMultiFaucet.json';
import POINTS_ABI from '../abis/ArcPoints.json';
import { useNotifications } from '../context/NotificationContext';

const ActionBox = ({
  title,
  subtitle,
  icon: Icon,
  onAction,
  nextTime,
  isPending,
  isWaiting,
  buttonText,
  pointsLabel
}: any) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);

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

  const disabled = isCooldown || isPending || isWaiting;

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6 flex flex-col gap-6 relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-500 flex-1">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all duration-700" />

      <div className="flex flex-col gap-1 relative z-10">
        <h3 className={`font-black uppercase tracking-tighter transition-all duration-500 ${isCooldown ? 'text-sm text-white/20' : 'text-xl text-white'}`}>
          {title}
        </h3>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
          {isCooldown ? `Next available in ${timeLeft}` : subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3 relative z-10">
        <button 
          onClick={onAction}
          disabled={disabled}
          className={`w-full py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-2
            ${disabled 
              ? 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5' 
              : 'bg-white text-black hover:bg-blue-400 hover:text-white hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5'
            }`}
        >
          {isPending ? (
            <span className="flex items-center gap-2 animate-pulse"><Clock size={14} className="animate-spin" /> Confirm in Wallet...</span>
          ) : isWaiting ? (
            <span className="flex items-center gap-2 animate-pulse"><Clock size={14} className="animate-spin" /> Processing...</span>
          ) : isCooldown ? (
            <span className="flex items-center gap-2 tabular-nums"><Clock size={14} /> {timeLeft}</span>
          ) : (
            <span className="flex items-center gap-2"><Icon size={14} strokeWidth={3} /> {buttonText}</span>
          )}
        </button>
        
        {pointsLabel && (
          <div className="flex justify-center items-center gap-1.5 text-[9px] font-black text-blue-400/50 uppercase tracking-widest">
            <Trophy size={10} /> {pointsLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export const FaucetCard = () => {
  const { address } = useAccount();
  const { notify } = useNotifications();

  // --- FAUCET LOGIC ---
  const { data: faucetNextTime, refetch: refetchFaucet } = useReadContract({
    address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`,
    abi: FAUCET_ABI.abi as any,
    functionName: 'getNextAvailableTime',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  });

  // --- POINTS LOGIC ---
  const { data: pointsNextTime, refetch: refetchPoints } = useReadContract({
    address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`,
    abi: POINTS_ABI.abi as any,
    functionName: 'getNextAvailableTime',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10000 }
  });

  const { writeContract: writeFaucet, data: faucetHash, isPending: isFaucetPending, error: faucetWriteError } = useWriteContract();
  const { isLoading: isFaucetWaiting, isSuccess: isFaucetSuccess, error: faucetConfirmError } = useWaitForTransactionReceipt({ hash: faucetHash });

  const { writeContract: writePoints, data: pointsHash, isPending: isPointsPending, error: pointsWriteError } = useWriteContract();
  const { isLoading: isPointsWaiting, isSuccess: isPointsSuccess, error: pointsConfirmError } = useWaitForTransactionReceipt({ hash: pointsHash });

  // PENDING NOTIFICATIONS
  useEffect(() => {
    if (faucetHash) {
      notify({ 
        type: 'loading', 
        title: 'Transaction Sent', 
        message: 'Your claim is being processed on the Arc Network.',
        link: `${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${faucetHash}`
      });
    }
  }, [faucetHash]);

  useEffect(() => {
    if (pointsHash) {
      notify({ 
        type: 'loading', 
        title: 'Transaction Sent', 
        message: 'Daily check-in is being processed.',
        link: `${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${pointsHash}`
      });
    }
  }, [pointsHash]);

  // SUCCESS HANDLING
  useEffect(() => {
    if (isFaucetSuccess) {
      notify({ 
        type: 'success', 
        title: 'Claim Successful', 
        message: 'Testnet assets have been added to your wallet.',
        link: `${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${faucetHash}`
      });
      refetchFaucet();
    }
  }, [isFaucetSuccess, refetchFaucet, faucetHash]);

  useEffect(() => {
    if (isPointsSuccess) {
      notify({ 
        type: 'success', 
        title: 'Check-in Confirmed', 
        message: 'You have earned +50 Stablr Points!',
        link: `${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${pointsHash}`
      });
      refetchPoints();
    }
  }, [isPointsSuccess, refetchPoints, pointsHash]);

  // ERROR HANDLING
  useEffect(() => {
    const error = faucetWriteError || faucetConfirmError;
    if (error) {
      notify({ type: 'error', title: 'Claim Failed', message: error.message || 'Transaction reverted.' });
    }
  }, [faucetWriteError, faucetConfirmError]);

  useEffect(() => {
    const error = pointsWriteError || pointsConfirmError;
    if (error) {
      notify({ type: 'error', title: 'Check-in Failed', message: error.message || 'Transaction reverted.' });
    }
  }, [pointsWriteError, pointsConfirmError]);

  const handleFaucet = () => {
    writeFaucet({
      address: CONTRACT_ADDRESSES.MULTI_FAUCET as `0x${string}`,
      abi: FAUCET_ABI.abi as any,
      functionName: 'claim',
    });
  };

  const handleCheckIn = () => {
    writePoints({
      address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`,
      abi: POINTS_ABI.abi as any,
      functionName: 'checkIn',
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 px-4">
      <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <ActionBox
          title="Daily Check-in"
          subtitle="Reward for daily activity"
          icon={MousePointer2}
          onAction={handleCheckIn}
          nextTime={pointsNextTime}
          isPending={isPointsPending}
          isWaiting={isPointsWaiting}
          buttonText="Check In"
          pointsLabel="+50 POINTS"
        />

        <ActionBox 
          title="Stablr Faucet"
          subtitle="Get Arc Assets Bundle (aUSDC, aEURC...)"
          icon={Droplets}
          onAction={handleFaucet}
          nextTime={faucetNextTime}
          isPending={isFaucetPending}
          isWaiting={isFaucetWaiting}
          buttonText="Claim Arc Bundle"
          pointsLabel="aUSDC / aEURC / aTRYC / aGBPC / aJPYC"
        />
      </div>
      <div className="mt-8 text-center bg-white/[0.02] border border-white/5 rounded-sm p-4 max-w-xl mx-auto">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
          Need native tokens for gas? Use the <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400 transition-colors">Circle Faucet</a>.
        </p>
      </div>
    </div>
  );
};
