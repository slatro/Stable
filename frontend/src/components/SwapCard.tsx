import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw, Loader2, ArrowRight, Zap, TrendingUp, ShieldCheck, Droplets } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance, useGasPrice, useReadContracts } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import ERC20_ABI from '../abis/ERC20.json';
import STAKING_ABI from '../abis/ArcFXStaking.json';
import { usePrices } from '../context/PriceContext';
import { useNotifications } from '../context/NotificationContext';

const PROTOCOL_TOKENS = TOKENS.filter(t => t.symbol !== 'EURC');
const LS_KEY = 'arcfx_infinite_approvals_v1';

const getStoredApprovals = () => {
  if (typeof window === 'undefined') return {};
  const saved = localStorage.getItem(LS_KEY);
  return saved ? JSON.parse(saved) : {};
};

const TokenBox = ({ type, token, amount, setAmount, isReadOnly, userAddress, onTokenSelect, isLocked }: any) => {
  const { data: balance } = useBalance({
    address: userAddress,
    token: token?.addr as `0x${string}`,
    query: { enabled: !!token && !!userAddress }
  });

  return (
    <div className="flex flex-col gap-2 px-4 py-[14px] bg-transparent border border-white/5 rounded-xl group transition-all hover:bg-white/[0.02] hover:border-white/10">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{type}</span>
        <div className="flex items-center gap-1.5">
          <Wallet size={10} className="text-white/20" />
          <span className="text-[9px] font-bold text-white/40 tabular-nums">
            {balance ? parseFloat(balance.formatted).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0.00'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {type === 'From' ? (
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isReadOnly}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/10 tabular-nums"
            />
          ) : (
            <input 
              type="text" 
              value={amount}
              readOnly
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/10 tabular-nums"
            />
          )}
        </div>
        
        <div className="relative">
          <button 
            disabled={isLocked}
            onClick={(e) => { e.stopPropagation(); !isLocked && onTokenSelect.onToggle(); }}
            className={`flex items-center gap-2 px-3 py-2 w-[130px] justify-between rounded-xl bg-white/10 border border-white/10 transition-all ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:bg-white/20 hover:scale-105 active:scale-95'}`}
          >
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  <img src={token.logo} alt={token.symbol} className="w-5 h-5 rounded-full" />
                  <span className="text-xs font-black text-white">{token.symbol}</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Droplets size={10} className="text-white/20" />
                  </div>
                  <span className="text-[10px] font-black text-white/30 uppercase">Select</span>
                </>
              )}
            </div>
            {!isLocked && <ChevronDown size={14} className="text-white/40" />}
          </button>
          {onTokenSelect.isOpen && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute top-[110%] left-1/2 -translate-x-1/2 w-[130px] z-[9999] p-1 bg-[#1a1a1a] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-xl animate-in fade-in zoom-in-95 duration-150"
            >
               <div className="flex flex-col">
                  {onTokenSelect.tokens.map((t: any) => (
                    <button key={t.symbol} onClick={() => { onTokenSelect.onSelect(t); }} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-2">
                        <img src={t.logo} alt="" className="w-4 h-4 rounded-full" />
                        <span className="text-[10px] font-black text-white">{t.symbol}</span>
                      </div>
                      {token?.symbol === t.symbol && <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SwapCard = ({ 
  tokenIn,
  setTokenIn,
  tokenOut,
  setTokenOut,
  initialMode
}: { 
  tokenIn: any,
  setTokenIn: (t: any) => void,
  tokenOut: any,
  setTokenOut: (t: any) => void,
  initialMode?: string
}) => {
  const { address, isConnected } = useAccount();
  const { notify, dismiss, dismissAll } = useNotifications();
  const lastNotifiedHash = useRef<string | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'stake'>((initialMode as any) || 'market');
  const [localAllowanceOverride, setLocalAllowanceOverride] = useState(false);
  
  useEffect(() => {
    setLocalAllowanceOverride(false);
  }, [address]);

  const [showSettings, setShowSettings] = useState(false);
  const [isAutoSlippage, setIsAutoSlippage] = useState(true);
  const [internalSlippage, setInternalSlippage] = useState('0.5');
  const [isUnstake, setIsUnstake] = useState(false);

  const filteredTokens = useMemo(() => {
    if (activeTab === 'stake') {
      return TOKENS.filter(t => t.symbol === 'USDC' || t.symbol === 'astUSDC');
    }
    return TOKENS.filter(t => ['aUSDC', 'aTRYC', 'aEURC', 'aJPYC', 'aGBPC'].includes(t.symbol));
  }, [activeTab]);

  const [isSelectOpen, setIsSelectOpen] = useState<'in' | 'out' | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => setIsSelectOpen(null);
    if (isSelectOpen) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isSelectOpen]);

  const toggleSelect = (type: 'in' | 'out') => {
    if (isSelectOpen === type) setIsSelectOpen(null);
    else setIsSelectOpen(type);
  };

  useEffect(() => {
    if (activeTab === 'stake') {
      const usdc = TOKENS.find(t => t.symbol === 'USDC');
      const astusdc = TOKENS.find(t => t.symbol === 'astUSDC');
      if (usdc) setTokenIn(usdc);
      if (astusdc) setTokenOut(astusdc);
    } else {
      const platformSymbols = ['aUSDC', 'aTRYC', 'aEURC', 'aJPYC', 'aGBPC'];
      if (tokenIn && !platformSymbols.includes(tokenIn?.symbol)) setTokenIn(TOKENS.find(t => t.symbol === 'aUSDC') || TOKENS[1]);
      if (tokenOut && !platformSymbols.includes(tokenOut?.symbol)) setTokenOut(TOKENS.find(t => t.symbol === 'aTRYC') || TOKENS[3]);
    }
  }, [activeTab]);

  // --- STAKING HOOKS ---
  const { data: stakingData } = useReadContracts({
    contracts: [
      { address: (CONTRACT_ADDRESSES as any).STAKING_CONTRACT as `0x${string}`, abi: STAKING_ABI.abi || STAKING_ABI as any, functionName: 'getExchangeRate' },
      { address: (CONTRACT_ADDRESSES as any).STAKING_CONTRACT as `0x${string}`, abi: STAKING_ABI.abi || STAKING_ABI as any, functionName: 'totalSupply' },
    ],
    query: { enabled: activeTab === 'stake', refetchInterval: 5000 }
  });

  const exchangeRate = useMemo(() => stakingData?.[0].status === 'success' ? stakingData[0].result as bigint : 1000000n, [stakingData]);
  const totalStaked = useMemo(() => stakingData?.[1].status === 'success' ? stakingData[1].result as bigint : 0n, [stakingData]);

  const stakingToAmountRaw = useMemo(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || !tokenIn || !tokenOut) return 0n;
    const amountIn = parseUnits(fromAmount, tokenIn.decimals);
    if (isUnstake) {
       // astUSDC -> USDC: amountIn * exchangeRate / 1e6
       return (amountIn * exchangeRate) / 1000000n;
    } else {
       // USDC -> astUSDC: amountIn * 1e6 / exchangeRate
       return (amountIn * 1000000n) / exchangeRate;
    }
  }, [fromAmount, tokenIn, tokenOut, exchangeRate, isUnstake]);

  // --- CRITICAL: FIND REAL FACTORY ---
  const { data: routerFactory } = useReadContract({
    address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`,
    abi: ROUTER_ABI.abi || ROUTER_ABI as any,
    functionName: 'factory',
    query: { refetchInterval: 100000 }
  });
  const activeFactory = (routerFactory as string) || CONTRACT_ADDRESSES.FACTORY;

  const { data: pairAddressRaw } = useReadContract({
    address: activeFactory as `0x${string}`,
    abi: FACTORY_ABI.abi || FACTORY_ABI as any,
    functionName: 'getPool',
    args: tokenIn && tokenOut && activeTab !== 'stake' ? [tokenIn.addr, tokenOut.addr] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut && activeTab !== 'stake' }
  });

  const pairAddress = useMemo(() => {
    if (!pairAddressRaw || pairAddressRaw === '0x0000000000000000000000000000000000000000') return null;
    return pairAddressRaw as `0x${string}`;
  }, [pairAddressRaw]);

  const spenderAddress = activeTab === 'limit' ? (pairAddress as `0x${string}`) : 
                       (activeTab === 'stake' ? (CONTRACT_ADDRESSES as any).STAKING_CONTRACT as `0x${string}` : 
                       (CONTRACT_ADDRESSES.ROUTER as `0x${string}`));

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn?.addr as `0x${string}`,
    abi: ERC20_ABI.abi || ERC20_ABI,
    functionName: 'allowance',
    args: address && tokenIn && spenderAddress ? [address, spenderAddress] : undefined,
    query: { enabled: !!tokenIn && !!address && !!spenderAddress }
  });

  const needsApproval = isConnected && !localAllowanceOverride && (
    allowance !== undefined && 
    tokenIn &&
    typeof allowance === 'bigint' && 
    allowance < parseUnits(fromAmount || '0', tokenIn?.decimals || 18)
  );

  const { data: actionHash, writeContract: actionWrite, isPending: isActionPending, error: actionError, reset: resetAction } = useWriteContract();
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess, error: actionWaitError } = useWaitForTransactionReceipt({ hash: actionHash });

  useEffect(() => {
    if (actionError || actionWaitError) {
      dismissAll();
      const errorMsg = (actionError as any)?.shortMessage || (actionError as any)?.message || "Transaction failed";
      notify({ type: 'error', title: 'Transaction Error', message: errorMsg });
      if (resetAction) resetAction();
    }
  }, [actionError, actionWaitError]);

  const { data: approveHash, writeContract: approveWrite, isPending: isApprovePending, error: approveError, reset: resetApprove } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  useEffect(() => {
    if (approveError) {
      dismissAll();
      notify({ type: 'error', title: 'Approval Failed', message: (approveError as any)?.shortMessage || "User rejected the request" });
      if (resetApprove) resetApprove();
    }
  }, [approveError]);

  useEffect(() => {
    if (isApproveSuccess) {
      dismissAll();
      refetchAllowance();
      setLocalAllowanceOverride(true);
      notify({ type: 'success', title: 'Approval Confirmed', message: `${tokenIn?.symbol} authorized for trading.`, txHash: approveHash });
      setTimeout(() => dismissAll(), 3000);
    }
  }, [isApproveSuccess, refetchAllowance, approveHash, tokenIn]);

  const priceContext = usePrices();
  const prices = priceContext?.prices || {};
  const recordTrade = priceContext?.recordTrade || (() => {});
  const { data: gasPrice } = useGasPrice();

  // --- DYNAMIC RESERVES & QUOTES ---
  const { data: poolData } = useReadContracts({
    contracts: [
      { address: pairAddress as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'token0' },
      { address: pairAddress as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'reserve0' },
      { address: pairAddress as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'reserve1' },
      { address: pairAddress as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'getAmountOut', args: tokenIn && fromAmount && !isNaN(parseFloat(fromAmount)) ? [parseUnits(fromAmount, tokenIn.decimals), tokenIn.addr] : undefined },
    ],
    query: { enabled: !!pairAddress && !!tokenIn && activeTab !== 'stake', refetchInterval: 3000 }
  });

  const poolReserves = useMemo(() => {
    if (!poolData || poolData[1].status !== 'success' || poolData[2].status !== 'success') return null;
    const t0 = poolData[0].result as string;
    const r0 = poolData[1].result as bigint;
    const r1 = poolData[2].result as bigint;
    const isTokenIn0 = tokenIn?.addr.toLowerCase() === t0?.toLowerCase();
    return isTokenIn0 ? { in: r0, out: r1 } : { in: r1, out: r0 };
  }, [poolData, tokenIn]);

  const poolAmountOut = useMemo(() => poolData?.[3].status === 'success' ? poolData[3].result as bigint : null, [poolData]);

  const visualToAmountRaw = useMemo(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || !tokenIn || !tokenOut) return 0n;
    const priceIn = prices[tokenIn.symbol]?.price || 1;
    const priceOut = prices[tokenOut.symbol]?.price || 1;
    const estimated = parseFloat(fromAmount) * (priceIn / priceOut);
    try {
      return parseUnits(estimated.toFixed(tokenOut.decimals), tokenOut.decimals);
    } catch (e) { return 0n; }
  }, [fromAmount, tokenIn, tokenOut, prices]);

  const toAmount = useMemo(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount))) return '';
    if (activeTab === 'stake') return parseFloat(formatUnits(stakingToAmountRaw, tokenOut.decimals)).toFixed(4);
    const raw = (poolAmountOut && (poolAmountOut as bigint) > 0n) ? (poolAmountOut as bigint) : visualToAmountRaw;
    if (raw === 0n || !tokenOut) return '';
    return parseFloat(formatUnits(raw, tokenOut.decimals)).toFixed(4);
  }, [fromAmount, poolAmountOut, visualToAmountRaw, tokenOut, activeTab, stakingToAmountRaw]);

  const minReceived = useMemo(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount))) return '0.00';
    if (activeTab === 'stake') return formatUnits(stakingToAmountRaw, tokenOut.decimals);
    const baseAmount = (poolAmountOut && (poolAmountOut as bigint) > 0n) ? (poolAmountOut as bigint) : visualToAmountRaw;
    if (baseAmount === 0n || !tokenOut) return '0.00';
    const slippageVal = parseFloat(internalSlippage) / 100;
    const factor = BigInt(Math.floor((1 - slippageVal) * 10000));
    return formatUnits((baseAmount * factor) / 10000n, tokenOut.decimals);
  }, [poolAmountOut, visualToAmountRaw, tokenOut, internalSlippage, activeTab, stakingToAmountRaw]);

  // --- ROBUST PRICE IMPACT CALCULATION ---
  const priceImpact = useMemo(() => {
    if (activeTab === 'stake') return "0.000";
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || !poolReserves || poolReserves.in === 0n) return "0.000";
    
    try {
      const amountIn = parseUnits(fromAmount, tokenIn.decimals);
      const multiplier = 1000000n;
      const impactBP = (amountIn * 100n * multiplier) / (poolReserves.in + amountIn);
      const finalImpact = Number(impactBP) / Number(multiplier);
      if (finalImpact < 0.0001) return "0.000";
      return finalImpact.toFixed(4);
    } catch (e) {
      return "0.000";
    }
  }, [fromAmount, poolReserves, tokenIn, activeTab]);

  const networkFee = useMemo(() => {
    if (!gasPrice) return '$0.001';
    const feeNative = Number(gasPrice) * 200000;
    const feeUsd = (feeNative / 1e18) * (prices['aUSDC']?.price || 1);
    return feeUsd < 0.001 ? '< $0.001' : `~$${feeUsd.toFixed(4)}`;
  }, [gasPrice, prices]);

  useEffect(() => {
    if (isActionSuccess && actionHash && lastNotifiedHash.current !== actionHash) {
      lastNotifiedHash.current = actionHash;
      dismissAll();
      const price = tokenIn ? prices[tokenIn.symbol]?.price || 1 : 1;
      const usdValue = fromAmount ? parseFloat(fromAmount) * price : 0;
      if (usdValue > 0) recordTrade(usdValue);
      const actionType = activeTab === 'stake' ? (isUnstake ? 'Unstaked' : 'Staked') : 'Exchanged';
      notify({ 
        type: 'success', 
        title: `${actionType} Successful`, 
        message: `${actionType} ${fromAmount} ${tokenIn?.symbol} for ${toAmount} ${tokenOut?.symbol}`,
        txHash: actionHash 
      });
      setFromAmount('');
      setTimeout(() => dismissAll(), 4000);
    }
  }, [isActionSuccess, actionHash]);

  const handleAction = async () => {
    if (!isConnected || !address || !tokenIn || !tokenOut) return;
    if (needsApproval && tokenIn && spenderAddress) {
      notify({ type: 'loading', title: 'Authorization Required', message: `Approving ${tokenIn.symbol}...` });
      approveWrite({ address: tokenIn.addr as `0x${string}`, abi: ERC20_ABI.abi || ERC20_ABI, functionName: 'approve', args: [spenderAddress, maxUint256] });
    } else {
      const msg = activeTab === 'limit' ? 'Placing limit order...' : (activeTab === 'stake' ? (isUnstake ? 'Unstaking assets...' : 'Staking assets...') : 'Exchanging tokens...');
      notify({ type: 'loading', title: 'Transaction Pending', message: msg });
      
      if (activeTab === 'limit') {
        actionWrite({ address: pairAddress as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'placeLimitOrder', args: [tokenIn.addr, parseUnits(fromAmount, tokenIn.decimals), parseUnits(limitPrice, tokenOut.decimals)] });
      } else if (activeTab === 'stake') {
        const stakeMsg = isUnstake ? 'Unstaking your assets...' : 'Staking your assets...';
        notify({ type: 'loading', title: 'Transaction Pending', message: stakeMsg });
        actionWrite({ 
          address: (CONTRACT_ADDRESSES as any).STAKING_CONTRACT as `0x${string}`, 
          abi: STAKING_ABI.abi || STAKING_ABI as any, 
          functionName: isUnstake ? 'unstake' : 'stake', 
          args: [parseUnits(fromAmount, tokenIn.decimals)] 
        });
      } else {
        const minOutRaw = parseUnits(minReceived, tokenOut.decimals);
        actionWrite({ 
          address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`, 
          abi: ROUTER_ABI.abi || ROUTER_ABI as any, 
          functionName: 'swapExactTokensForTokens', 
          args: [parseUnits(fromAmount, tokenIn.decimals), minOutRaw, [tokenIn.addr, tokenOut.addr], address, BigInt(Math.floor(Date.now() / 1000) + 1200)] 
        });
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[480px] gap-2 animate-in zoom-in-95 duration-500">
      <div className="premium-card h-12 p-1 flex items-center justify-between relative z-[60]">
        <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 relative z-10 ml-8 mr-2">
          <button onClick={() => setActiveTab('market')} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all py-1.5 rounded-xl ${activeTab === 'market' ? 'text-white bg-white/10' : 'text-white/45 hover:text-white/70'}`}>Market</button>
          <button onClick={() => setActiveTab('limit')} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all py-1.5 rounded-xl ${activeTab === 'limit' ? 'text-white bg-white/10' : 'text-white/45 hover:text-white/70'}`}>Limit</button>
          <button onClick={() => setActiveTab('stake')} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all py-1.5 rounded-xl ${activeTab === 'stake' ? 'text-white bg-white/10' : 'text-white/45 hover:text-white/70'}`}>Stake</button>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-xl transition-all z-20 ${showSettings ? 'text-white bg-white/10' : 'text-white/20 hover:text-white'}`}><Settings size={14} /></button>
        {showSettings && (
          <div className="absolute top-12 right-1 w-48 glass-frame p-3 z-[70] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-2xl backdrop-blur-3xl bg-black/80 border-white/20">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Slippage Settings</span>
            <div className="flex p-0.5 bg-white/5 rounded-xl">
              <button onClick={() => setIsAutoSlippage(true)} className={`flex-1 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${isAutoSlippage ? 'bg-white text-black' : 'text-white/40'}`}>Auto</button>
              <button onClick={() => setIsAutoSlippage(false)} className={`flex-1 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${!isAutoSlippage ? 'bg-white text-black' : 'text-white/40'}`}>Custom</button>
            </div>
            {!isAutoSlippage && (
              <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded-xl border border-white/10">
                <input value={internalSlippage} onChange={(e) => setInternalSlippage(e.target.value)} className="bg-transparent text-[10px] font-black text-white outline-none w-12 tabular-nums" />
                <span className="text-[10px] font-black text-white/20">%</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="premium-card h-[376px] p-6 flex flex-col justify-between relative z-20">
        <div className="flex flex-col gap-6 relative z-30">
          <div className={`relative ${isSelectOpen === 'in' ? 'z-[50]' : 'z-10'}`}>
            <TokenBox type="From" token={tokenIn} amount={fromAmount} setAmount={setFromAmount} isReadOnly={false} userAddress={address} onTokenSelect={{ isOpen: isSelectOpen === 'in', onToggle: () => toggleSelect('in'), onSelect: (t: any) => { if (tokenOut?.symbol === t.symbol) setTokenOut(null); setTokenIn(t); setIsSelectOpen(null); }, tokens: filteredTokens }} isLocked={activeTab === 'stake'} />
          </div>
          <div className="relative h-2 flex items-center justify-center my-1 z-0">
            <button onClick={() => { const t = tokenIn; setTokenIn(tokenOut); setTokenOut(t); if (activeTab === 'stake') setIsUnstake(!isUnstake); }} className="z-10 w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 group backdrop-blur-xl"><ArrowUpDown size={12} className="text-white/30 group-hover:text-white" /></button>
          </div>
          <div className={`relative ${isSelectOpen === 'out' ? 'z-[50]' : 'z-10'}`}>
            <TokenBox type="To" token={tokenOut} amount={toAmount} setAmount={() => {}} isReadOnly={true} userAddress={address} onTokenSelect={{ isOpen: isSelectOpen === 'out', onToggle: () => toggleSelect('out'), onSelect: (t: any) => { if (tokenIn?.symbol === t.symbol) setTokenIn(null); setTokenOut(t); setIsSelectOpen(null); }, tokens: filteredTokens }} isLocked={activeTab === 'stake'} />
          </div>
        </div>

        <div className="relative z-10 space-y-3 px-1">
          {activeTab === 'limit' ? (
             <div className="flex items-center justify-between p-4 bg-transparent border border-white/5 rounded-2xl group transition-all hover:bg-white/[0.02] hover:border-white/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Limit Price</span>
                  <div className="flex items-center gap-1">
                    <Zap size={10} className="text-orange-400 opacity-50" />
                    <span className="text-[7px] font-bold text-orange-400/60 uppercase tracking-widest">Fixed Execution</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="bg-transparent text-lg font-black text-white text-right outline-none w-24 tabular-nums placeholder:text-white/10" placeholder="0.0000" />
                  <div className="flex flex-col items-end"><span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">{tokenOut?.symbol || '...'}</span><span className="text-[7px] font-bold text-white/10 uppercase">Target</span></div>
                </div>
              </div>
          ) : activeTab === 'market' ? (
            <div className="flex flex-col gap-2 py-1 px-1 mt-3 animate-in fade-in slide-in-from-top-1 duration-400">
              <div className="flex justify-between items-center group/item">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Price Impact</span>
                <span className={`text-[10px] font-black tabular-nums ${parseFloat(priceImpact) > 1 ? 'text-red-500' : (parseFloat(priceImpact) > 0.1 ? 'text-red-400/70' : 'text-emerald-400/90')}`}>
                  {priceImpact}%
                </span>
              </div>
              <div className="flex justify-between items-center group/item">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Min. Received</span>
                <div className="flex items-center gap-1.5"><span className="text-[10px] font-black text-white/60 tabular-nums italic">{parseFloat(minReceived).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span><span className="text-[8px] font-black text-blue-400/40 uppercase">{tokenOut?.symbol || '...'}</span></div>
              </div>
              <div className="mt-1 pt-2 border-t border-white/[0.03] flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                <span className="text-[7px] font-bold text-white uppercase tracking-widest">Est. Fees</span>
                <span className="text-[8px] font-black text-white/60 tabular-nums">0.10% + {networkFee}</span>
              </div>
            </div>
          ) : activeTab === 'stake' ? (
            <div className="flex flex-col gap-3 py-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400/20 flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-emerald-400" /></div><span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Estimated APY</span></div>
                <span className="text-[11px] font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)] tabular-nums">12.54%</span>
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400/20 flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-purple-400" /></div><span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total Staked</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] font-black text-white/70 tabular-nums">${parseFloat(formatUnits(totalStaked, 18)).toLocaleString()}</span><span className="text-[7px] font-bold text-white/10 uppercase">TVL Pool</span></div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="premium-card p-4 flex items-center justify-center relative z-10">
        <button onClick={handleAction} disabled={!isConnected || !fromAmount || isActionPending || isApprovePending || !tokenIn || !tokenOut} className={`w-[92%] py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-700 relative overflow-hidden group border ${(!isConnected || !fromAmount || isActionPending || isApprovePending || !tokenIn || !tokenOut) ? 'bg-white/[0.02] text-white/10 cursor-not-allowed border-white/5 shadow-none' : 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] border-white'}`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {isActionPending || isActionConfirming || isApprovePending || isApproveConfirming ? (
            <><Loader2 className="animate-spin" size={16} strokeWidth={3} /><span className="tracking-[0.5em] font-black text-[10px]">PROCESSING</span></>
          ) : !isConnected ? (
            <span className="tracking-[0.5em] font-black text-[10px]">CONNECT WALLET</span>
          ) : (!tokenIn || !tokenOut) ? (
            <span className="tracking-[0.5em] font-black text-[10px]">SELECT TOKEN</span>
          ) : !fromAmount ? (
            <span className="tracking-[0.5em] font-black text-[10px] opacity-40 uppercase">ENTER AMOUNT</span>
          ) : needsApproval ? (
            <span className="tracking-[0.5em] font-black text-[10px]">APPROVE {tokenIn.symbol}</span>
          ) : (
            <span className="tracking-[0.6em] font-black text-[10px] uppercase">{activeTab === 'stake' ? (isUnstake ? 'UNSTAKE' : 'STAKE') : activeTab === 'limit' ? 'PLACE ORDER' : 'SWAP'}</span>
          )}
        </button>
      </div>
    </div>
  );
};
