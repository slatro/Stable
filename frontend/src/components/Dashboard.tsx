import React from 'react';
import { Wallet, TrendingUp, Zap, ShieldCheck, ArrowUpRight, ArrowDownRight, Search, Filter, Loader2, CheckCircle2 } from 'lucide-react';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { usePrices } from '../context/PriceContext';
import FAUCET_ABI from '../abis/MultiFaucet.json';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';
import POINTS_ABI from '../abis/ArcPoints.json';
import { useNotifications } from '../context/NotificationContext';

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

const AssetRow = ({ asset, balance, price, change24h, exchangeRate, onAction }: any) => {
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
        <button onClick={() => onAction(asset)} className={`px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isNative ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-white/[0.05] border-white/10 text-white/40 hover:bg-white hover:text-black'}`}>{isNative ? 'Stake' : 'Trade'}</button>
      </td>
    </tr>
  );
};

const useTotalWalletValue = (balances: any, livePrices: any, nativeBalances: any) => {
  return React.useMemo(() => {
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
  const { address, isConnected } = useAccount();
  const priceContext = usePrices();
  const prices = priceContext?.prices || {};

  const balanceContracts = React.useMemo(() => {
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

  const scanContracts = React.useMemo(() => {
    if (!address) return [];
    const combinations: any[] = [];
    const aAssets = TOKENS.slice(2);
    for (let i = 0; i < aAssets.length; i++) {
      for (let j = i + 1; j < aAssets.length; j++) {
        combinations.push({ tokenA: aAssets[i], tokenB: aAssets[j] });
        combinations.push({ tokenA: aAssets[j], tokenB: aAssets[i] });
      }
    }
    return combinations.map(combo => ({
      address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
      abi: [{ "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }], "name": "getPool", "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }], "stateMutability": "view", "type": "function" }],
      functionName: 'getPool',
      args: [combo.tokenA.addr, combo.tokenB.addr],
      tokens: combo
    } as any));
  }, [address]);

  const { data: pairAddresses } = useReadContracts({ contracts: scanContracts, query: { enabled: !!address, refetchInterval: 5000 } });

  const lpContracts = React.useMemo(() => {
    if (!address || !pairAddresses) return [];
    return pairAddresses.map(res => {
      const addr = res.result as string | undefined;
      if (res.status === 'success' && addr && addr !== '0x0000000000000000000000000000000000000000') {
        return { address: addr as `0x${string}`, abi: ERC20_ABI.abi || ERC20_ABI as any, functionName: 'balanceOf', args: [address] };
      }
      return null;
    }).filter(Boolean);
  }, [address, pairAddresses]);

  const { data: lpBalances } = useReadContracts({ contracts: lpContracts as any, query: { enabled: lpContracts.length > 0, refetchInterval: 3000 } });
  const { data: totalSupplies } = useReadContracts({ contracts: lpContracts?.map(c => ({ address: c!.address, abi: ERC20_ABI.abi || ERC20_ABI as any, functionName: 'totalSupply' })) as any, query: { enabled: lpContracts.length > 0, refetchInterval: 5000 } });
  const { data: allReserves } = useReadContracts({ contracts: lpContracts?.map(c => ({ address: c!.address, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'getReserves' })) as any, query: { enabled: lpContracts.length > 0, refetchInterval: 5000 } });

  const poolDetails = React.useMemo(() => {
    const pos: any[] = [];
    if (!lpBalances || !pairAddresses || !Array.isArray(pairAddresses)) return pos;
    let lpIndex = 0;
    pairAddresses.forEach((res, index) => {
      const addr = res.result as string | undefined;
      if (res.status === 'success' && addr && addr !== '0x0000000000000000000000000000000000000000') {
        const balanceRes = lpBalances?.[lpIndex];
        const supplyRes = totalSupplies?.[lpIndex];
        const reservesRes = allReserves?.[lpIndex];
        if (balanceRes && balanceRes.status === 'success' && balanceRes.result !== undefined) {
          try {
            const rawLp = BigInt(balanceRes.result.toString());
            if (rawLp > 0n) {
              const lpBal = parseFloat(formatUnits(rawLp, 18));
              const combo = scanContracts[index].tokens;
              let share = 0; let estValue = 0;
              if (supplyRes && supplyRes.status === 'success' && supplyRes.result !== undefined) {
                const rawSupply = BigInt(supplyRes.result.toString());
                if (rawSupply > 0n) {
                  share = lpBal / parseFloat(formatUnits(rawSupply, 18));
                  if (reservesRes && reservesRes.status === 'success' && reservesRes.result !== undefined) {
                    const [r0, r1] = reservesRes.result as [bigint, bigint];
                    const sorted = [combo.tokenA.addr?.toLowerCase(), combo.tokenB.addr?.toLowerCase()].sort();
                    const isA0 = combo.tokenA.addr?.toLowerCase() === sorted[0];
                    const val0 = parseFloat(formatUnits(r0, (isA0 ? combo.tokenA.decimals : combo.tokenB.decimals) || 18));
                    const val1 = parseFloat(formatUnits(r1, (isA0 ? combo.tokenB.decimals : combo.tokenA.decimals) || 18));
                    const price0 = prices ? ((prices as any)[isA0 ? combo.tokenA.symbol : combo.tokenB.symbol]?.price || 0) : 0;
                    const price1 = prices ? ((prices as any)[isA0 ? combo.tokenB.symbol : combo.tokenA.symbol]?.price || 0) : 0;
                    estValue = ((val0 * price0) + (val1 * price1)) * share;
                  }
                }
              }
              if (!pos.find(p => p.poolAddr?.toLowerCase() === addr.toLowerCase())) {
                pos.push({ pair: [combo.tokenA, combo.tokenB], lpBalance: lpBal.toFixed(6), poolAddr: addr, sharePct: (share * 100).toFixed(4), usdValue: estValue });
              }
            }
          } catch (e) { console.error("Pool detail error:", e); }
        }
        lpIndex++;
      }
    });
    return pos;
  }, [lpBalances, pairAddresses, totalSupplies, allReserves, scanContracts, prices]);

  const activePositions = poolDetails.length;
  const lpValue = poolDetails.reduce((acc, p) => acc + (p.usdValue || 0), 0);
  const walletValue = useTotalWalletValue(balances, prices, { usdc: usdcNativeBal, eurc: eurcNativeBal });
  const totalPortfolioValue = lpValue + walletValue;
  
  const estimatedYield = poolDetails.reduce((acc, p) => {
    const isTryc = p.pair[0].symbol.includes('TRYC') || p.pair[1].symbol.includes('TRYC');
    const apr = isTryc ? 11.45 : 3.24;
    return acc + ((p.usdValue || 0) * (apr / 100) / 365);
  }, 0).toFixed(6);

  const { data: userPoints } = useReadContract({ address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`, abi: POINTS_ABI.abi as any, functionName: 'getUserPoints', args: address ? [address] : undefined, query: { enabled: !!address, refetchInterval: 10000 } });

  return (
    <div className="w-full space-y-8 px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="ARC POINTS" value={userPoints !== undefined ? userPoints.toString() : '...'} isSpecial={true} color="bg-blue-500/10 text-blue-400" />
        <StatCard title="PORTFOLIO VALUE" value={`$${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change="+1.2%" icon={TrendingUp} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard title="YIELD EARNED" value={`$${estimatedYield}`} icon={Zap} color="bg-amber-500/10 text-amber-400" />
        <StatCard title="ACTIVE POSITIONS" value={activePositions?.toString() || '0'} icon={Wallet} color="bg-purple-500/10 text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2 h-8"><div className="w-1.5 h-6 bg-emerald-500 rounded-full" /><h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Asset Portfolio</h3></div>
          <div className="premium-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/5 bg-white/[0.02]"><th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase">Asset</th><th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase">Balance</th><th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase">Price</th><th className="py-4 px-5 text-right text-[10px] font-black text-white/20 uppercase">Actions</th></tr></thead>
              <tbody>
                {TOKENS.map((token, i) => {
                  const priceData = (prices as any)[token.symbol] || { price: 1, change24h: '+0.00%' };
                  let formattedBal = '0.00';
                  if (token.symbol === 'USDC' && usdcNativeBal) formattedBal = parseFloat(formatUnits(usdcNativeBal.value, usdcNativeBal.decimals)).toFixed(4);
                  else if (token.symbol === 'EURC' && eurcNativeBal !== undefined) formattedBal = parseFloat(formatUnits(BigInt(eurcNativeBal.toString()), 18)).toFixed(4);
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
          <div className="flex items-center gap-3 px-2 h-8"><div className="w-1.5 h-6 bg-blue-500 rounded-full" /><h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Active Positions</h3></div>
          <div className="premium-card overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="border-b border-white/5 bg-white/[0.02]"><th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase">Pool</th><th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase">LP Balance</th><th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase">Value</th><th className="px-5 py-4 text-right text-[10px] font-black text-white/30 uppercase">APR</th></tr></thead>
              <tbody className="divide-y divide-white/[0.02]">
                {poolDetails.length > 0 ? poolDetails.map((pool, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="flex -space-x-1"><img src={pool.pair[0].logo} className="w-4 h-4 rounded-full" /><img src={pool.pair[1].logo} className="w-4 h-4 rounded-full" /></div><span className="text-[11px] font-black text-white uppercase">{pool.pair[0].symbol}/{pool.pair[1].symbol}</span></div></td>
                    <td className="px-4 py-3 flex flex-col"><span className="text-[11px] font-black text-blue-400">{pool.sharePct}%</span><span className="text-[9px] font-bold text-white/20 uppercase">{pool.lpBalance} LP</span></td>
                    <td className="px-4 py-3 flex flex-col"><span className="text-[11px] font-black text-emerald-400">${pool.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><span className="text-[9px] font-bold text-white/20 uppercase">USD</span></td>
                    <td className="px-4 py-3 text-right"><span className="text-emerald-400 font-black text-[11px]">{(pool.pair[0].symbol.includes('TRYC') || pool.pair[1].symbol.includes('TRYC')) ? '11.5%' : '3.2%'}</span></td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-5 py-10 text-center text-white/10 text-[9px] font-black uppercase tracking-[0.4em]">No positions</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
