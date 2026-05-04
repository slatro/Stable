import React, { useState, useEffect } from 'react';
import { Plus, Minus, Info, Wallet, Loader2, ArrowRight, TrendingUp, Layers, Percent } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';

export const PoolsPanel = () => {
  const { address, isConnected } = useAccount();
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [activeAction, setActiveAction] = useState<'add' | 'remove'>('add');

  // 1. Contract Data Reads
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'getReserves',
  });

  const { data: userLiquidity, refetch: refetchUserLiquidity } = useReadContract({
    address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'getUserLiquidity',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: totalLiquidity, refetch: refetchTotalLiquidity } = useReadContract({
    address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'totalLiquidity',
  });

  const { data: poolShare, refetch: refetchPoolShare } = useReadContract({
    address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'getPoolShare',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // 5. Read Balances & Allowances
  const { data: balanceA, refetch: refetchBalA } = useReadContract({
    address: CONTRACT_ADDRESSES.mUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balanceB, refetch: refetchBalB } = useReadContract({
    address: CONTRACT_ADDRESSES.mEURC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: allowanceA, refetch: refetchAllA } = useReadContract({
    address: CONTRACT_ADDRESSES.mUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.AMM] : undefined,
    query: { enabled: !!address }
  });

  const { data: allowanceB, refetch: refetchAllB } = useReadContract({
    address: CONTRACT_ADDRESSES.mEURC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.AMM] : undefined,
    query: { enabled: !!address }
  });

  // 3. Write Operations
  const { data: addHash, writeContract: addWrite, isPending: isAddPending } = useWriteContract();
  const { isLoading: isAddConfirming, isSuccess: isAddConfirmed } = useWaitForTransactionReceipt({ hash: addHash });

  const { data: removeHash, writeContract: removeWrite, isPending: isRemovePending } = useWriteContract();
  const { isLoading: isRemoveConfirming, isSuccess: isRemoveConfirmed } = useWaitForTransactionReceipt({ hash: removeHash });

  const { data: approveAHash, writeContract: approveAWrite, isPending: isApproveAPending } = useWriteContract();
  const { isLoading: isApproveAConfirming, isSuccess: isApproveAConfirmed } = useWaitForTransactionReceipt({ hash: approveAHash });

  const { data: approveBHash, writeContract: approveBWrite, isPending: isApproveBPending } = useWriteContract();
  const { isLoading: isApproveBConfirming, isSuccess: isApproveBConfirmed } = useWaitForTransactionReceipt({ hash: approveBHash });

  const refreshAll = async () => {
    await Promise.all([
      refetchReserves(), refetchUserLiquidity(), refetchTotalLiquidity(), 
      refetchPoolShare(), refetchBalA(), refetchBalB(), refetchAllA(), refetchAllB()
    ]);
  };

  useEffect(() => {
    if (isAddConfirmed || isRemoveConfirmed || isApproveAConfirmed || isApproveBConfirmed) {
      refreshAll();
      if (isAddConfirmed) { setAmountA(''); setAmountB(''); }
      if (isRemoveConfirmed) { setRemoveAmount(''); }
    }
  }, [isAddConfirmed, isRemoveConfirmed, isApproveAConfirmed, isApproveBConfirmed]);

  // Logic Helpers
  const needsApproveA = isConnected && allowanceA !== undefined && parseFloat(amountA || '0') > 0 && (allowanceA as bigint) < parseUnits(amountA, 10);
  const needsApproveB = isConnected && allowanceB !== undefined && parseFloat(amountB || '0') > 0 && (allowanceB as bigint) < parseUnits(amountB, 10);

  const handleAddLiquidity = () => {
    if (needsApproveA) {
      approveAWrite({ address: CONTRACT_ADDRESSES.mUSDC as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [CONTRACT_ADDRESSES.AMM, parseUnits(amountA, 10)] });
    } else if (needsApproveB) {
      approveBWrite({ address: CONTRACT_ADDRESSES.mEURC as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [CONTRACT_ADDRESSES.AMM, parseUnits(amountB, 10)] });
    } else {
      addWrite({
        address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
        abi: AMM_ABI,
        functionName: 'addLiquidity',
        args: [parseUnits(amountA, 10), parseUnits(amountB, 10)],
      });
    }
  };

  const handleRemoveLiquidity = () => {
    removeWrite({
      address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
      abi: AMM_ABI,
      functionName: 'removeLiquidity',
      args: [parseUnits(removeAmount, 10)],
    });
  };

  const StatBox = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
        <Icon size={12} className={color} />
        {label}
      </div>
      <div className="text-lg font-black text-white tracking-tight">{value}</div>
    </div>
  );

  const resA = reserves ? formatUnits((reserves as any)[0], 10) : '0';
  const resB = reserves ? formatUnits((reserves as any)[1], 10) : '0';
  const userLP = userLiquidity ? formatUnits(userLiquidity as bigint, 10) : '0';
  const share = poolShare ? (Number(poolShare) / 10000).toFixed(4) : '0';

  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* LEFT: POOL OVERVIEW & POSITIONS */}
      <div className="flex flex-col gap-6">
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Layers className="text-blue-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">mEURC / mUSDC Liquidity Pool</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold font-mono">Stablecoin Settlement Pair</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
               <TrendingUp size={12} className="text-emerald-400" />
               <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">APR: 4.2%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatBox label="Total Reserve A" value={`${Number(resA).toLocaleString()} mUSDC`} icon={Layers} color="text-emerald-500" />
            <StatBox label="Total Reserve B" value={`${Number(resB).toLocaleString()} mEURC`} icon={Layers} color="text-blue-500" />
            <StatBox label="Pool Volume (24h)" value="$142,500" icon={TrendingUp} color="text-purple-500" />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Percent size={80} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-6">Your Position</h3>
            
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Your Pool Share</span>
                <span className="text-4xl font-black text-white tracking-tighter">{share}%</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">LP Tokens Owned</div>
                <div className="text-xl font-bold text-white">{Number(userLP).toFixed(4)} ALP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: ACTIONS */}
      <div className="flex flex-col gap-4">
        <div className="premium-card p-1 flex gap-1 bg-black/40">
          <button 
            onClick={() => setActiveAction('add')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeAction === 'add' ? 'bg-white/10 text-white shadow-xl shadow-black/20' : 'text-white/20 hover:text-white/40'}`}
          >
            Add Liquidity
          </button>
          <button 
            onClick={() => setActiveAction('remove')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeAction === 'remove' ? 'bg-white/10 text-white shadow-xl shadow-black/20' : 'text-white/20 hover:text-white/40'}`}
          >
            Remove
          </button>
        </div>

        <div className="premium-card p-5">
          {activeAction === 'add' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Input Amount A</span>
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Bal: {balanceA ? Number(formatUnits(balanceA as bigint, 10)).toFixed(2) : '0'}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <input type="number" value={amountA} onChange={(e) => setAmountA(e.target.value)} placeholder="0.00" className="bg-transparent text-xl font-bold text-white outline-none w-full" />
                  <span className="text-xs font-bold text-white/40 ml-2">mUSDC</span>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-[#0a0a0b] border border-white/10 flex items-center justify-center">
                  <Plus size={14} className="text-blue-400" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Input Amount B</span>
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Bal: {balanceB ? Number(formatUnits(balanceB as bigint, 10)).toFixed(2) : '0'}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <input type="number" value={amountB} onChange={(e) => setAmountB(e.target.value)} placeholder="0.00" className="bg-transparent text-xl font-bold text-white outline-none w-full" />
                  <span className="text-xs font-bold text-white/40 ml-2">mEURC</span>
                </div>
              </div>

              <button 
                onClick={handleAddLiquidity}
                disabled={!isConnected || isAddPending || isAddConfirming || !amountA || !amountB}
                className="w-full py-4 mt-2 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] transition-all disabled:opacity-20 disabled:scale-100 shadow-xl shadow-white/5"
              >
                {isAddPending || isAddConfirming || isApproveAPending || isApproveBPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : needsApproveA ? "Approve mUSDC" : needsApproveB ? "Approve mEURC" : "Add Liquidity"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Amount to Remove (LP)</span>
                   <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Owned: {Number(userLP).toFixed(4)}</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <input type="number" value={removeAmount} onChange={(e) => setRemoveAmount(e.target.value)} placeholder="0.00" className="bg-transparent text-xl font-bold text-white outline-none w-full" />
                  <span className="text-xs font-bold text-white/40 ml-2">ALP</span>
                </div>
              </div>

              <button 
                onClick={handleRemoveLiquidity}
                disabled={!isConnected || isRemovePending || isRemoveConfirming || !removeAmount}
                className="w-full py-4 mt-2 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] transition-all disabled:opacity-20 disabled:scale-100 shadow-xl shadow-white/5"
              >
                {isRemovePending || isRemoveConfirming ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : "Remove Liquidity"}
              </button>
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
             <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
             <p className="text-[9px] font-medium text-blue-400/60 leading-relaxed uppercase tracking-wider">
               Adding liquidity earns you 0.05% of all trades on this pair proportional to your share of the pool.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
