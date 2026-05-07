import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Coins, Droplets, Pickaxe, Sprout, TrendingUp, Check, Loader2 } from 'lucide-react';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { useNotifications } from '../context/NotificationContext';
import ERC20_ABI from '../abis/ERC20.json';

const FARM_ABI = {
  abi: [
    { type: 'function', name: 'deposit', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { type: 'function', name: 'withdraw', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
    { type: 'function', name: 'pendingArc', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_user', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'userInfo', inputs: [{ name: '_pid', type: 'uint256' }, { name: '_user', type: 'address' }], outputs: [{ name: 'amount', type: 'uint256' }, { name: 'rewardDebt', type: 'uint256' }], stateMutability: 'view' }
  ]
};

export const FarmPanel: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { notify, dismiss } = useNotifications();
  const [stakeAmount, setStakeAmount] = useState('');
  const [actionTx, setActionTx] = useState<string | null>(null);

  // Hardcoding PID 0 for aUSDC/aTRYC pool as set in deployment script
  const pid = 0;
  const lpTokenAddress = "0x95CbAa2df6D1D1Ae22F90B982f6e1Aa73fABb000"; // Same as deployment script

  const { data: lpBalance, refetch: refetchLpBalance } = useReadContract({
    address: lpTokenAddress as `0x${string}`,
    abi: ERC20_ABI as any,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const { data: lpAllowance, refetch: refetchAllowance } = useReadContract({
    address: lpTokenAddress as `0x${string}`,
    abi: ERC20_ABI as any,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.FARM] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const { data: userInfo, refetch: refetchUserInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.FARM as `0x${string}`,
    abi: FARM_ABI.abi,
    functionName: 'userInfo',
    args: address ? [BigInt(pid), address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const { data: pendingRewards, refetch: refetchPending } = useReadContract({
    address: CONTRACT_ADDRESSES.FARM as `0x${string}`,
    abi: FARM_ABI.abi,
    functionName: 'pendingArc',
    args: address ? [BigInt(pid), address] : undefined,
    query: { enabled: !!address, refetchInterval: 1000 } // Poll every second for live counter!
  });

  const { writeContract: writeAction } = useWriteContract();

  const { isSuccess: txSuccess, isError: txError } = useWaitForTransactionReceipt({
    hash: actionTx as `0x${string}`,
  });

  useEffect(() => {
    if (txSuccess) {
      refetchLpBalance();
      refetchAllowance();
      refetchUserInfo();
      refetchPending();
      setStakeAmount('');
      setActionTx(null);
    }
  }, [txSuccess]);

  const stakedAmount = userInfo && (userInfo as any)[0] ? (userInfo as any)[0] as bigint : 0n;
  const earnedArc = pendingRewards ? pendingRewards as bigint : 0n;
  
  const parsedStakeAmount = stakeAmount && !isNaN(parseFloat(stakeAmount)) ? parseUnits(stakeAmount, 18) : 0n;
  const needsApprove = address && lpAllowance !== undefined && stakeAmount && (lpAllowance as bigint) < parsedStakeAmount;
  const insufficientLp = address && lpBalance !== undefined && parsedStakeAmount > (lpBalance as bigint);

  const handleApprove = () => {
    const tid = notify({ type: 'loading', title: 'Approving', message: `Allowing Farm to use your LP Tokens...` });
    writeAction({
      address: lpTokenAddress as `0x${string}`,
      abi: ERC20_ABI as any,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.FARM, parseUnits("1000000", 18)]
    }, {
      onSuccess: (hash) => {
        setActionTx(hash);
        notify({ type: 'success', title: 'Approval Sent', message: 'Waiting for confirmation...' });
        dismiss(tid);
      },
      onError: (err) => {
        dismiss(tid);
        notify({ type: 'error', title: 'Approval Failed', message: err.message.slice(0, 100) });
      }
    });
  };

  const handleStake = () => {
    if (!parsedStakeAmount || parsedStakeAmount <= 0n) return;
    const tid = notify({ type: 'loading', title: 'Staking', message: `Depositing LP tokens to Farm...` });
    writeAction({
      address: CONTRACT_ADDRESSES.FARM as `0x${string}`,
      abi: FARM_ABI.abi,
      functionName: 'deposit',
      args: [BigInt(pid), parsedStakeAmount]
    }, {
      onSuccess: (hash) => {
        setActionTx(hash);
        notify({ type: 'success', title: 'Staking Sent', message: 'Transaction submitted.' });
        dismiss(tid);
      },
      onError: (err) => {
        dismiss(tid);
        notify({ type: 'error', title: 'Staking Failed', message: err.message.slice(0, 100) });
      }
    });
  };

  const handleHarvest = () => {
    if (earnedArc <= 0n) return;
    const tid = notify({ type: 'loading', title: 'Claiming Points', message: `Registering Arc Points to your account...` });
    // Deposit 0 is the standard way to harvest in MasterChef
    writeAction({
      address: CONTRACT_ADDRESSES.FARM as `0x${string}`,
      abi: FARM_ABI.abi,
      functionName: 'deposit',
      args: [BigInt(pid), 0n]
    }, {
      onSuccess: (hash) => {
        setActionTx(hash);
        notify({ type: 'success', title: 'Points Claimed', message: 'Arc Points successfully registered!' });
        dismiss(tid);
      },
      onError: (err) => {
        dismiss(tid);
        notify({ type: 'error', title: 'Claim Failed', message: err.message.slice(0, 100) });
      }
    });
  };

  const handleWithdraw = () => {
    if (stakedAmount <= 0n) return;
    const tid = notify({ type: 'loading', title: 'Withdrawing', message: `Removing LP tokens from Farm...` });
    writeAction({
      address: CONTRACT_ADDRESSES.FARM as `0x${string}`,
      abi: FARM_ABI.abi,
      functionName: 'withdraw',
      args: [BigInt(pid), stakedAmount]
    }, {
      onSuccess: (hash) => {
        setActionTx(hash);
        notify({ type: 'success', title: 'Withdraw Sent', message: 'Transaction submitted.' });
        dismiss(tid);
      },
      onError: (err) => {
        dismiss(tid);
        notify({ type: 'error', title: 'Withdraw Failed', message: err.message.slice(0, 100) });
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-10 animate-fade-in py-4 px-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Yield Farm</h1>
        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Stake LP tokens to farm Arc Points at 10 Pts/sec.</p>
      </div>

      {!isConnected ? (
         <div className="premium-card p-12 flex flex-col items-center justify-center text-center gap-4 bg-white/[0.01]">
            <Sprout className="text-white/10" size={48} />
            <div className="flex flex-col gap-1 text-center">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">Wallet Disconnected</span>
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">Connect your wallet to farm Arc Points.</p>
            </div>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* HARVEST CARD */}
          <div className="premium-card p-8 flex flex-col gap-8 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Pickaxe className="text-blue-400" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white uppercase tracking-widest">Arc Points Earned</span>
                <span className="text-xs font-bold text-white/40">Real-time loyalty points</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                {parseFloat(formatUnits(earnedArc, 18)).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </span>
              <span className="text-xs font-bold text-blue-400/80 uppercase tracking-widest">Unlocks future airdrops & platform perks</span>
            </div>

            <button 
              onClick={handleHarvest}
              disabled={earnedArc <= 0n}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl ${earnedArc > 0n ? 'bg-blue-500 text-white hover:bg-blue-400 hover:shadow-blue-500/20 hover:-translate-y-1' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              Claim Points
            </button>
          </div>

          {/* STAKING CARD */}
          <div className="premium-card p-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <img src={TOKENS[2].logo} alt="USDC" className="w-10 h-10 rounded-full border-2 border-[#0f172a]" />
                  <img src={TOKENS[4].logo} alt="TRYC" className="w-10 h-10 rounded-full border-2 border-[#0f172a]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black text-white uppercase tracking-widest">aUSDC/aTRYC</span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Multiplier: 100X</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Your Stake</span>
                <span className="text-lg font-black text-white tabular-nums">{parseFloat(formatUnits(stakedAmount, 18)).toFixed(6)} LP</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Deposit LP Tokens</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${insufficientLp ? 'text-red-400' : 'text-white/40'}`}>
                  Wallet: {lpBalance ? parseFloat(formatUnits(lpBalance as bigint, 18)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0.00'} LP
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.0"
                  className="w-full bg-transparent text-3xl font-black text-white placeholder-white/10 outline-none tabular-nums"
                />
                <button 
                  onClick={() => setStakeAmount(lpBalance ? formatUnits(lpBalance as bigint, 18) : '0')}
                  className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-500/30 transition-all"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="flex gap-4">
               {insufficientLp ? (
                 <button disabled className="flex-1 py-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed transition-all">Insufficient LP</button>
               ) : needsApprove ? (
                 <button onClick={handleApprove} className="flex-1 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl">Approve LP</button>
               ) : (
                 <button onClick={handleStake} disabled={!stakeAmount || parseFloat(stakeAmount) <= 0} className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl ${!stakeAmount || parseFloat(stakeAmount) <= 0 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02] active:scale-95'}`}>Stake</button>
               )}
               
               <button 
                 onClick={handleWithdraw}
                 disabled={stakedAmount <= 0n}
                 className={`px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all border ${stakedAmount > 0n ? 'border-white/20 text-white hover:bg-white/10' : 'border-white/5 text-white/20 cursor-not-allowed'}`}
               >
                 Unstake
               </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
