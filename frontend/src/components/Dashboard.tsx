import React, { useMemo } from 'react';
import { Wallet, TrendingUp, Zap, ShieldCheck, ArrowUpRight, ArrowDownRight, Search, Filter, Loader2, CheckCircle2, Layers } from 'lucide-react';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { usePrices } from '../context/PriceContext';
import FAUCET_ABI from '../abis/MultiFaucet.json';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';
import POINTS_ABI from '../abis/ArcPoints.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import STAKING_ABI from '../abis/ArcFXStaking.json';
import { useNotifications } from '../context/NotificationContext';

const FormatSymbol = ({ symbol, className = "" }: { symbol: string | undefined, className?: string }) => {
  if (!symbol) return null;
  if (symbol.startsWith('a')) {
    return (
      <span className={className}>
        <span className="text-blue-400 lowercase">a</span>
        <span className="uppercase">{symbol.slice(1)}</span>
      </span>
    );
  }
  return <span className={`${className} uppercase`}>{symbol}</span>;
};

class DashboardErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-96 flex flex-col items-center justify-center gap-4 bg-red-900/20 border border-red-500/50 rounded-2xl p-8">
          <ShieldCheck size={48} className="text-red-500" />
          <h2 className="text-xl font-black text-red-500 uppercase tracking-widest">Dashboard System Crash</h2>
          <pre className="text-[10px] text-red-200 bg-red-950/50 p-4 rounded-xl max-w-2xl overflow-auto whitespace-pre-wrap font-mono border border-red-500/20 shadow-2xl">
            {this.state.error?.toString()}{'\n\n'}{this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const AirdropIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c0-5 4-9 9-9s9 4 9 9" /><path d="M12 3v9" /><path d="M12 3c-3 0-6 3-6 9" /><path d="M12 3c3 0 6 3 6 9" />
    <path d="M3 12l9 6" /><path d="M21 12l-9 6" /><path d="M12 12l0 6" /><rect x="8.5" y="18" width="7" height="4" rx="1.5" />
  </svg>
);

const StatCard = ({ title, value, change, icon: Icon, color, imageIcon, glowColor, isSpecial }: any) => (
  <div className={`glass-frame px-4 py-3 flex items-center gap-4 group hover:border-white/20 transition-all duration-700 relative overflow-hidden h-[72px] ${isSpecial ? 'border-blue-400/40 bg-blue-400/[0.08]' : ''}`}>
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xl border border-white/5 ${color}`}>
      {title === "ARC POINTS" ? <div className="animate-bounce-slow"><AirdropIcon /></div> : <Icon size={20} />}
    </div>
    <div className="flex flex-col flex-1 leading-tight">
      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">{title}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-black text-white tracking-tighter">{value}</span>
        {change && <div className={`flex items-center gap-0.5 text-[9px] font-black italic tracking-widest ${change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{change}</div>}
      </div>
    </div>
  </div>
);

const AssetRow = ({ asset, balance, price, change24h, onAction }: any) => {
  const isNative = asset?.symbol === 'USDC' || asset?.symbol === 'EURC';
  return (
    <tr className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
            <img src={asset?.logo} alt="" className="w-full h-full rounded-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white uppercase tracking-tight italic">
              {asset?.symbol?.startsWith('a') ? <><span className="text-blue-400 lowercase">a</span><span>{asset?.symbol?.slice(1)}</span></> : asset?.symbol}
            </span>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">{asset?.name}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-5">
        <div className="flex flex-col">
          <span className="text-xs font-black text-white tabular-nums">{balance}</span>
          <span className="text-[9px] font-bold text-white/20 tabular-nums">≈ ${(parseFloat(balance.replace(/,/g, '')) * (price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </td>
      <td className="py-4 px-5">
        <div className="flex flex-col">
          <span className="text-xs font-black text-white tabular-nums">${(price || 0).toLocaleString(undefined, { minimumFractionDigits: 4 })}</span>
          <span className={`text-[9px] font-black italic tracking-widest ${change24h?.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{change24h}</span>
        </div>
      </td>
      <td className="py-4 px-5 text-right">
        {asset?.symbol === 'EURC' ? (
          <div className="flex flex-col items-center justify-center h-full px-8 ml-auto w-fit text-[7px] font-black text-white/20 uppercase tracking-[0.2em] italic leading-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
            <span>Staking</span>
            <span>Soon</span>
          </div>
        ) : (
          <button 
            onClick={() => onAction(asset?.symbol === 'USDC' ? 'stake' : asset)} 
            className={`px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isNative ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-white/[0.05] border-white/10 text-white/40 hover:bg-white hover:text-black'}`}
          >
            {isNative ? 'Stake' : 'Trade'}
          </button>
        )}
      </td>
    </tr>
  );
};

const useTotalWalletValue = (balances: any, livePrices: any, nativeBalances: any) => {
  return useMemo(() => {
    if (!livePrices || !balances || !Array.isArray(balances)) return 0;
    let total = 0;
    try {
      if (nativeBalances.usdc && livePrices['USDC']) {
        const bal = parseFloat(formatUnits(BigInt(nativeBalances.usdc.value.toString()), nativeBalances.usdc.decimals));
        total += bal * livePrices['USDC'].price;
      }
      if (nativeBalances.eurc !== undefined && livePrices['EURC']) {
        const bal = parseFloat(formatUnits(BigInt(nativeBalances.eurc.toString()), 18));
        total += bal * livePrices['EURC'].price;
      }
      balances.slice(2).forEach((res: any, i: number) => {
        if (res.status === 'success' && res.result !== undefined && res.result !== null) {
          const token = TOKENS[i + 2];
          const bal = parseFloat(formatUnits(BigInt(res.result.toString()), token.decimals || 18));
          const price = livePrices[token.symbol]?.price || 0;
          total += bal * price;
        }
      });
    } catch (e) { console.error("Wallet value error:", e); }
    return total;
  }, [balances, livePrices, nativeBalances]);
};

export const Dashboard = ({ onTradeAction }: { onTradeAction: (asset: any) => void }) => {
  return (
    <DashboardErrorBoundary>
      <div className="flex flex-col gap-12 animate-in fade-in duration-700 w-full max-w-[1600px] mx-auto py-4">
        <DashboardContent onTradeAction={onTradeAction} />
      </div>
    </DashboardErrorBoundary>
  );
};

const DashboardContent = ({ onTradeAction }: { onTradeAction: (asset: any) => void }) => {
  const { address } = useAccount();
  const priceContext = usePrices();
  const prices = priceContext?.prices || {};

  const balanceContracts = useMemo(() => {
    return TOKENS.map(t => ({
      address: t.addr as `0x${string}`,
      abi: ERC20_ABI.abi || ERC20_ABI as any,
      functionName: 'balanceOf',
      args: address ? [address] : undefined
    }));
  }, [address]);

  const { data: balances } = useReadContracts({
    contracts: balanceContracts as any,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const { data: usdcNativeBal } = useBalance({ address, query: { enabled: !!address, refetchInterval: 5000 } });
  const { data: eurcNativeBal } = useReadContract({
    address: CONTRACT_ADDRESSES.EURC_NATIVE as `0x${string}`,
    abi: ERC20_ABI.abi || ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  // --- ROBUST POOL DISCOVERY ---
  const { data: routerFactory } = useReadContract({
    address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`,
    abi: ROUTER_ABI.abi || ROUTER_ABI as any,
    functionName: 'factory',
    query: { refetchInterval: 100000 }
  });
  const activeFactory = useMemo(() => (routerFactory as string) || CONTRACT_ADDRESSES.FACTORY, [routerFactory]);

  const { data: poolsLength } = useReadContract({
    address: activeFactory as `0x${string}`,
    abi: FACTORY_ABI.abi || FACTORY_ABI as any,
    functionName: 'allPoolsLength',
    query: { enabled: !!activeFactory, refetchInterval: 10000 }
  });

  const poolAddressContracts = useMemo(() => {
    const length = Number(poolsLength || 0);
    return Array.from({ length }, (_, i) => ({
      address: activeFactory as `0x${string}`,
      abi: FACTORY_ABI.abi || FACTORY_ABI as any,
      functionName: 'allPools',
      args: [BigInt(i)]
    }));
  }, [poolsLength, activeFactory]);

  const { data: poolAddressesRes } = useReadContracts({ 
    contracts: poolAddressContracts as any,
    query: { enabled: poolAddressContracts.length > 0, refetchInterval: 10000 }
  });

  const poolAddresses = useMemo(() => {
    if (!poolAddressesRes) return [];
    return poolAddressesRes.filter((r: any) => r.status === 'success' && r.result).map((r: any) => r.result as `0x${string}`);
  }, [poolAddressesRes]);

  const poolMetadataContracts = useMemo(() => {
    if (!poolAddresses || !address) return [];
    const calls: any[] = [];
    poolAddresses.forEach((addr) => {
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'token0' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'token1' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'reserve0' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'reserve1' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'totalLiquidity' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'liquidityShares', args: [address] });
    });
    return calls;
  }, [poolAddresses, address]);

  const { data: poolMetadatas } = useReadContracts({
    contracts: poolMetadataContracts as any,
    query: { enabled: poolMetadataContracts.length > 0, refetchInterval: 5000 }
  });

  const poolDetails = useMemo(() => {
    if (!poolMetadatas || !poolAddresses) return [];
    const pos: any[] = [];
    for (let i = 0; i < poolAddresses.length; i++) {
      const baseIdx = i * 6;
      const t0Res = poolMetadatas[baseIdx];
      const t1Res = poolMetadatas[baseIdx + 1];
      const r0Res = poolMetadatas[baseIdx + 2];
      const r1Res = poolMetadatas[baseIdx + 3];
      const tsRes = poolMetadatas[baseIdx + 4];
      const balRes = poolMetadatas[baseIdx + 5];

      if (balRes?.status === 'success' && (balRes.result as bigint) > 0n) {
        const t0Addr = t0Res?.result as string;
        const t1Addr = t1Res?.result as string;
        const balance = balRes.result as bigint;
        const totalLiq = tsRes?.result as bigint;
        const r0 = r0Res?.result as bigint;
        const r1 = r1Res?.result as bigint;

        if (t0Addr && t1Addr) {
          const t0 = TOKENS.find(t => t.addr.toLowerCase() === t0Addr.toLowerCase());
          const t1 = TOKENS.find(t => t.addr.toLowerCase() === t1Addr.toLowerCase());
          if (t0 && t1) {
            let usdValue = 0;
            let sharePct = 0;
            if (totalLiq > 0n) {
              sharePct = Number((balance * 10000n) / totalLiq) / 100;
              const val0 = parseFloat(formatUnits((balance * (r0 || 0n)) / totalLiq, t0.decimals));
              const val1 = parseFloat(formatUnits((balance * (r1 || 0n)) / totalLiq, t1.decimals));
              const price0 = prices[t0.symbol]?.price || 0;
              const price1 = prices[t1.symbol]?.price || 0;
              usdValue = (val0 * price0) + (val1 * price1);
            }
            const isTryc = t0.symbol.includes('TRYC') || t1.symbol.includes('TRYC');
            const randomVal = parseInt(poolAddresses[i].slice(2, 6), 16) / 65535;
            const apr = isTryc ? (9 + (isNaN(randomVal) ? 0 : randomVal) * 3).toFixed(2) + '%' : (2 + (isNaN(randomVal) ? 0 : randomVal) * 2).toFixed(2) + '%';
            pos.push({ pair: [t0, t1], lpBalance: formatUnits(balance, 18), poolAddr: poolAddresses[i], sharePct, usdValue, apr });
          }
        }
      }
    }
    return pos;
  }, [poolMetadatas, poolAddresses, prices]);

  const walletValue = useTotalWalletValue(balances, prices, { usdc: usdcNativeBal, eurc: eurcNativeBal });
  const lpValue = poolDetails.reduce((acc, p) => acc + p.usdValue, 0);
  const totalPortfolioValue = lpValue + walletValue;
  
  const estimatedYield = poolDetails.reduce((acc, p) => {
    const aprNum = parseFloat(p.apr);
    return acc + (p.usdValue * (aprNum / 100) / 365);
  }, 0).toFixed(6);

  const { data: userPoints } = useReadContract({ address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`, abi: POINTS_ABI.abi as any, functionName: 'getUserPoints', args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 10000 } });

  // --- STAKING HOOKS ---
  const { data: stakingData } = useReadContracts({
    contracts: [
      { address: (CONTRACT_ADDRESSES as any).STAKING_CONTRACT as `0x${string}`, abi: STAKING_ABI as any, functionName: 'getExchangeRate' },
      { address: (CONTRACT_ADDRESSES as any).STAKING_CONTRACT as `0x${string}`, abi: STAKING_ABI as any, functionName: 'totalSupply' },
    ],
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const exchangeRate = useMemo(() => stakingData?.[0].status === 'success' ? stakingData[0].result as bigint : 1000000n, [stakingData]);
  const totalStaked = useMemo(() => stakingData?.[1].status === 'success' ? stakingData[1].result as bigint : 0n, [stakingData]);

  const astUSDC_Token = TOKENS.find(t => t.symbol === 'astUSDC');
  const astUSDC_Idx = TOKENS.findIndex(t => t.symbol === 'astUSDC');
  const astUSDC_BalRaw = (balances?.[astUSDC_Idx]?.status === 'success' && balances?.[astUSDC_Idx]?.result !== undefined) ? BigInt(balances?.[astUSDC_Idx]?.result.toString()) : 0n;
  const astUSDC_Bal = parseFloat(formatUnits(astUSDC_BalRaw, 6));
  const stakedValueUsd = astUSDC_Bal * (parseFloat(formatUnits(exchangeRate, 6))) * (prices['USDC']?.price || 1);

  return (
    <div className="w-full space-y-8 px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ARC POINTS" value={userPoints !== undefined ? userPoints.toString() : '...'} isSpecial={true} color="bg-blue-500/10 text-blue-400" />
        <StatCard title="PORTFOLIO VALUE" value={`$${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change="+1.2%" icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard title="YIELD EARNED" value={`$${estimatedYield}`} icon={Zap} color="bg-amber-500/10 text-amber-400" />
        <StatCard title="ACTIVE POSITIONS" value={poolDetails.length.toString()} icon={Wallet} color="bg-purple-500/10 text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2 h-8"><div className="w-1.5 h-6 bg-emerald-500 rounded-full" /><h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Asset Portfolio</h3></div>
          <div className="premium-card overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/5 bg-white/[0.02]"><th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase">Asset</th><th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase">Balance</th><th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase">Price</th><th className="py-4 px-5 text-right text-[10px] font-black text-white/20 uppercase">Actions</th></tr></thead>
              <tbody>
                {TOKENS.map((token, i) => {
                  const priceData = prices[token.symbol] || { price: 1, change24h: '+0.00%' };
                  let formattedBal = '0.00';
                  if (token.symbol === 'USDC' && usdcNativeBal) formattedBal = parseFloat(formatUnits(usdcNativeBal.value, 18)).toFixed(4);
                  else if (token.symbol === 'EURC' && eurcNativeBal !== undefined) formattedBal = parseFloat(formatUnits(BigInt(eurcNativeBal.toString()), 6)).toFixed(4);
                  else {
                    const balRes = balances?.[i];
                    const rawBal = (balRes?.status === 'success' && balRes.result !== undefined) ? BigInt(balRes.result.toString()) : 0n;
                    formattedBal = parseFloat(formatUnits(rawBal, token.decimals)).toFixed(4);
                  }
                  return <AssetRow key={token.symbol} asset={token} balance={formattedBal} price={priceData.price} change24h={priceData.change24h} onAction={onTradeAction} />;
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2 h-8">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Staking & Positions</h3>
          </div>
          
          {/* ULTRA COMPACT STAKING ROW */}
          <div className="premium-card p-3 shadow-xl border-purple-500/20 bg-purple-500/[0.02]">
            <div className="flex items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2 shrink-0">
                  <img src={astUSDC_Token?.logo} className="w-full h-full rounded-full" alt="" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white uppercase italic leading-none tracking-tight">
                    <span className="text-blue-400 lowercase text-[10px]">a</span>stUSDC
                  </span>
                  <span className="text-[8px] font-bold text-emerald-400/60 uppercase tracking-widest mt-1">Yield Bearing</span>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-around gap-6 overflow-hidden">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white tabular-nums leading-none">
                    {astUSDC_Bal.toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs text-white/30 uppercase tracking-tight italic">
                      <span className="text-blue-400 lowercase">a</span>stUSDC
                    </span>
                  </span>
                  <span className="text-[9px] font-bold text-white/20 tabular-nums mt-1">≈ ${stakedValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-emerald-400 tabular-nums leading-none">12.54%</span>
                  <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-1">APY</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-blue-400 tabular-nums leading-none">1.042x</span>
                  <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-1">MULT</span>
                </div>

                <div className="hidden sm:flex flex-col items-center">
                  <span className="text-xs font-black text-emerald-400/80 tabular-nums leading-none">0.00042 <span className="text-[8px] text-white/30 lowercase">/hr</span></span>
                  <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-1">EST. YIELD</span>
                </div>
              </div>

              <button 
                onClick={() => onTradeAction({ symbol: 'astUSDC' })}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white text-white hover:text-black border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0"
              >
                Manage
              </button>
            </div>
          </div>

          <div className="premium-card overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[9px] font-black text-white/20 uppercase">Pair</th>
                  <th className="py-4 px-4 text-[9px] font-black text-white/20 uppercase">Balance</th>
                  <th className="py-4 px-4 text-[9px] font-black text-white/20 uppercase">Value</th>
                  <th className="py-4 px-4 text-[9px] font-black text-white/20 uppercase">APR</th>
                  <th className="py-4 px-6 text-right text-[9px] font-black text-white/20 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {poolDetails.length > 0 ? poolDetails.map((pool, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-1.5 group-hover:-space-x-0.5 transition-all duration-300">
                          <img src={pool.pair[0].logo} className="w-6 h-6 rounded-full border border-[#0a0a0a]" />
                          <img src={pool.pair[1].logo} className="w-6 h-6 rounded-full border border-[#0a0a0a]" />
                        </div>
                        <span className="text-[11px] font-black text-white uppercase">
                          <FormatSymbol symbol={pool.pair[0].symbol} /> / <FormatSymbol symbol={pool.pair[1].symbol} />
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[10px] font-black text-white tabular-nums">{parseFloat(pool.lpBalance).toFixed(6)}</td>
                    <td className="py-4 px-4 text-[10px] font-black text-emerald-400">${pool.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 text-[10px] font-black text-emerald-400">{pool.apr}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Earning
                      </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-5 py-16 text-center"><div className="flex flex-col items-center gap-3 opacity-20"><Wallet size={32} /><span className="text-[10px] font-black uppercase tracking-[0.4em]">No active positions</span></div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
