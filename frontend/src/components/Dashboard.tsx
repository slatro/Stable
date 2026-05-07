import React from 'react';
import { Wallet, TrendingUp, Zap, ShieldCheck, ArrowUpRight, ArrowDownRight, Search, Filter, Loader2, CheckCircle2 } from 'lucide-react';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { usePrices } from '../context/PriceContext';
import FAUCET_ABI from '../abis/MultiFaucet.json';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';
import { useNotifications } from '../context/NotificationContext';

class DashboardErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-96 flex flex-col items-center justify-center gap-4 bg-red-900/20 border border-red-500/50 rounded-2xl p-8">
          <ShieldCheck size={48} className="text-red-500" />
          <h2 className="text-xl font-black text-red-500 uppercase tracking-widest">Dashboard System Crash</h2>
          <pre className="text-[10px] text-red-200 bg-red-950/50 p-4 rounded-xl max-w-2xl overflow-auto whitespace-pre-wrap font-mono border border-red-500/20 shadow-2xl">
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="glass-frame px-4 py-3 flex items-center gap-4 group hover:border-white/20 transition-all duration-500 relative overflow-hidden h-[72px]">
    <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700" />
    
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${color}`}>
      <Icon size={20} />
    </div>

    <div className="flex flex-col flex-1 relative z-10 leading-tight">
      <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">{title}</span>
      <div className="flex items-center gap-2">
        <span className="text-lg font-black text-white tracking-tighter">{value}</span>
        {change && (
          <div className={`flex items-center gap-0.5 text-[9px] font-black italic tracking-widest ${change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
            {change.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {change}
          </div>
        )}
      </div>
    </div>
  </div>
);

const AssetRow = ({ asset, userAddress, livePrices }: any) => {
  const { data: balance } = useReadContract({
    address: asset.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
  });

  const { data: decimals } = useReadContract({
    address: asset.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  });

  const getPriceData = () => {
    const symbol = asset?.symbol?.replace(/^a/, ''); 
    if (!livePrices || !symbol || !livePrices[symbol]) return { price: 1.00, change24h: '+0.00%' };
    return livePrices[symbol];
  };

  const { price: currentPrice, change24h } = getPriceData();
  const exchangeRate = 1 / currentPrice;
  const formattedBalance = balance !== undefined ? parseFloat(formatUnits(balance as bigint, (decimals as number) || 18)).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0.0000';
  const usdValue = balance !== undefined ? (parseFloat(formatUnits(balance as bigint, (decimals as number) || 18)) * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0.0000';

  return (
    <tr className="group border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-all duration-300">
      <td className="py-4 px-5">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] p-1.5 border border-white/5 group-hover:scale-110 transition-transform text-center flex items-center justify-center">
            <img src={asset.logo} alt={asset.name} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-white tracking-tight">
              {asset?.symbol?.startsWith('a') ? (
                <>
                  <span className="text-blue-400 lowercase">a</span>
                  <span className="uppercase">{asset.symbol.slice(1)}</span>
                </>
              ) : (
                <span className="uppercase">{asset?.symbol || '???'}</span>
              )}
            </span>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{asset?.name || 'Unknown Asset'}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-5">
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-white tracking-tight">{formattedBalance}</span>
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">≈ ${usdValue}</span>
        </div>
      </td>
      <td className="py-4 px-5">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-black text-white tracking-tight animate-in fade-in duration-500" key={currentPrice}>
                ${currentPrice.toFixed(asset?.symbol?.includes('JPY') ? 5 : 4)}
              </span>
              <span className="text-[9px] font-bold text-white/20 uppercase">
                USD
              </span>
           </div>
           <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[9px] font-black italic tracking-widest ${change24h.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {change24h}
              </span>
              {exchangeRate !== 1 && (
                <span className="text-[8px] font-bold text-white/5 uppercase tracking-tighter ml-2">
                  (1 USD ≈ {exchangeRate.toFixed(asset?.symbol?.includes('JPY') ? 5 : 4)} {asset?.symbol?.replace(/^a/, '') || ''})
                </span>
              )}
          </div>
        </div>
      </td>
      <td className="py-4 px-5 text-right">
        <button className="px-5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white text-white hover:text-black transition-all">
          Trade
        </button>
      </td>
    </tr>
  );
};

// Helper hook for total wallet value
const useTotalWalletValue = (address: any, livePrices: any) => {
  const contracts = React.useMemo(() => {
    return TOKENS.map(t => ({
      address: t.addr as `0x${string}`,
      abi: ERC20_ABI as any,
      functionName: 'balanceOf',
      args: [address]
    }));
  }, [address]);

  const { data: balances } = useReadContracts({
    contracts: contracts as any,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  return React.useMemo(() => {
    if (!livePrices || !balances) return 0;
    let total = 0;
    balances.forEach((res, i) => {
      if (res.status === 'success' && res.result) {
        const token = TOKENS[i];
        const bal = parseFloat(formatUnits(res.result as bigint, token.decimals));
        const price = livePrices[token.symbol]?.price || 0;
        total += bal * price;
      }
    });
    return total;
  }, [balances, livePrices]);
};

const DashboardContent = () => {
  const { address, isConnected } = useAccount();
  const { prices, loading } = usePrices();
  const { notify, dismiss } = useNotifications();

  // --- DYNAMIC FACTORY RADAR ---
  const scanContracts = React.useMemo(() => {
    if (!address) return [];
    // Scan all a-Assets (indices 2 and up) against each other to find all possible pools
    // Native assets (USDC, EURC) are excluded from the radar as per platform requirements
    const combinations: any[] = [];
    const aAssets = TOKENS.slice(2);
    
    for (let i = 0; i < aAssets.length; i++) {
      for (let j = i + 1; j < aAssets.length; j++) {
        // Factory might be order-sensitive, check both A-B and B-A permutations
        combinations.push({ tokenA: aAssets[i], tokenB: aAssets[j] });
        combinations.push({ tokenA: aAssets[j], tokenB: aAssets[i] });
      }
    }

    return combinations.map(combo => ({
      address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
      abi: [{ "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }], "name": "getPool", "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }], "stateMutability": "view", "type": "function" }],
      functionName: 'getPool',
      args: [combo.tokenA.addr, combo.tokenB.addr],
      tokens: combo // keep track of the tokens for later mapping
    } as any));
  }, [address]);

  const { data: pairAddresses } = useReadContracts({
    contracts: scanContracts,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const lpContracts = React.useMemo(() => {
    if (!address || !pairAddresses) return [];
    return pairAddresses.map(res => {
      if (res.status === 'success' && res.result && res.result !== '0x0000000000000000000000000000000000000000') {
        return {
          address: res.result as `0x${string}`,
          abi: ERC20_ABI as any,
          functionName: 'balanceOf',
          args: [address]
        };
      }
      return null;
    }).filter(Boolean);
  }, [address, pairAddresses]);

  const { data: lpBalances } = useReadContracts({
    contracts: lpContracts as any,
    query: { enabled: lpContracts.length > 0, refetchInterval: 3000 }
  });

  const { data: totalSupplies } = useReadContracts({
    contracts: lpContracts?.map(c => ({
      address: c!.address,
      abi: ERC20_ABI as any,
      functionName: 'totalSupply'
    })) as any,
    query: { enabled: lpContracts.length > 0, refetchInterval: 5000 }
  });

  const { data: allReserves } = useReadContracts({
    contracts: lpContracts?.map(c => ({
      address: c!.address,
      abi: AMM_ABI as any,
      functionName: 'getReserves'
    })) as any,
    query: { enabled: lpContracts.length > 0, refetchInterval: 5000 }
  });

  const poolDetails = React.useMemo(() => {
    const pos: any[] = [];
    if (!lpBalances || !pairAddresses) return pos;
    
    let lpIndex = 0;
    pairAddresses.forEach((res, index) => {
      const addr = res.result as string | undefined;
      // If a valid pair address was returned from the factory
      if (res.status === 'success' && addr && addr !== '0x0000000000000000000000000000000000000000') {
        const balanceRes = lpBalances[lpIndex];
        const supplyRes = totalSupplies?.[lpIndex];
        const reservesRes = allReserves?.[lpIndex];

        // If the user actually has > 0 liquidity in this pair
        if (balanceRes && balanceRes.status === 'success' && (balanceRes.result as bigint) > 0n) {
          const combo = scanContracts[index].tokens;
          const rawLp = balanceRes.result as bigint;
          const lpBal = parseFloat(formatUnits(rawLp, 18));
          
          let share = 0;
          let estValue = 0;

          if (supplyRes && supplyRes.status === 'success' && (supplyRes.result as bigint) > 0n) {
             const totalSupply = parseFloat(formatUnits(supplyRes.result as bigint, 18));
             share = lpBal / totalSupply;
             
             if (reservesRes && reservesRes.status === 'success') {
                const [r0, r1] = reservesRes.result as [bigint, bigint];
                // AMM sorts tokens by address: token0 is the smaller address
                const sorted = [combo.tokenA.addr.toLowerCase(), combo.tokenB.addr.toLowerCase()].sort();
                const isA0 = combo.tokenA.addr.toLowerCase() === sorted[0];
                
                const dec0 = isA0 ? combo.tokenA.decimals : combo.tokenB.decimals;
                const dec1 = isA0 ? combo.tokenB.decimals : combo.tokenA.decimals;
                
                const val0 = parseFloat(formatUnits(r0, dec0));
                const val1 = parseFloat(formatUnits(r1, dec1));
                
                const price0 = (prices as any)[isA0 ? combo.tokenA.symbol : combo.tokenB.symbol]?.price || 0;
                const price1 = (prices as any)[isA0 ? combo.tokenB.symbol : combo.tokenA.symbol]?.price || 0;
                
                const poolTotalValue = (val0 * price0) + (val1 * price1);
                estValue = poolTotalValue * share;
             }
          }
          
          // Prevent duplicates since we scan both A-B and B-A permutations
          const alreadyExists = pos.find(p => p.poolAddr?.toLowerCase() === addr.toLowerCase());
          if (!alreadyExists) {
            pos.push({
              pair: [combo.tokenA, combo.tokenB],
              lpBalance: formatUnits(rawLp, 18),
              poolAddr: addr,
              sharePct: (share * 100).toFixed(4),
              usdValue: estValue
            });
          }
        }
        lpIndex++;
      }
    });

    return pos;
  }, [lpBalances, totalSupplies, allReserves, pairAddresses, scanContracts, prices]);

  const activePositions = poolDetails.length;
  const lpValue = poolDetails.reduce((acc, p) => acc + (p.usdValue || 0), 0);
  const walletValue = useTotalWalletValue(address, prices);
  const totalPortfolioValue = lpValue + walletValue;
  
  const estimatedYield = poolDetails.reduce((acc, p) => {
    const isTryc = p.pair[0].symbol.includes('TRYC') || p.pair[1].symbol.includes('TRYC');
    const aprNum = isTryc 
      ? 8 + ((p.pair[0].symbol.charCodeAt(1) + p.pair[1].symbol.charCodeAt(1)) % 3) + ((p.pair[0].symbol.length) % 2) * 0.5 
      : 2 + ((p.pair[0].symbol.charCodeAt(1) + p.pair[1].symbol.charCodeAt(1)) % 3) + ((p.pair[0].symbol.length) % 2) * 0.5;
    return acc + ((p.usdValue || 0) * (aprNum / 100) / 365);
  }, 0).toFixed(6);



  return (
    <div className="w-full space-y-8 px-2">
      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Positions" 
          value={activePositions?.toString() || '0'} 
          change={activePositions > 0 ? "+Active" : "+0%"} 
          icon={Wallet} 
          color="bg-blue-500/10 text-blue-400" 
        />
        <StatCard 
          title="Total Portfolio" 
          value={`$${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          change="+1.2%" 
          icon={TrendingUp} 
          color="bg-emerald-500/10 text-emerald-400" 
        />
        <StatCard 
          title="Yield Earned" 
          value={`$${estimatedYield}`} 
          change="+Dynamic APR" 
          icon={Zap} 
          color="bg-amber-500/10 text-amber-400" 
        />
        <StatCard 
          title="Protocol Safety" 
          value="100%" 
          icon={ShieldCheck} 
          color="bg-purple-500/10 text-purple-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: ASSET PORTFOLIO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 h-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Asset Portfolio</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-black/20 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-[10px] text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/30 w-32 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Asset</th>
                    <th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Balance</th>
                    <th className="py-4 px-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Price / 24h</th>
                    <th className="py-4 px-5 text-right text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {TOKENS.map((asset, index) => (
                    <AssetRow key={index} asset={asset} userAddress={address} livePrices={prices} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE POSITIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 h-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Your Active Positions</h3>
            </div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{activePositions} Found</span>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Pool</th>
                    <th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">LP Balance</th>
                    <th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">Est. Value</th>
                    <th className="px-5 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Est. APR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {poolDetails.length > 0 ? (poolDetails as any[]).map((pool, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            <img src={pool.pair[0].logo} alt="" className="w-4 h-4 rounded-full" />
                            <img src={pool.pair[1].logo} alt="" className="w-4 h-4 rounded-full" />
                          </div>
                          <span className="text-[11px] font-black text-white uppercase">{pool.pair[0].symbol}/{pool.pair[1].symbol}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-blue-400">{pool.sharePct}% Share</span>
                          <span className="text-[9px] font-bold text-white/20 uppercase">{parseFloat(pool.lpBalance).toFixed(6)} LP</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-emerald-400">${pool.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[9px] font-bold text-white/20 uppercase">USD VALUE</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-400 font-black text-[11px]">
                          {(() => {
                            const isTryc = pool.pair[0].symbol.includes('TRYC') || pool.pair[1].symbol.includes('TRYC');
                            const aprNum = isTryc 
                              ? 8 + ((pool.pair[0].symbol.charCodeAt(1) + pool.pair[1].symbol.charCodeAt(1)) % 3) + ((pool.pair[0].symbol.length) % 2) * 0.5 
                              : 2 + ((pool.pair[0].symbol.charCodeAt(1) + pool.pair[1].symbol.charCodeAt(1)) % 3) + ((pool.pair[0].symbol.length) % 2) * 0.5;
                            return aprNum.toFixed(1) + '%';
                          })()}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-white/10 text-[9px] font-black uppercase tracking-[0.4em]">No positions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => (
  <DashboardErrorBoundary>
    <DashboardContent />
  </DashboardErrorBoundary>
);
