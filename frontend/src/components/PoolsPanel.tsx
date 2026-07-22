import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Plus, Check, ChevronDown, Wallet, ArrowLeft, RefreshCw, Layers, Droplets, ExternalLink, AlertTriangle, Search, Info } from 'lucide-react';
import { useReadContract, useReadContracts, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useAccount, useWriteContract } from '../hooks/web3';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { CONTRACT_ADDRESSES, TOKENS, ARC_TESTNET_CONFIG } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import ERC20_ABI from '../abis/ERC20.json';
import { usePrices } from '../context/PriceContext';
import { useNotifications } from '../context/NotificationContext';
import { triggerIsland } from './TransactionIsland';
import { useSound } from '../context/SoundContext';
import Chart from 'react-apexcharts';

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

const TokenInputSection = ({ 
  label, amount, onAmountChange, selectedToken, onTokenSelect, tokens, otherToken, address, onUpdateState
}: any) => {
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: (selectedToken?.addr || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: ERC20_ABI.abi || ERC20_ABI as any,
    functionName: 'balanceOf',
    args: address && selectedToken?.addr ? [address] : undefined,
    query: { enabled: !!address && !!selectedToken?.addr, refetchInterval: 5000 }
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: (selectedToken?.addr || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: ERC20_ABI.abi || ERC20_ABI as any,
    functionName: 'allowance',
    args: address && selectedToken?.addr ? [address, CONTRACT_ADDRESSES.ROUTER] : undefined,
    query: { enabled: !!address && !!selectedToken?.addr, refetchInterval: 5000 }
  });

  const parsedAmount = useMemo(() => {
    if (!amount || !selectedToken?.decimals || isNaN(parseFloat(amount)) || amount === '.') return 0n;
    try { return parseUnits(amount, selectedToken.decimals); } catch (e) { return 0n; }
  }, [amount, selectedToken]);

  const insufficient = useMemo(() => {
    if (!address || balance === undefined || balance === null || !selectedToken) return false;
    try { return BigInt(balance.toString()) < parsedAmount; } catch (e) { return false; }
  }, [address, balance, parsedAmount, selectedToken]);

  const needsApprove = useMemo(() => {
    if (!address || allowance === undefined || allowance === null || !selectedToken || parsedAmount === 0n) return false;
    try { return BigInt(allowance.toString()) < parsedAmount; } catch (e) { return false; }
  }, [address, allowance, parsedAmount, selectedToken]);

  useEffect(() => {
    if (onUpdateState) onUpdateState({ insufficient, needsApprove, balance, allowance, selectedToken, refetchAllowance, refetchBalance });
  }, [insufficient, needsApprove, balance, allowance, selectedToken, onUpdateState]);

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 flex flex-col gap-1 relative">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{label}</span>
        <div className="relative">
          <button onClick={() => setIsSelectOpen(!isSelectOpen)} className="flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all group w-[130px] justify-between">
            <div className="flex items-center gap-2">
              {selectedToken ? (
                <>
                  <img src={selectedToken.logo} alt="" className="w-4 h-4 rounded-full" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">{selectedToken.symbol}</span>
                </>
              ) : <span className="text-[10px] font-black text-white/30 uppercase">Select</span>}
            </div>
            <ChevronDown size={12} className="text-white/20 group-hover:text-white transition-all" />
          </button>
          {isSelectOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[110%] w-[130px] bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1">
              <div className="flex flex-col">
                {(tokens || []).map((t: any) => {
                  const isSelected = selectedToken?.symbol === t.symbol;
                  const isOther = otherToken?.symbol === t.symbol;
                  return (
                    <button key={t.symbol} disabled={isOther} onClick={() => { onTokenSelect(t); setIsSelectOpen(false); }} className={`w-full py-1.5 px-2.5 flex items-center justify-between hover:bg-white/5 rounded-lg transition-all group ${isOther ? 'opacity-20 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center gap-2">
                        <img src={t.logo} alt="" className="w-4 h-4 rounded-full" />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-400' : 'text-white/50 group-hover:text-white'}`}>{t.symbol}</span>
                      </div>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-end">
        <input type="text" value={amount} onChange={(e) => onAmountChange(e.target.value)} placeholder="0.00" className="bg-transparent border-none outline-none text-lg font-black text-white w-2/3 p-0 placeholder:text-white/5" />
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Balance</span>
          <span className="text-[10px] font-black text-white/60 tabular-nums">
            {balance !== undefined ? parseFloat(formatUnits(balance as bigint, selectedToken?.decimals || 18)).toLocaleString(undefined, { maximumFractionDigits: 5 }) : '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PoolsPanel = () => {
  const { address } = useAccount();
  const { prices } = usePrices();
  const { notify, dismiss } = useNotifications();
  const { play } = useSound();
  const [view, setView] = useState<'list' | 'add' | 'remove'>('list');
  const [hideToggle, setHideToggle] = useState(false);
  
  const [tokenA, setTokenA] = useState<any>(TOKENS[3]);
  const [tokenB, setTokenB] = useState<any>(TOKENS[4]); 
  
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePercent, setRemovePercent] = useState(50);
  const [stateA, setStateA] = useState<any>({});
  const [stateB, setStateB] = useState<any>({});
  const [activeTid, setActiveTid] = useState<string | null>(null);

  const { data: hash, writeContract: writeAction } = useWriteContract();
  const { isLoading: isWaiting, data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [lastApprovalHash, setLastApprovalHash] = useState<string | null>(null);
  const [recentTxHash, setRecentTxHash] = useState<string | null>(null);
  const processedHash = useRef<string | null>(null);

  // --- CRITICAL: FIND REAL FACTORY FROM ROUTER ---
  const { data: routerFactory } = useReadContract({
    address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`,
    abi: ROUTER_ABI.abi || ROUTER_ABI as any,
    functionName: 'factory',
    query: { refetchInterval: 100000 }
  });

  const activeFactory = useMemo(() => (routerFactory as string) || CONTRACT_ADDRESSES.FACTORY, [routerFactory]);

  const PLATFORM_POOLS = useMemo(() => {
    const ausdc = TOKENS.find(t => t.symbol === 'aUSDC');
    const aeurc = TOKENS.find(t => t.symbol === 'aEURC');
    const atryc = TOKENS.find(t => t.symbol === 'aTRYC');
    const agbpc = TOKENS.find(t => t.symbol === 'aGBPC');
    const ajpyc = TOKENS.find(t => t.symbol === 'aJPYC');
    return [
      { tokens: [ausdc, aeurc], apr: "3.24%", tvl: "$12.4M" },
      { tokens: [ausdc, agbpc], apr: "2.85%", tvl: "$8.1M" },
      { tokens: [ausdc, ajpyc], apr: "3.12%", tvl: "$6.2M" },
      { tokens: [ausdc, atryc], apr: "11.45%", tvl: "$4.8M" }
    ];
  }, []);

  const validTokens = useMemo(() => TOKENS.filter(t => t?.symbol?.startsWith('a') && !['astUSDC'].includes(t?.symbol || '')), []);

  // --- Global Scan ---
  const { data: poolsLength, refetch: refetchPoolsLength } = useReadContract({
    address: activeFactory as `0x${string}`,
    abi: FACTORY_ABI.abi || FACTORY_ABI as any,
    functionName: 'allPoolsLength',
    query: { refetchInterval: 10000 }
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

  const { data: poolAddressesRes, refetch: refetchPoolAddresses } = useReadContracts({ 
    contracts: poolAddressContracts as any,
    query: { enabled: poolAddressContracts.length > 0, refetchInterval: 10000 }
  });

  const poolAddresses = useMemo(() => {
    if (!poolAddressesRes) return [];
    return poolAddressesRes.filter((r: any) => r.status === 'success' && r.result).map((r: any) => r.result as `0x${string}`);
  }, [poolAddressesRes]);

  const poolMetadataContracts = useMemo(() => {
    if (!poolAddresses) return [];
    const calls: any[] = [];
    const userAddr = address || '0x0000000000000000000000000000000000000000';
    poolAddresses.forEach((addr) => {
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'token0' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'token1' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'liquidityShares', args: [userAddr] });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'reserve0' });
      calls.push({ address: addr, abi: AMM_ABI as any, functionName: 'reserve1' });
    });
    return calls;
  }, [poolAddresses, address]);

  const { data: poolMetadatas, refetch: refetchMetadatas } = useReadContracts({
    contracts: poolMetadataContracts as any,
    query: { enabled: poolMetadataContracts.length > 0, refetchInterval: 5000 }
  });

  const allPoolsWithData = useMemo(() => {
    if (!poolMetadatas || !poolAddresses) return [];
    const pools: any[] = [];
    for (let i = 0; i < poolAddresses.length; i++) {
      const baseIdx = i * 5;
      const t0Res = poolMetadatas[baseIdx];
      const t1Res = poolMetadatas[baseIdx + 1];
      const balRes = poolMetadatas[baseIdx + 2];
      const r0Res = poolMetadatas[baseIdx + 3];
      const r1Res = poolMetadatas[baseIdx + 4];
      if (t0Res?.status === 'success' && t1Res?.status === 'success') {
        const t0Addr = t0Res.result as string;
        const t1Addr = t1Res.result as string;
        const balance = balRes?.status === 'success' ? balRes.result as bigint : 0n;
        const r0 = r0Res?.status === 'success' ? r0Res.result as bigint : 0n;
        const r1 = r1Res?.status === 'success' ? r1Res.result as bigint : 0n;
        if (t0Addr && t1Addr) {
          const t0 = TOKENS.find(t => t.addr.toLowerCase() === t0Addr.toLowerCase());
          const t1 = TOKENS.find(t => t.addr.toLowerCase() === t1Addr.toLowerCase());
          if (t0 && t1) {
            const addr = poolAddresses[i];
            const isTryc = t0.symbol.includes('TRYC') || t1.symbol.includes('TRYC');
            const randomVal = parseInt(addr.slice(2, 6), 16) / 65535;
            const apr = isTryc ? (9 + (isNaN(randomVal) ? 0 : randomVal) * 3).toFixed(2) + '%' : (2 + (isNaN(randomVal) ? 0 : randomVal) * 2).toFixed(2) + '%';
            
            // Calculate TVL dynamically
            const price0 = prices[t0.symbol]?.price || 1;
            const price1 = prices[t1.symbol]?.price || 1;
            const val0 = Number(formatUnits(r0, t0.decimals)) * price0;
            const val1 = Number(formatUnits(r1, t1.decimals)) * price1;
            const tvlNum = val0 + val1;
            
            pools.push({
              tokens: [t0, t1],
              balance,
              poolAddr: addr,
              apr,
              tvlNum,
              tvl: tvlNum > 0 ? `$${tvlNum.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '$0.00',
              r0,
              r1
            });
          }
        }
      }
    }
    return pools;
  }, [poolMetadatas, poolAddresses, prices]);

  const positions = useMemo(() => {
    return allPoolsWithData.filter(p => p.balance > 0n);
  }, [allPoolsWithData]);

  const displayPools = useMemo(() => {
    return allPoolsWithData.length > 0 ? allPoolsWithData : PLATFORM_POOLS;
  }, [allPoolsWithData, PLATFORM_POOLS]);

  const publicClient = usePublicClient();
  const [swapLogs, setSwapLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!publicClient || poolAddresses.length === 0) return;

    const fetchSwapLogs = async () => {
      try {
        const logsPromises = poolAddresses.map(pool => 
          publicClient.getLogs({
            address: pool,
            event: {
              type: 'event',
              name: 'Swap',
              inputs: [
                { type: 'address', name: 'sender', indexed: true },
                { type: 'uint256', name: 'amount0In' },
                { type: 'uint256', name: 'amount1In' },
                { type: 'uint256', name: 'amount0Out' },
                { type: 'uint256', name: 'amount1Out' },
                { type: 'address', name: 'to', indexed: true }
              ]
            } as any,
            fromBlock: 'earliest'
          })
        );
        const results = await Promise.allSettled(logsPromises);
        const allLogs: any[] = [];
        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
            allLogs.push(...res.value);
          }
        });
        setSwapLogs(allLogs);
      } catch (err) {
        console.error("Failed to fetch swap logs:", err);
      }
    };

    fetchSwapLogs();
  }, [publicClient, poolAddresses]);

  // --- CROSS-LOOKUP POOL DISCOVERY ---
  const poolLookupContracts = useMemo(() => {
    if (!tokenA || !tokenB || !activeFactory) return [];
    return [
      { address: activeFactory as `0x${string}`, abi: FACTORY_ABI.abi || FACTORY_ABI as any, functionName: 'getPool', args: [tokenA.addr, tokenB.addr] },
      { address: activeFactory as `0x${string}`, abi: FACTORY_ABI.abi || FACTORY_ABI as any, functionName: 'getPool', args: [tokenB.addr, tokenA.addr] }
    ];
  }, [tokenA, tokenB, activeFactory]);

  const { data: lookupRes, refetch: refetchLookup } = useReadContracts({
    contracts: poolLookupContracts as any,
    query: { enabled: poolLookupContracts.length > 0, refetchInterval: 3000 }
  });

  const selectedPoolAddr = useMemo(() => {
    if (!lookupRes) return null;
    const addr1 = lookupRes[0]?.result as `0x${string}`;
    const addr2 = lookupRes[1]?.result as `0x${string}`;
    if (addr1 && addr1 !== '0x0000000000000000000000000000000000000000') return addr1;
    if (addr2 && addr2 !== '0x0000000000000000000000000000000000000000') return addr2;
    return null;
  }, [lookupRes]);

  const { data: currentPoolData, refetch: refetchCurrentPool } = useReadContracts({
    contracts: [
      { address: selectedPoolAddr as `0x${string}`, abi: AMM_ABI as any, functionName: 'token0' },
      { address: selectedPoolAddr as `0x${string}`, abi: AMM_ABI as any, functionName: 'reserve0' },
      { address: selectedPoolAddr as `0x${string}`, abi: AMM_ABI as any, functionName: 'reserve1' },
      { address: selectedPoolAddr as `0x${string}`, abi: AMM_ABI as any, functionName: 'totalLiquidity' },
      { address: selectedPoolAddr as `0x${string}`, abi: AMM_ABI as any, functionName: 'liquidityShares', args: [address] },
    ],
    query: { enabled: !!selectedPoolAddr && !!address, refetchInterval: 2000 }
  });

  const userLPBalance = useMemo(() => {
    if (currentPoolData && currentPoolData[4]?.status === 'success') {
      return currentPoolData[4].result as bigint;
    }
    const p = positions.find(pos => pos.poolAddr.toLowerCase() === selectedPoolAddr?.toLowerCase());
    return p ? p.balance : 0n;
  }, [currentPoolData, positions, selectedPoolAddr]);

  const removeAmounts = useMemo(() => {
    if (!currentPoolData || !userLPBalance || removePercent <= 0) return { a: '0', b: '0' };
    const r0 = currentPoolData[1]?.result as bigint;
    const r1 = currentPoolData[2]?.result as bigint;
    const ts = currentPoolData[3]?.result as bigint;
    const t0 = currentPoolData[0]?.result as string;
    if (!r0 || !r1 || !ts || ts === 0n) return { a: '0', b: '0' };
    const liquidityToRemove = (userLPBalance * BigInt(removePercent)) / 100n;
    const amt0 = (liquidityToRemove * r0) / ts;
    const amt1 = (liquidityToRemove * r1) / ts;
    const isA0 = tokenA?.addr.toLowerCase() === t0?.toLowerCase();
    const [amtA, amtB] = isA0 ? [amt0, amt1] : [amt1, amt0];
    return { a: formatUnits(amtA, tokenA?.decimals || 18), b: formatUnits(amtB, tokenB?.decimals || 18) };
  }, [currentPoolData, userLPBalance, removePercent, tokenA, tokenB]);

  const calculateRatio = useCallback((val: string, fromToken: any, toToken: any) => {
    if (!val || isNaN(parseFloat(val)) || !fromToken || !toToken) return '';
    if (currentPoolData && currentPoolData[1]?.status === 'success' && currentPoolData[2]?.status === 'success' && currentPoolData[1].result && currentPoolData[2].result) {
      const res0 = currentPoolData[1].result as bigint;
      const res1 = currentPoolData[2].result as bigint;
      const t0 = currentPoolData[0]?.result as string;
      if (res0 > 0n && res1 > 0n && t0) {
        const isFrom0 = fromToken.addr.toLowerCase() === t0.toLowerCase();
        const [resFrom, resTo] = isFrom0 ? [res0, res1] : [res1, res0];
        try {
          const pFrom = parseUnits(val, fromToken.decimals);
          const pTo = (pFrom * resTo) / resFrom;
          const formatted = formatUnits(pTo, toToken.decimals);
          // TRUNCATE TO 5 DECIMALS
          const parts = formatted.split('.');
          return parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 5)}` : formatted;
        } catch (e) {}
      }
    }
    if (prices && prices[fromToken.symbol] && prices[toToken.symbol]) {
      try {
        const priceFrom = prices[fromToken.symbol].price;
        const priceTo = prices[toToken.symbol].price;
        if (priceTo > 0) {
          const amountToVal = (parseFloat(val) * priceFrom) / priceTo;
          return amountToVal.toFixed(5);
        }
      } catch (e) {}
    }
    return '';
  }, [currentPoolData, prices]);

  const handleAmountAChange = (val: string) => {
    setAmountA(val);
    setRecentTxHash(null);
    const calculatedB = calculateRatio(val, tokenA, tokenB);
    if (calculatedB !== undefined) setAmountB(calculatedB);
  };

  const handleAmountBChange = (val: string) => {
    setAmountB(val);
    setRecentTxHash(null);
    const calculatedA = calculateRatio(val, tokenB, tokenA);
    if (calculatedA !== undefined) setAmountA(calculatedA);
  };

  useEffect(() => {
    if (amountA && tokenA && tokenB) {
      const calculatedB = calculateRatio(amountA, tokenA, tokenB);
      if (calculatedB) setAmountB(calculatedB);
    }
  }, [tokenA, tokenB]);

  const handleApprove = async (token: any) => {
    if (!address || !token) return;
    try {
      const tid = notify({ type: 'loading', title: 'Awaiting Approval', message: `Please confirm approval for ${token.symbol} in your wallet.` });
      setActiveTid(tid);
      writeAction({ address: token.addr as `0x${string}`, abi: ERC20_ABI.abi || ERC20_ABI as any, functionName: 'approve', args: [CONTRACT_ADDRESSES.ROUTER, maxUint256] }, { onSuccess: (h) => setLastApprovalHash(h), onError: (err) => { dismiss(tid); notify({ type: 'error', title: 'Approval Failed', message: err.message || 'Transaction rejected.' }); } });
    } catch (e: any) { notify({ type: 'error', title: 'Error', message: 'Failed to initiate approval.' }); }
  };

  const handleAddLiquidity = async () => {
    play('click');
    if (!address || !tokenA || !tokenB || !amountA || !amountB) return;
    try {
      const parsedA = parseUnits(amountA, tokenA.decimals);
      const parsedB = parseUnits(amountB, tokenB.decimals);
      const tid = notify({ type: 'loading', title: 'Adding Liquidity', message: `Adding ${tokenA.symbol} and ${tokenB.symbol} to the pool.` });
      setActiveTid(tid);
      writeAction({ address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`, abi: ROUTER_ABI.abi || ROUTER_ABI as any, functionName: 'addLiquidity', args: [tokenA.addr, tokenB.addr, parsedA, parsedB, address] }, { onError: (err) => { dismiss(tid); notify({ type: 'error', title: 'Transaction Failed', message: err.message || 'Failed to add liquidity.' }); } });
    } catch (e: any) { notify({ type: 'error', title: 'Error', message: 'Invalid input.' }); }
  };

  const handleRemoveLiquidity = async () => {
    play('click');
    if (!address || !tokenA || !tokenB || userLPBalance <= 0n) return;
    try {
      const liquidityToRemove = (userLPBalance * BigInt(removePercent)) / 100n;
      if (liquidityToRemove <= 0n) return;
      const tid = notify({ type: 'loading', title: 'Removing Liquidity', message: `Removing ${removePercent}% of your position.` });
      setActiveTid(tid);
      writeAction({ address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`, abi: ROUTER_ABI.abi || ROUTER_ABI as any, functionName: 'removeLiquidity', args: [tokenA.addr, tokenB.addr, liquidityToRemove, address] }, { onError: (err) => { dismiss(tid); notify({ type: 'error', title: 'Transaction Failed', message: err.message || 'Failed to remove liquidity.' }); } });
    } catch (e) { notify({ type: 'error', title: 'Error', message: 'Failed to remove liquidity.' }); }
  };

  const manualRefetch = () => {
    refetchPoolsLength();
    refetchPoolAddresses();
    refetchMetadatas();
    refetchLookup();
    refetchCurrentPool();
  };

  useEffect(() => {
    if (isConfirmed && receipt && hash && processedHash.current !== hash) {
      processedHash.current = hash;
      if (activeTid) dismiss(activeTid);
      const wasApproval = hash === lastApprovalHash;
      if (receipt.status === 'success') {
        if (wasApproval) {
          notify({ type: 'success', title: 'Approval Confirmed', message: 'Ready! You can now proceed with the transaction.' });
          setLastApprovalHash(null);
          stateA.refetchAllowance?.();
          stateB.refetchAllowance?.();
          play('success');
          triggerIsland('success', 'Approval Confirmed', hash, { type: 'Approval', asset: view === 'add' ? tokenA?.symbol : 'LP Token', amount: 'Unlimited' });
        } else {
          const fmt = (v: string) => isNaN(parseFloat(v)) ? v : parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 4 });
          notify({ type: 'success', title: 'Success', message: `Liquidity ${view === 'add' ? 'Addition' : 'Removal'} successful!`, txHash: hash });
          play('success');
          triggerIsland('success', `${view === 'add' ? 'Add' : 'Remove'} Liquidity Successful`, hash, { 
            type: view === 'add' ? 'Add Liquidity' : 'Remove Liquidity', 
            asset: `${tokenA?.symbol}/${tokenB?.symbol}`, 
            amount: view === 'add' ? `${fmt(amountA)} / ${fmt(amountB)}` : `${removePercent}%`
          });
          setRecentTxHash(hash);
          setAmountA(''); setAmountB('');
          setTimeout(manualRefetch, 500);
        }
      } else { notify({ type: 'error', title: 'Transaction Failed', message: 'The transaction was reverted. Please check your balances and try again.', txHash: hash }); }
      setActiveTid(null);
    }
  }, [isConfirmed, receipt, hash, lastApprovalHash]);

  if (view === 'add' || view === 'remove') {
    const isAdd = view === 'add';
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[440px] mx-auto w-full py-8">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => { setView('list'); setRecentTxHash(null); setHideToggle(false); }} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><ArrowLeft size={20} /></button>
          {!hideToggle ? (
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => { setView('add'); setRecentTxHash(null); }} className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAdd ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Add</button>
              <button onClick={() => { setView('remove'); setRecentTxHash(null); }} className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isAdd ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>Remove</button>
            </div>
          ) : ( <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Create Position</span> )}
          <button onClick={manualRefetch} className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-blue-400 transition-all"><RefreshCw size={16} /></button>
        </div>

        <div className="premium-card p-5 flex flex-col gap-4 relative overflow-hidden shadow-2xl">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-2 flex items-start gap-3">
            <Info size={14} className="text-blue-400 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Pool Stats</span>
              <span className="text-[9px] text-white/50 leading-relaxed font-black uppercase tracking-tighter">
                LP Address: <span className="font-mono text-white/80">{selectedPoolAddr ? `${selectedPoolAddr.slice(0,6)}...${selectedPoolAddr.slice(-4)}` : 'Scanning...'}</span><br/>
                Position: <span className="text-white tabular-nums">{parseFloat(formatUnits(userLPBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 5 })} LP</span>
              </span>
            </div>
          </div>

          {isAdd ? (
            <>
              <TokenInputSection label="Input Token" selectedToken={tokenA} amount={amountA} onAmountChange={handleAmountAChange} address={address} onTokenSelect={(t: any) => { setRecentTxHash(null); if(tokenB?.symbol === t.symbol) setTokenB(undefined); setTokenA(t); }} onUpdateState={setStateA} otherToken={tokenB} tokens={validTokens} />
              <div className="flex justify-center -my-2 z-10"><div className="p-1.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-blue-500 shadow-lg shadow-blue-500/10"><Plus size={12} strokeWidth={4} /></div></div>
              <TokenInputSection label="Input Token" selectedToken={tokenB} amount={amountB} onAmountChange={handleAmountBChange} address={address} onTokenSelect={(t: any) => { setRecentTxHash(null); if(tokenA?.symbol === t.symbol) setTokenA(undefined); setTokenB(t); }} onUpdateState={setStateB} otherToken={tokenA} tokens={validTokens} />
            </>
          ) : (
            <div className="flex flex-col gap-6 py-4">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Remove Amount</span>
                <span className="text-4xl font-black text-white tracking-tighter tabular-nums">{removePercent}%</span>
              </div>
              <input type="range" min="1" max="100" value={removePercent} onChange={(e) => { setRemovePercent(parseInt(e.target.value)); setRecentTxHash(null); }} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">You Will Receive</span>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><img src={tokenA?.logo} className="w-5 h-5 rounded-full" /><span className="text-xs font-black text-white uppercase">{tokenA?.symbol}</span></div>
                  <span className="text-sm font-black text-white tabular-nums">{parseFloat(removeAmounts.a).toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><img src={tokenB?.logo} className="w-5 h-5 rounded-full" /><span className="text-xs font-black text-white uppercase">{tokenB?.symbol}</span></div>
                  <span className="text-sm font-black text-white tabular-nums">{parseFloat(removeAmounts.b).toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                </div>
              </div>
            </div>
          )}
          
          {isAdd ? (
            !tokenA || !tokenB ? <button disabled className="w-full py-5 rounded-xl bg-white/5 text-white/20 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Select Tokens</button> :
            stateA.insufficient ? <button disabled className="w-full py-5 rounded-xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Insufficient {tokenA.symbol}</button> :
            stateB.insufficient ? <button disabled className="w-full py-5 rounded-xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Insufficient {tokenB.symbol}</button> :
            stateA.needsApprove ? ( <button onClick={() => handleApprove(tokenA)} disabled={isWaiting} className="w-full py-5 rounded-xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-2">{isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} Approve {tokenA.symbol}</button> ) :
            stateB.needsApprove ? ( <button onClick={() => handleApprove(tokenB)} disabled={isWaiting} className="w-full py-5 rounded-xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-2">{isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} Approve {tokenB.symbol}</button> ) :
            ( <button onClick={handleAddLiquidity} disabled={isWaiting} className="w-full py-5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5">{isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} Add Liquidity</button> )
          ) : (
            <button onClick={handleRemoveLiquidity} disabled={userLPBalance <= 0n || isWaiting} className={`w-full py-5 rounded-xl font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-2 shadow-xl ${userLPBalance <= 0n ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-red-500 text-white hover:scale-[1.02]'}`}>{isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} {userLPBalance <= 0n ? 'No Position' : 'Remove Liquidity'}</button>
          )}

          {recentTxHash && ( <a href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${recentTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-400/60 hover:text-blue-400 uppercase tracking-widest pt-2 transition-colors animate-in fade-in zoom-in-95 duration-500"> View on Explorer <ExternalLink size={12} /> </a> )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 w-full max-w-7xl mx-auto py-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Pools</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <Search size={12} className="text-white/20" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Found {poolAddresses.length} Pools</span>
          </div>
          <button onClick={manualRefetch} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all shadow-lg"><RefreshCw size={18} /></button>
          <button onClick={() => { setView('add'); setHideToggle(true); }} className="px-5 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-white/10"><Plus size={14} strokeWidth={4} /> Create Position</button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="premium-card min-h-[400px] flex flex-col bg-white/[0.02] overflow-hidden shadow-2xl">
            <div className="h-[51px] px-4 border-b border-white/5 bg-white/[0.03] flex items-center justify-between"><h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2"><Layers size={14} className="text-blue-500" /> My Positions</h3>{positions.length > 0 && <span className="px-2 py-0.5 rounded-md bg-blue-500 text-[9px] font-black text-white shadow-lg shadow-blue-500/20">{positions.length}</span>}</div>
            <div className="p-0 flex-1 overflow-x-auto no-scrollbar scrollbar-hide">
              {positions.length === 0 ? <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/10"><Wallet size={48} className="opacity-20" /><p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">No Active Liquidity</p></div> : (
                <table className="w-full text-left min-w-[400px] md:min-w-0">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-3 md:py-4 px-3 md:px-6 text-[8px] md:text-[9px] font-black text-white/20 uppercase">Pair</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 text-[8px] md:text-[9px] font-black text-white/20 uppercase text-center">Bal</th>
                      <th className="py-3 md:py-4 px-2 md:px-4 text-[8px] md:text-[9px] font-black text-white/20 uppercase text-center">APR</th>
                      <th className="py-3 md:py-4 px-3 md:px-6 text-right text-[8px] md:text-[9px] font-black text-white/20 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {positions.map((pos: any, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 md:py-4 px-3 md:px-6">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1 group-hover:-space-x-0.5 transition-all duration-300 shrink-0">
                              <img src={pos.tokens[0]?.logo} className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-[#0a0a0a]" />
                              <img src={pos.tokens[1]?.logo} className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-[#0a0a0a]" />
                            </div>
                            <span className="text-[10px] md:text-[11px] font-black text-white uppercase"><FormatSymbol symbol={pos.tokens[0]?.symbol} />/<FormatSymbol symbol={pos.tokens[1]?.symbol} /></span>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-[9px] md:text-[10px] font-black text-white tabular-nums text-center">{parseFloat(formatUnits(pos.balance, 18)).toFixed(4)}</td>
                        <td className="py-3 md:py-4 px-2 md:px-4 text-[9px] md:text-[10px] font-black text-emerald-400 text-center">{pos.apr}</td>
                        <td className="py-3 md:py-4 px-3 md:px-6 text-right">
                          <button onClick={() => { setTokenA(pos.tokens[0]); setTokenB(pos.tokens[1]); setView('add'); setRecentTxHash(null); setHideToggle(false); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase hover:bg-white hover:text-black transition-all shadow-lg">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <div className="premium-card overflow-hidden bg-white/[0.02] shadow-2xl">
            <div className="h-[51px] px-4 border-b border-white/5 bg-white/[0.03] flex items-center"><h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2"><Droplets size={14} className="text-emerald-500" /> Platform Pools</h3></div>
            <div className="overflow-x-auto no-scrollbar scrollbar-hide">
              <table className="w-full text-left min-w-[400px] md:min-w-0">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="py-3 md:py-4 px-3 md:px-6 text-[8px] md:text-[9px] font-black text-white/20 uppercase">Pair</th>
                    <th className="py-3 md:py-4 px-2 md:px-4 text-[8px] md:text-[9px] font-black text-white/20 uppercase text-center">APR</th>
                    <th className="py-3 md:py-4 px-2 md:px-4 text-[8px] md:text-[9px] font-black text-white/20 uppercase text-center">TVL</th>
                    <th className="py-3 md:py-4 px-3 md:px-6 text-right text-[8px] md:text-[9px] font-black text-white/20 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {displayPools.map((pool, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 md:py-4 px-3 md:px-6">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1 group-hover:-space-x-0.5 transition-all duration-300 shrink-0">
                            <img src={pool.tokens[0]?.logo} className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-[#0a0a0a]" />
                            <img src={pool.tokens[1]?.logo} className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-[#0a0a0a]" />
                          </div>
                          <span className="text-[10px] md:text-[11px] font-black text-white uppercase"><FormatSymbol symbol={pool.tokens[0]?.symbol} />/<FormatSymbol symbol={pool.tokens[1]?.symbol} /></span>
                        </div>
                      </td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-[9px] md:text-[10px] font-black text-emerald-400 text-center">{pool.apr}</td>
                      <td className="py-3 md:py-4 px-2 md:px-4 text-[9px] md:text-[10px] font-black text-white/50 text-center">{pool.tvl}</td>
                      <td className="py-3 md:py-4 px-3 md:px-6 text-right">
                        <button onClick={() => { setTokenA(pool.tokens[0]); setTokenB(pool.tokens[1]); setView('add'); setRecentTxHash(null); setHideToggle(false); }} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase hover:bg-white hover:text-black transition-all shadow-lg">Add</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div className="col-span-12">
        <PoolsAnalytics displayPools={displayPools} swapLogs={swapLogs} publicClient={publicClient} />
      </div>
    </div>
  );
};

const PoolsAnalytics = ({ displayPools, swapLogs, publicClient }: { displayPools: any[]; swapLogs: any[]; publicClient: any }) => {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const totalTvl = useMemo(() => {
    return displayPools.reduce((acc, p) => acc + (p.tvlNum || 0), 0);
  }, [displayPools]);

  const avgApy = useMemo(() => {
    if (!displayPools || displayPools.length === 0) return 0;
    const sum = displayPools.reduce((acc, p) => {
      const val = parseFloat(p.apr || '0');
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    return sum / displayPools.length;
  }, [displayPools]);

  // DYNAMIC SWAP VOLUME CALCULATION FROM BLOCKCHAIN EVENT LOGS
  const dailyVolumes = useMemo(() => {
    const volumes = Array(7).fill(0);
    if (swapLogs.length === 0 || !publicClient) return volumes;

    try {
      const maxBlock = swapLogs.reduce((max, l) => Number(l.blockNumber) > max ? Number(l.blockNumber) : max, 0);
      const averageBlockTimeMs = 2000; // 2 seconds per block on Arc L3

      swapLogs.forEach(l => {
        const pool = displayPools.find(p => p.poolAddr.toLowerCase() === l.address.toLowerCase());
        if (!pool) return;
        
        const t0 = pool.tokens[0];
        const amount0In = l.args.amount0In ? BigInt(l.args.amount0In.toString()) : 0n;
        const amount0Out = l.args.amount0Out ? BigInt(l.args.amount0Out.toString()) : 0n;
        const amount0 = amount0In > 0n ? amount0In : amount0Out;

        const price0 = 1; // Assuming stablecoins are pegged to $1.0 or close
        const usdValue = Number(formatUnits(amount0, t0.decimals)) * price0;

        // Estimate block time difference
        const blockDiff = maxBlock - Number(l.blockNumber);
        const ageMs = blockDiff * averageBlockTimeMs;
        const dayIndex = 6 - Math.floor(ageMs / (24 * 3600 * 1000));
        
        if (dayIndex >= 0 && dayIndex < 7) {
          volumes[dayIndex] += usdValue;
        }
      });
    } catch (e) {
      console.error(e);
    }

    return volumes;
  }, [swapLogs, displayPools, publicClient]);

  const currentVolume = dailyVolumes[6] || 0;

  const tvlSeries = [{ name: 'TVL ($)', data: totalTvl > 0 ? [0.85, 0.88, 0.90, 0.92, 0.95, 0.98, 1.0].map(m => Math.round(totalTvl * m)) : Array(7).fill(0) }];
  const volSeries = [{ name: 'Volume ($)', data: dailyVolumes.map(v => Math.round(v)) }];
  const apySeries = [{ name: 'Staking APY (%)', data: avgApy > 0 ? [0.62, 0.66, 0.71, 0.68, 0.76, 0.87, 0.84, 0.94, 0.91, 1.0].slice(-7).map(m => parseFloat((avgApy * m).toFixed(2))) : Array(7).fill(0) }];

  const baseOptions = {
    chart: {
      toolbar: { show: false },
      sparkline: { enabled: false },
      background: 'transparent',
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#3b82f6'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: dates,
      labels: { style: { colors: 'rgba(255,255,255,0.15)', fontSize: '7px', fontFamily: 'monospace', fontWeight: 400 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: 'rgba(255,255,255,0.15)', fontSize: '7px', fontFamily: 'monospace', fontWeight: 400 } }
    },
    grid: { borderColor: 'rgba(255,255,255,0.02)', strokeDashArray: 3 },
    tooltip: { theme: 'dark' }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
      {/* TVL CHART */}
      <div className="premium-card bg-white/[0.02] p-4 flex flex-col gap-2">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Protocol TVL</span>
        <span className="text-xl font-black text-white tracking-tighter">${totalTvl.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <div className="h-[150px]">
          <Chart options={{ ...baseOptions, colors: ['#06b6d4'] } as any} series={tvlSeries} type="area" height="100%" />
        </div>
      </div>

      {/* VOLUME CHART */}
      <div className="premium-card bg-white/[0.02] p-4 flex flex-col gap-2">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">24h Trading Volume</span>
        <span className="text-xl font-black text-white tracking-tighter">${currentVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <div className="h-[150px]">
          <Chart options={{ ...baseOptions, fill: { opacity: 0.8 }, colors: ['#6366f1'] } as any} series={volSeries} type="bar" height="100%" />
        </div>
      </div>

      {/* APY CHART */}
      <div className="premium-card bg-white/[0.02] p-4 flex flex-col gap-2">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Average Staking APY</span>
        <span className="text-xl font-black text-emerald-400 tracking-tighter">{avgApy > 0 ? `${avgApy.toFixed(2)}% APY` : '0.00% APY'}</span>
        <div className="h-[150px]">
          <Chart options={{ ...baseOptions, colors: ['#10b981'] } as any} series={apySeries} type="line" height="100%" />
        </div>
      </div>
    </div>
  );
};

