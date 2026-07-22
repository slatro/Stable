import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw, Loader2, ArrowRight, Zap, TrendingUp, ShieldCheck, Droplets, AlertCircle } from 'lucide-react';
import { useReadContract, useWaitForTransactionReceipt, useBalance, useGasPrice, useReadContracts, useSignMessage } from 'wagmi';
import { useAccount, useWriteContract } from '../hooks/web3';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import ERC20_ABI from '../abis/ERC20.json';
import STAKING_ABI from '../abis/ArcFXStaking.json';
import { usePrices } from '../context/PriceContext';
import { useNotifications } from '../context/NotificationContext';
import { useSound } from '../context/SoundContext';
import { triggerIsland } from './TransactionIsland';

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
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-white">{token.symbol}</span>
                    {token.verified && <ShieldCheck size={10} className="text-emerald-400" />}
                  </div>
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
              className="absolute top-[110%] left-1/2 -translate-x-1/2 w-[130px] z-[9999] p-1 bg-[#0a0a0a] border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-xl animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex flex-col">
                {onTokenSelect.tokens.map((t: any) => (
                  <button key={t.symbol} onClick={() => { onTokenSelect.onSelect(t); }} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-all group">
                    <div className="flex items-center gap-2">
                      <img src={t.logo} alt="" className="w-4 h-4 rounded-full" />
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-white">{t.symbol}</span>
                        {t.verified && <ShieldCheck size={9} className="text-emerald-400" />}
                      </div>
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
  const { play } = useSound();
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
      if (usdc && astusdc) {
        if (isUnstake) {
          setTokenIn(astusdc);
          setTokenOut(usdc);
        } else {
          setTokenIn(usdc);
          setTokenOut(astusdc);
        }
      }
    } else {
      const platformSymbols = ['aUSDC', 'aTRYC', 'aEURC', 'aJPYC', 'aGBPC'];
      if (tokenIn && !platformSymbols.includes(tokenIn?.symbol)) setTokenIn(TOKENS.find(t => t.symbol === 'aUSDC') || TOKENS[1]);
      if (tokenOut && !platformSymbols.includes(tokenOut?.symbol)) setTokenOut(TOKENS.find(t => t.symbol === 'aTRYC') || TOKENS[3]);
    }
  }, [activeTab, isUnstake]);

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

    // Calculate scaling factor between tokens
    const decimalsIn = tokenIn.decimals;
    const decimalsOut = tokenOut.decimals;
    const diff = decimalsIn - decimalsOut;
    const scale = 10n ** BigInt(Math.abs(diff));

    if (isUnstake) {
      // astUSDC -> USDC
      // apply exchange rate then scale up/down
      const raw = (amountIn * exchangeRate) / 1000000n;
      return diff > 0 ? raw / scale : raw * scale;
    } else {
      // USDC -> astUSDC
      // apply inverse exchange rate then scale up/down
      const raw = (amountIn * 1000000n) / exchangeRate;
      return diff > 0 ? raw / scale : raw * scale;
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

  const { data: balanceIn } = useBalance({
    address,
    token: tokenIn?.addr as `0x${string}`,
    query: { enabled: !!tokenIn && !!address, refetchInterval: 10000 }
  });

  const insufficientBalance = useMemo(() => {
    if (!fromAmount || !balanceIn) return false;
    try {
      const amountIn = parseUnits(fromAmount, tokenIn.decimals);
      return amountIn > balanceIn.value;
    } catch (e) { return false; }
  }, [fromAmount, balanceIn, tokenIn]);

  const needsApproval = isConnected && !localAllowanceOverride && !insufficientBalance && (
    allowance !== undefined &&
    tokenIn &&
    typeof allowance === 'bigint' &&
    allowance < parseUnits(fromAmount || '0', tokenIn?.decimals || 18)
  );

  const { signMessage, isPending: isSignPending } = useSignMessage();
  const { data: actionHash, writeContract: actionWrite, isPending: isActionPending, error: actionError, reset: resetAction } = useWriteContract();
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess, error: actionWaitError } = useWaitForTransactionReceipt({ hash: actionHash });

  useEffect(() => {
    if (actionError || actionWaitError) {
      dismissAll();
      const errorMsg = (actionError as any)?.shortMessage || (actionError as any)?.message || "Transaction failed";
      triggerIsland('error', errorMsg);
      if (resetAction) resetAction();
    }
  }, [actionError, actionWaitError]);

  const { data: approveHash, writeContract: approveWrite, isPending: isApprovePending, error: approveError, reset: resetApprove } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  useEffect(() => {
    if (approveError) {
      dismissAll();
      triggerIsland('error', (approveError as any)?.shortMessage || "User rejected the request");
      if (resetApprove) resetApprove();
    }
  }, [approveError]);

  const lastNotifiedApproveHash = useRef<string | null>(null);

  useEffect(() => {
    if (isApproveSuccess && approveHash && lastNotifiedApproveHash.current !== approveHash) {
      lastNotifiedApproveHash.current = approveHash;
      dismissAll();
      refetchAllowance();
      setLocalAllowanceOverride(true);
      triggerIsland('success', `Approval Confirmed for ${tokenIn?.symbol}`, approveHash, { type: 'Approval', asset: tokenIn?.symbol });
    }
  }, [isApproveSuccess, refetchAllowance, approveHash, tokenIn]);

  const priceContext = usePrices();
  const prices = priceContext?.prices || {};
  const recordTrade = priceContext?.recordTrade || (() => { });
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
    if (activeTab === 'limit' && limitPrice && !isNaN(parseFloat(limitPrice))) {
      return (parseFloat(fromAmount) * parseFloat(limitPrice)).toFixed(4);
    }
    const raw = (poolAmountOut && (poolAmountOut as bigint) > 0n) ? (poolAmountOut as bigint) : visualToAmountRaw;
    if (raw === 0n || !tokenOut) return '';
    return parseFloat(formatUnits(raw, tokenOut.decimals)).toFixed(4);
  }, [fromAmount, poolAmountOut, visualToAmountRaw, tokenOut, activeTab, stakingToAmountRaw, limitPrice]);

  const marketPrice = useMemo(() => {
    if (!tokenIn || !tokenOut || !prices[tokenIn.symbol] || !prices[tokenOut.symbol]) return 0;
    return prices[tokenIn.symbol].price / prices[tokenOut.symbol].price;
  }, [tokenIn, tokenOut, prices]);

  const isInvalidLimit = useMemo(() => {
    if (activeTab !== 'limit' || !limitPrice || isNaN(parseFloat(limitPrice)) || marketPrice === 0) return false;
    const limit = parseFloat(limitPrice);
    // Logic: If user is getting tokenOut (Buying it with tokenIn)
    // They should only place a limit if target is BETTER than market.
    // For Buy: target < market (cheaper)
    // For Sell: target > market (dearer)
    // In our UI, tokenIn -> tokenOut. So we are buying tokenOut.
    return limit > marketPrice; // Buy Limit must be LOWER than market
  }, [activeTab, limitPrice, marketPrice]);

  const minReceived = useMemo(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount))) return '0.00';
    if (activeTab === 'stake') return formatUnits(stakingToAmountRaw, tokenOut.decimals);
    if (activeTab === 'limit' && limitPrice && !isNaN(parseFloat(limitPrice))) {
      return (parseFloat(fromAmount) * parseFloat(limitPrice)).toFixed(4);
    }
    const baseAmount = (poolAmountOut && (poolAmountOut as bigint) > 0n) ? (poolAmountOut as bigint) : visualToAmountRaw;
    if (baseAmount === 0n || !tokenOut) return '0.00';
    const slippagePercent = isAutoSlippage ? 0.5 : (parseFloat(internalSlippage) || 0.5);
    const slippageVal = slippagePercent / 100;
    const factor = BigInt(Math.floor((1 - slippageVal) * 10000));
    return formatUnits((baseAmount * factor) / 10000n, tokenOut.decimals);
  }, [poolAmountOut, visualToAmountRaw, tokenOut, internalSlippage, isAutoSlippage, activeTab, stakingToAmountRaw, limitPrice]);

  // --- ROBUST PRICE IMPACT CALCULATION ---
  const priceImpact = useMemo(() => {
    if (activeTab === 'stake') return "0.000";
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || !toAmount || isNaN(parseFloat(toAmount))) return "0.000";

    try {
      const numIn = parseFloat(fromAmount);
      const numOut = parseFloat(toAmount);
      if (numIn <= 0) return "0.000";
      const ratio = numOut / numIn;
      const impact = Math.max(0, (1 - ratio) * 100);
      if (impact < 0.0001) return "0.000";
      return impact.toFixed(4);
    } catch (e) {
      return "0.000";
    }
  }, [fromAmount, toAmount, activeTab]);

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
      const actionType = activeTab === 'limit' ? 'Limit Order' : (activeTab === 'stake' ? (isUnstake ? 'Unstaked' : 'Staked') : 'Swap');
      const assetStr = activeTab === 'limit' ? `${tokenIn?.symbol} / ${tokenOut?.symbol}` : tokenIn?.symbol;

      play('success');
      triggerIsland('success', `${actionType === 'Swap' ? 'Swap' : actionType} Successful`, actionHash, {
        type: activeTab === 'limit' ? 'Limit Order' : (activeTab === 'stake' ? (isUnstake ? 'Unstaked' : 'Staked') : 'Swap'),
        asset: assetStr,
        amount: fromAmount,
        price: activeTab === 'limit' ? limitPrice : undefined
      });
      setFromAmount('');
    }
  }, [isActionSuccess, actionHash]);

  const handleAction = async () => {
    if (!isConnected || !address || !tokenIn || !tokenOut) return;
    if (needsApproval && tokenIn && spenderAddress) {
      triggerIsland('processing', `Authorizing ${tokenIn.symbol}...`);
      approveWrite({ address: tokenIn.addr as `0x${string}`, abi: ERC20_ABI.abi || ERC20_ABI, functionName: 'approve', args: [spenderAddress, maxUint256] });
    } else {
      const actionType = activeTab === 'limit' ? 'Limit Order' : (activeTab === 'stake' ? (isUnstake ? 'Unstaked' : 'Staked') : 'Swap');
      const msg = activeTab === 'limit' ? 'Placing Limit Order...' : (activeTab === 'stake' ? (isUnstake ? 'Unstaking Assets...' : 'Staking Assets...') : 'Swapping Tokens...');
      const assetStr = activeTab === 'limit' ? `${tokenIn?.symbol} / ${tokenOut?.symbol}` : tokenIn?.symbol;

      triggerIsland('processing', msg, undefined, {
        type: actionType,
        asset: assetStr,
        amount: fromAmount,
        price: activeTab === 'limit' ? limitPrice : undefined
      });

      const stableId = `limit-${Date.now()}`;
      if (activeTab === 'limit') {
        // Simulated Signature-based Limit Order
        try {
          triggerIsland('processing', `Authorizing Order via Signature...`, stableId);
          const msgToSign = `Stablr Limit Order\nAction: SELL ${fromAmount} ${tokenIn.symbol}\nTarget: ${limitPrice} ${tokenOut.symbol}\nExpiry: 7 Days\nNonce: ${Date.now()}`;

          signMessage({ message: msgToSign }, {
            onSuccess: (sig) => {
              const mockHash = `0x${sig.slice(2, 66)}`; // Use part of signature as mock hash
              triggerIsland('success', `Limit Order Authorized & Placed`, stableId, {
                type: 'Limit Order',
                asset: assetStr,
                amount: fromAmount,
                price: limitPrice
              });
            },
            onError: (err) => {
              triggerIsland('error', 'Signature Rejected', stableId, { type: 'Limit Order' });
            }
          });
        } catch (err) {
          triggerIsland('error', 'Auth Failed', stableId, { type: 'Limit Order' });
        }
      } else if (activeTab === 'stake') {
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
          <div className="absolute top-12 right-1 w-48 p-3 z-[70] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#050505] border border-white/20 rounded-2xl">
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest px-1">Slippage</span>
            <div className="flex p-1 bg-white/5 rounded-xl">
              <button onClick={() => setIsAutoSlippage(true)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isAutoSlippage ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}>Auto</button>
              <button onClick={() => setIsAutoSlippage(false)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!isAutoSlippage ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white/60'}`}>Custom</button>
            </div>
            {!isAutoSlippage && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/10 group focus-within:border-white/20 transition-all">
                  <input
                    type="number"
                    value={internalSlippage}
                    onChange={(e) => setInternalSlippage(e.target.value)}
                    className="bg-transparent text-[12px] font-black text-white outline-none w-full tabular-nums"
                    placeholder="0.5"
                  />
                  <span className="text-[10px] font-black text-white/20">%</span>
                </div>
                {parseFloat(internalSlippage) > 3 && (
                  <div className="flex items-center gap-1.5 px-1 animate-pulse">
                    <AlertCircle size={10} className="text-rose-500" />
                    <span className="text-[8px] font-bold text-rose-500 uppercase">High Risk Setting</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="premium-card h-[376px] p-6 flex flex-col justify-between relative z-20">
        <div className="flex flex-col gap-4 relative z-30">
          <div className={`relative ${isSelectOpen === 'in' ? 'z-[50]' : 'z-10'}`}>
            <TokenBox type="From" token={tokenIn} amount={fromAmount} setAmount={setFromAmount} isReadOnly={false} userAddress={address} onTokenSelect={{ isOpen: isSelectOpen === 'in', onToggle: () => toggleSelect('in'), onSelect: (t: any) => { if (tokenOut?.symbol === t.symbol) setTokenOut(null); setTokenIn(t); setIsSelectOpen(null); }, tokens: filteredTokens }} isLocked={activeTab === 'stake'} />
          </div>
          <div className="relative h-2 flex items-center justify-center my-1 z-0">
            <button onClick={() => { const t = tokenIn; setTokenIn(tokenOut); setTokenOut(t); if (activeTab === 'stake') setIsUnstake(!isUnstake); }} className="z-10 w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 group backdrop-blur-xl"><ArrowUpDown size={11} className="text-white/30 group-hover:text-white" /></button>
          </div>
          <div className={`relative ${isSelectOpen === 'out' ? 'z-[50]' : 'z-10'}`}>
            <TokenBox type="To" token={tokenOut} amount={toAmount} setAmount={() => {}} isReadOnly={true} userAddress={address} onTokenSelect={{ isOpen: isSelectOpen === 'out', onToggle: () => toggleSelect('out'), onSelect: (t: any) => { if (tokenIn?.symbol === t.symbol) setTokenIn(null); setTokenOut(t); setIsSelectOpen(null); }, tokens: filteredTokens }} isLocked={activeTab === 'stake'} />
          </div>

          {((tokenIn && !tokenIn.verified) || (tokenOut && !tokenOut.verified)) && (
            <div className="mx-1 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <AlertCircle size={14} className="text-orange-500" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Unverified Asset</span>
                <span className="text-[9px] font-medium text-white/40 leading-tight">This token is not verified by the protocol. Please trade with extreme caution.</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 space-y-2 px-1">
          {activeTab === 'limit' ? (
            <div className="flex items-center justify-between p-3 bg-transparent border border-white/5 rounded-2xl group transition-all hover:bg-white/[0.02] hover:border-white/10">
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
            <div className="flex flex-col gap-1 py-1 px-1 mt-2 animate-in fade-in slide-in-from-top-1 duration-400">
              <div className="flex justify-between items-center group/item">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Price Impact</span>
                <span className={`text-[10px] font-black tabular-nums ${parseFloat(priceImpact) > 1 ? 'text-red-500' : (parseFloat(priceImpact) > 0.1 ? 'text-red-400/70' : 'text-emerald-400/90')}`}>
                  {priceImpact}%
                </span>
              </div>
              <div className="flex justify-between items-center group/item">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Slippage Tolerance</span>
                <span className={`text-[10px] font-black tabular-nums ${parseFloat(internalSlippage) > 3 ? 'text-rose-400' : 'text-white/60'}`}>
                  {isAutoSlippage ? 'Auto' : `${internalSlippage}%`}
                </span>
              </div>
              <div className="flex justify-between items-center group/item">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Min. Received</span>
                <div className="flex items-center gap-1.5"><span className="text-[10px] font-black text-white/60 tabular-nums italic">{parseFloat(minReceived).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span><span className="text-[8px] font-black text-blue-400/40 uppercase">{tokenOut?.symbol || '...'}</span></div>
              </div>
              <div className="mt-1 pt-1.5 border-t border-white/[0.03] flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                <span className="text-[7px] font-bold text-white uppercase tracking-widest">Est. Fees</span>
                <span className="text-[8px] font-black text-white/60 tabular-nums">0.10% + {networkFee}</span>
              </div>
            </div>
          ) : activeTab === 'stake' ? (
            <div className="flex flex-col gap-2 py-1 px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400/20 flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-emerald-400" /></div><span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Estimated APY</span></div>
                <span className="text-[11px] font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)] tabular-nums">12.54%</span>
              </div>
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400/20 flex items-center justify-center"><div className="w-0.5 h-0.5 rounded-full bg-purple-400" /></div><span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total Staked</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] font-black text-white/70 tabular-nums">${parseFloat(formatUnits(totalStaked, 6)).toLocaleString()}</span><span className="text-[7px] font-bold text-white/10 uppercase">TVL Pool</span></div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="premium-card p-4 flex items-center justify-center relative z-10">
        <button
          onClick={handleAction}
          disabled={!isConnected || !fromAmount || insufficientBalance || isActionPending || isActionConfirming || isApprovePending || isApproveConfirming || isSignPending || isInvalidLimit || !tokenIn || !tokenOut}
          className={`w-[92%] py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-700 relative overflow-hidden group border ${(!isConnected || !fromAmount || insufficientBalance || isActionPending || isActionConfirming || isApprovePending || isApproveConfirming || isSignPending || isInvalidLimit || !tokenIn || !tokenOut)
              ? 'bg-white/[0.02] text-white/10 cursor-not-allowed border-white/5 shadow-none'
              : (parseFloat(internalSlippage) > 3
                ? 'bg-rose-500 text-white hover:bg-rose-600 border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.3)]'
                : 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] border-white')
            }`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {isActionPending || isActionConfirming || isApprovePending || isApproveConfirming || isSignPending ? (
            <><Loader2 className="animate-spin" size={16} strokeWidth={3} /><span className="tracking-[0.5em] font-black text-[10px]">PROCESSING</span></>
          ) : !isConnected ? (
            <span className="tracking-[0.5em] font-black text-[10px]">CONNECT WALLET</span>
          ) : (!tokenIn || !tokenOut) ? (
            <span className="tracking-[0.5em] font-black text-[10px]">SELECT TOKEN</span>
          ) : !fromAmount ? (
            <span className="tracking-[0.5em] font-black text-[10px] opacity-40 uppercase">ENTER AMOUNT</span>
          ) : insufficientBalance ? (
            <span className="tracking-[0.3em] font-black text-[10px] text-red-500/80">INSUFFICIENT BALANCE</span>
          ) : isInvalidLimit ? (
            <span className="tracking-[0.2em] font-black text-[10px] text-red-500">INVALID LIMIT PRICE</span>
          ) : needsApproval ? (
            <span className="tracking-[0.5em] font-black text-[10px]">APPROVE {tokenIn.symbol}</span>
          ) : parseFloat(internalSlippage) > 3 ? (
            <span className="tracking-[0.3em] font-black text-[10px] uppercase">HIGH SLIPPAGE RISK</span>
          ) : (
            <span className="tracking-[0.6em] font-black text-[10px] uppercase">{activeTab === 'stake' ? (isUnstake ? 'UNSTAKE' : 'STAKE') : activeTab === 'limit' ? 'PLACE ORDER' : 'SWAP'}</span>
          )}
        </button>
      </div>
    </div>
  );
};
