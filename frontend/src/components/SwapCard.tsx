import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw, Loader2, ArrowRight, Zap, TrendingUp, ShieldCheck, Droplets } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance, useGasPrice } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import ERC20_ABI from '../abis/ERC20.json';
import { usePrices } from '../context/PriceContext';

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
    <div className="flex flex-col gap-2 p-4 bg-transparent border border-white/5 rounded-xl group transition-all hover:bg-white/[0.02] hover:border-white/10">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{type}</span>
        <div className="flex items-center gap-1.5">
          <Wallet size={10} className="text-white/20" />
          <span className="text-[9px] font-bold text-white/40 tabular-nums">
            {balance ? parseFloat(balance.formatted).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0.00'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isReadOnly}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-black text-white outline-none placeholder:text-white/10 tabular-nums"
          />
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
  setTokenOut
}: { 
  tokenIn: any,
  setTokenIn: (t: any) => void,
  tokenOut: any,
  setTokenOut: (t: any) => void
}) => {
  const { address, isConnected } = useAccount();
  const [fromAmount, setFromAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'market' | 'limit' | 'stake'>('market');
  const [localAllowanceOverride, setLocalAllowanceOverride] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAutoSlippage, setIsAutoSlippage] = useState(true);
  const [internalSlippage, setInternalSlippage] = useState('0.5');
  const [isUnstake, setIsUnstake] = useState(false);

  // DYNAMIC TOKEN FILTERING BASED ON ACTIVE TAB
  const filteredTokens = useMemo(() => {
    if (activeTab === 'stake') {
      return TOKENS.filter(t => t.symbol === 'aUSDC' || t.symbol === 'astUSDC');
    }
    // Market & Limit: No USDC, No astUSDC. Only Platform Tokens.
    return TOKENS.filter(t => ['aUSDC', 'aTRYC', 'aEURC', 'aJPYC', 'aGBPC'].includes(t.symbol));
  }, [activeTab]);

  const [isSelectOpen, setIsSelectOpen] = useState<'in' | 'out' | null>(null);

  // CLICK OUTSIDE HANDLER
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

  // STAKE MODE CONSTRAINTS
  useEffect(() => {
    if (activeTab === 'stake') {
      const ausdc = TOKENS.find(t => t.symbol === 'aUSDC');
      const astusdc = TOKENS.find(t => t.symbol === 'astUSDC');
      if (ausdc) setTokenIn(ausdc);
      if (astusdc) setTokenOut(astusdc);
    } else {
      // Ensure we don't stay on astUSDC or USDC when switching to Market/Limit
      const platformSymbols = ['aUSDC', 'aTRYC', 'aEURC', 'aJPYC', 'aGBPC'];
      if (tokenIn && !platformSymbols.includes(tokenIn?.symbol)) setTokenIn(TOKENS.find(t => t.symbol === 'aUSDC') || TOKENS[1]);
      if (tokenOut && !platformSymbols.includes(tokenOut?.symbol)) setTokenOut(TOKENS.find(t => t.symbol === 'aTRYC') || TOKENS[3]);
    }
  }, [activeTab]);

  const { data: pairAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: tokenIn && tokenOut ? [tokenIn.addr, tokenOut.addr] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut }
  });

  const { data: allowance } = useReadContract({
    address: tokenIn?.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && tokenIn ? [address, CONTRACT_ADDRESSES.ROUTER] : undefined,
    query: { enabled: !!tokenIn && !!address }
  });

  const needsApproval = isConnected && !localAllowanceOverride && (
    allowance !== undefined && 
    tokenIn &&
    typeof allowance === 'bigint' && 
    allowance < parseUnits(fromAmount || '0', tokenIn?.decimals || 18)
  );

  const { data: approveHash, writeContract: approveWrite, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ hash: approveHash });

  const { prices, recordTrade, liquidity } = usePrices();
  const { data: gasPrice } = useGasPrice();

  const toAmount = useMemo(() => {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || !tokenIn || !tokenOut) return '';
    const priceIn = prices[tokenIn.symbol]?.price || 1;
    const priceOut = prices[tokenOut.symbol]?.price || 1;
    return (parseFloat(fromAmount) * priceIn / priceOut).toFixed(tokenOut.decimals === 6 ? 2 : 4);
  }, [fromAmount, tokenIn, tokenOut, prices]);

  const priceImpact = useMemo(() => {
    if (!fromAmount || !tokenIn || !prices[tokenIn.symbol]) return 0.01;
    const amountUsd = parseFloat(fromAmount) * (prices[tokenIn.symbol]?.price || 1);
    // Simple impact formula: (Trade / Pool) * 100, scaled for demo
    const impact = (amountUsd / liquidity) * 100;
    return Math.max(0.01, impact).toFixed(2);
  }, [fromAmount, tokenIn, prices, liquidity]);

  const networkFee = useMemo(() => {
    if (!gasPrice) return '$0.001';
    // Assume 200k gas for swap * gasPrice
    const feeNative = Number(gasPrice) * 200000;
    const feeUsd = (feeNative / 1e18) * (prices['aUSDC']?.price || 1);
    if (feeUsd < 0.001) return '< $0.001';
    return `~$${feeUsd.toFixed(4)}`;
  }, [gasPrice, prices]);

  const { data: actionHash, writeContract: actionWrite, isPending: isActionPending } = useWriteContract();
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess } = useWaitForTransactionReceipt({ hash: actionHash });

  // UPDATE GLOBAL STATS ON SUCCESS
  useEffect(() => {
    if (isActionSuccess && fromAmount && tokenIn) {
      const price = prices[tokenIn.symbol]?.price || 1;
      const usdValue = parseFloat(fromAmount) * price;
      if (usdValue > 0) recordTrade(usdValue);
    }
  }, [isActionSuccess, fromAmount, tokenIn, prices, recordTrade]);

  const handleAction = async () => {
    if (!isConnected || !address || !tokenIn || !tokenOut) return;

    if (needsApproval && tokenIn) {
      approveWrite({ address: tokenIn.addr as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [CONTRACT_ADDRESSES.ROUTER, maxUint256] });
      setLocalAllowanceOverride(true);
    } else {
      if (activeTab === 'limit') {
        actionWrite({ address: pairAddress as `0x${string}`, abi: AMM_ABI as any, functionName: 'placeLimitOrder', args: [tokenIn.addr, parseUnits(fromAmount, tokenIn.decimals), parseUnits(limitPrice, tokenOut.decimals)] });
      } else if (activeTab === 'stake') {
        actionWrite({ address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`, abi: ROUTER_ABI as any, functionName: 'swapExactTokensForTokens', args: [parseUnits(fromAmount, tokenIn.decimals), 0n, [tokenIn.addr, tokenOut.addr], address, BigInt(Math.floor(Date.now() / 1000) + 1200)] });
      } else {
        actionWrite({ address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`, abi: ROUTER_ABI as any, functionName: 'swapExactTokensForTokens', args: [parseUnits(fromAmount, tokenIn.decimals), 0n, [tokenIn.addr, tokenOut.addr], address, BigInt(Math.floor(Date.now() / 1000) + 1200)] });
      }
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[480px] gap-2 animate-in zoom-in-95 duration-500">
      {/* 1. HEADER (TABS BOX) */}
      <div className="premium-card h-12 p-1 flex items-center justify-between">
        <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 relative z-10 ml-8 mr-2">
          <button onClick={() => setActiveTab('market')} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all py-1.5 rounded-xl ${activeTab === 'market' ? 'text-white bg-white/10' : 'text-white/45 hover:text-white/70'}`}>Market</button>
          <button onClick={() => setActiveTab('limit')} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all py-1.5 rounded-xl ${activeTab === 'limit' ? 'text-white bg-white/10' : 'text-white/45 hover:text-white/70'}`}>Limit</button>
          <button onClick={() => setActiveTab('stake')} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all py-1.5 rounded-xl ${activeTab === 'stake' ? 'text-white bg-white/10' : 'text-white/45 hover:text-white/70'}`}>Stake</button>
        </div>
        
        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-xl transition-all z-20 ${showSettings ? 'text-white bg-white/10' : 'text-white/20 hover:text-white'}`}>
          <Settings size={14} />
        </button>

        {showSettings && (
          <div className="absolute top-12 right-1 w-48 glass-frame p-3 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200 shadow-2xl backdrop-blur-3xl bg-black/80 border-white/20">
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

      {/* 2. MAIN BODY (INPUTS BOX) */}
      <div className="premium-card h-[380px] p-6 flex flex-col justify-between relative z-20">
        <div className="flex flex-col gap-6 relative z-30">
          {/* Top section now cleaner */}

          <div className={`relative ${isSelectOpen === 'in' ? 'z-[50]' : 'z-10'}`}>
            <TokenBox 
              type="From" 
              token={tokenIn} 
              amount={fromAmount} 
              setAmount={setFromAmount} 
              isReadOnly={false} 
              userAddress={address} 
              onTokenSelect={{ 
                isOpen: isSelectOpen === 'in',
                onToggle: () => toggleSelect('in'),
                onSelect: (t: any) => { 
                  if (tokenOut?.symbol === t.symbol) setTokenOut(null);
                  setTokenIn(t); 
                  setIsSelectOpen(null); 
                },
                tokens: filteredTokens
              }} 
              isLocked={activeTab === 'stake'} 
            />
          </div>
          
          <div className="relative h-2 flex items-center justify-center my-1 z-0">
            <button 
              onClick={() => { 
                const t = tokenIn; 
                setTokenIn(tokenOut); 
                setTokenOut(t); 
                if (activeTab === 'stake') setIsUnstake(!isUnstake);
              }} 
              className="z-10 w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 group backdrop-blur-xl"
            >
              <ArrowUpDown size={12} className="text-white/30 group-hover:text-white" />
            </button>
          </div>

          <div className={`relative ${isSelectOpen === 'out' ? 'z-[50]' : 'z-10'}`}>
            <TokenBox 
              type="To" 
              token={tokenOut} 
              amount={toAmount} 
              setAmount={() => {}} 
              isReadOnly={true} 
              userAddress={address} 
              onTokenSelect={{ 
                isOpen: isSelectOpen === 'out',
                onToggle: () => toggleSelect('out'),
                onSelect: (t: any) => { 
                  if (tokenIn?.symbol === t.symbol) setTokenIn(null);
                  setTokenOut(t); 
                  setIsSelectOpen(null); 
                },
                tokens: filteredTokens
              }} 
              isLocked={activeTab === 'stake'} 
            />
          </div>
        </div>

        {/* TRADE DETAILS PLACED AT THE BOTTOM OF THE FIXED BODY BOX */}
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
                  <input 
                    value={limitPrice} 
                    onChange={(e) => setLimitPrice(e.target.value)} 
                    className="bg-transparent text-lg font-black text-white text-right outline-none w-24 tabular-nums placeholder:text-white/10" 
                    placeholder="0.0000"
                  />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">{tokenOut?.symbol || '...'}</span>
                    <span className="text-[7px] font-bold text-white/10 uppercase">Target</span>
                  </div>
                </div>
              </div>
          ) : activeTab === 'market' ? (
            <div className="flex flex-col gap-3 py-2 px-1">
              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/20 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Price Impact</span>
                </div>
                <span className={`text-[10px] font-black tabular-nums ${parseFloat(priceImpact) > 1 ? 'text-red-400' : 'text-emerald-400/90'}`}>
                  {parseFloat(priceImpact) < 0.01 ? '< 0.01%' : `${priceImpact}%`}
                </span>
              </div>

              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400/20 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-blue-400" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Min. Received</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-white/70 tabular-nums italic">{toAmount}</span>
                  <span className="text-[9px] font-black text-blue-400/80 uppercase tracking-tighter">{tokenOut?.symbol || '...'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400/20 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-purple-400" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Network Fee</span>
                </div>
                <span className="text-[10px] font-black text-white/50 tabular-nums">{networkFee}</span>
              </div>
            </div>
          ) : activeTab === 'stake' ? (
            <div className="flex flex-col gap-3 py-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/20 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Estimated APY</span>
                </div>
                <span className="text-[11px] font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)] tabular-nums">12.54%</span>
              </div>

              <div className="flex justify-between items-center group">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400/20 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 rounded-full bg-purple-400" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Total Staked</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/70 tabular-nums">$1,248,590</span>
                  <span className="text-[7px] font-bold text-white/10 uppercase">TVL Pool</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. FOOTER (ACTION BUTTON BOX) */}
      <div className="premium-card p-4 flex items-center justify-center relative z-10">
        <button 
          onClick={handleAction} 
          disabled={!isConnected || !fromAmount || isActionPending || isApprovePending || !tokenIn || !tokenOut} 
          className={`w-[92%] py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all duration-700 relative overflow-hidden group border ${
            (!isConnected || !fromAmount || isActionPending || isApprovePending || !tokenIn || !tokenOut) 
              ? 'bg-white/[0.02] text-white/10 cursor-not-allowed border-white/5 shadow-none' 
              : 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] border-white'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {isActionPending || isActionConfirming || isApprovePending || isApproveConfirming ? (
            <>
              <Loader2 className="animate-spin" size={16} strokeWidth={3} />
              <span className="tracking-[0.5em] font-black text-[10px]">PROCESSING</span>
            </>
          ) : !isConnected ? (
            <span className="tracking-[0.5em] font-black text-[10px]">CONNECT WALLET</span>
          ) : (!tokenIn || !tokenOut) ? (
            <span className="tracking-[0.5em] font-black text-[10px]">SELECT TOKEN</span>
          ) : !fromAmount ? (
            <span className="tracking-[0.5em] font-black text-[10px] opacity-40 uppercase">ENTER AMOUNT</span>
          ) : needsApproval ? (
            <span className="tracking-[0.5em] font-black text-[10px]">APPROVE {tokenIn.symbol}</span>
          ) : (
            <span className="tracking-[0.6em] font-black text-[10px] uppercase">
              {activeTab === 'stake' 
                ? (isUnstake ? 'UNSTAKE' : 'STAKE') 
                : activeTab === 'limit' ? 'PLACE ORDER' : 'SWAP'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
