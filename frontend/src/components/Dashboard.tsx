import React from 'react';
import { Wallet, History, ExternalLink, PlusCircle, ShieldCheck, Globe, Activity, Zap, Loader2, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import ERC20_ABI from '../abis/ERC20.json';

export const Dashboard = () => {
  const { address, isConnected } = useAccount();

  // 1. Balances
  const { data: balanceUSDC, refetch: refetchUSDC } = useReadContract({
    address: CONTRACT_ADDRESSES.mUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balanceEURC, refetch: refetchEURC } = useReadContract({
    address: CONTRACT_ADDRESSES.mEURC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balanceTRYC, refetch: refetchTRYC } = useReadContract({
    address: CONTRACT_ADDRESSES.mTRYC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balanceGBPC, refetch: refetchGBPC } = useReadContract({
    address: CONTRACT_ADDRESSES.mGBPC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balanceJPYC, refetch: refetchJPYC } = useReadContract({
    address: CONTRACT_ADDRESSES.mJPYC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // 2. Faucet Writes
  const { data: mintHash, writeContract: mintWrite, isPending: isMintPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: mintHash });

  React.useEffect(() => {
    if (isConfirmed) {
      refetchUSDC(); refetchEURC(); refetchTRYC(); refetchGBPC(); refetchJPYC();
    }
  }, [isConfirmed]);

  const handleFaucet = async () => {
    if (!address) return;
    const tokens = [
      { addr: CONTRACT_ADDRESSES.mUSDC, dec: 6 },
      { addr: CONTRACT_ADDRESSES.mEURC, dec: 18 },
      { addr: CONTRACT_ADDRESSES.mTRYC, dec: 18 },
      { addr: CONTRACT_ADDRESSES.mGBPC, dec: 18 },
      { addr: CONTRACT_ADDRESSES.mJPYC, dec: 18 },
    ];

    for (const token of tokens) {
      mintWrite({
        address: token.addr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [address, BigInt(10000 * 10**token.dec)],
      });
    }
  };

  const addTokenToWallet = async (address: string, symbol: string, decimals: number) => {
    try {
      if (!(window as any).ethereum) return;
      await (window as any).ethereum.request({
        method: 'wallet_watchAsset',
        params: { type: 'ERC20', options: { address, symbol, decimals } },
      });
    } catch (error) { console.error(error); }
  };

  const activities = [
    { type: 'SWAP', from: '1,250 mEURC', to: '1,345 mUSDC', time: '2 mins ago', status: 'Success' },
    { type: 'ADD', from: '5,000 mUSDC', to: '4,250 mEURC', time: '15 mins ago', status: 'Success' },
    { type: 'SWAP', from: '850 mUSDC', to: '720 mEURC', time: '1 hour ago', status: 'Success' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
      <div className="premium-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-blue-400" />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">My Assets</h3>
          </div>
          <button onClick={handleFaucet} disabled={isMintPending || isConfirming || !isConnected} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-[9px] font-bold uppercase tracking-widest disabled:opacity-20">
            {isMintPending || isConfirming ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            Get Test Tokens
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { symbol: 'mUSDC', balance: balanceUSDC, dec: 6, color: 'text-emerald-400', bg: 'bg-emerald-500/20', addr: CONTRACT_ADDRESSES.mUSDC },
            { symbol: 'mEURC', balance: balanceEURC, dec: 18, color: 'text-blue-400', bg: 'bg-blue-500/20', addr: CONTRACT_ADDRESSES.mEURC },
            { symbol: 'mTRYC', balance: balanceTRYC, dec: 18, color: 'text-red-400', bg: 'bg-red-500/20', addr: CONTRACT_ADDRESSES.mTRYC },
            { symbol: 'mGBPC', balance: balanceGBPC, dec: 18, color: 'text-purple-400', bg: 'bg-purple-500/20', addr: CONTRACT_ADDRESSES.mGBPC },
            { symbol: 'mJPYC', balance: balanceJPYC, dec: 18, color: 'text-orange-400', bg: 'bg-orange-500/20', addr: CONTRACT_ADDRESSES.mJPYC },
          ].map((token) => (
            <div key={token.symbol} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-blue-500/30 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${token.bg} flex items-center justify-center ${token.color} text-[10px] font-bold`}>{token.symbol[1]}</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white/80">{token.symbol}</span>
                  <button onClick={() => addTokenToWallet(token.addr, token.symbol, token.dec)} className="text-[9px] text-white/20 hover:text-white flex items-center gap-1 mt-0.5">
                    <PlusCircle size={8} /> Add to Wallet
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-sm font-black text-white tracking-tight">
                  {token.balance ? Number(formatUnits(token.balance as bigint, token.dec)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="premium-card p-6 md:col-span-2">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <History size={16} className="text-purple-400" />
            <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Global Activity</h3>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Processing
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {activities.map((activity, i) => (
            <div key={i} className="grid grid-cols-12 items-center py-4 px-4 hover:bg-white/[0.02] rounded-xl transition-all border border-transparent hover:border-white/5 group">
              <div className="col-span-2 flex flex-col gap-1">
                <span className={`text-[9px] font-black tracking-widest ${activity.type === 'SWAP' ? 'text-blue-400' : 'text-emerald-400'}`}>{activity.type}</span>
                <span className="text-[10px] text-white/20 font-medium">{activity.time}</span>
              </div>
              <div className="col-span-8 flex items-center gap-4">
                <span className="text-xs font-bold text-white/80">{activity.from}</span>
                <ArrowRight size={12} className="text-white/10 group-hover:text-white/30 group-hover:translate-x-1 transition-all" />
                <span className="text-xs font-bold text-white/80">{activity.to}</span>
              </div>
              <div className="col-span-2 text-right">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                  <ShieldCheck size={10} />
                  {activity.status}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full py-3 mt-4 rounded-xl border border-dashed border-white/10 text-[9px] font-bold text-white/20 uppercase tracking-widest hover:border-white/20 hover:text-white/40 transition-all flex items-center justify-center gap-2">
           View All Transactions <ExternalLink size={10} />
        </button>
      </div>

      <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/40 border border-white/5">
           <Logo size={12} hideText />
           <div className="flex flex-col ml-1">
             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Network Status</span>
             <span className="text-[10px] font-bold text-white">Arc Testnet (Active)</span>
           </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/40 border border-white/5">
           <ShieldCheck size={14} className="text-emerald-400" />
           <div className="flex flex-col">
             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Security Audit</span>
             <span className="text-[10px] font-bold text-white">Protected by ArcGuard</span>
           </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/40 border border-white/5">
           <Activity size={14} className="text-purple-400" />
           <div className="flex flex-col">
             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">24h Volume</span>
             <span className="text-[10px] font-bold text-white">$1,420,500.00</span>
           </div>
        </div>
      </div>
    </div>
  );
};
