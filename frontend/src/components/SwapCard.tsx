import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';

const TOKEN_ICONS: Record<string, string> = {
  mUSDC: '/stable_logos/usdc.png',
  mEURC: '/stable_logos/eurc.png',
  mTRYC: '/stable_logos/tryc.png',
  mGBPC: '/stable_logos/gbpc.png',
  mJPYC: '/stable_logos/jpyc.png',
};

const TOKENS = [
  { symbol: 'mUSDC', name: 'Arc Dollar', decimals: 6, addr: CONTRACT_ADDRESSES.mUSDC },
  { symbol: 'mEURC', name: 'Arc Euro', decimals: 18, addr: CONTRACT_ADDRESSES.mEURC },
  { symbol: 'mTRYC', name: 'Arc Lira', decimals: 18, addr: CONTRACT_ADDRESSES.mTRYC },
  { symbol: 'mGBPC', name: 'Arc Pound', decimals: 18, addr: CONTRACT_ADDRESSES.mGBPC },
  { symbol: 'mJPYC', name: 'Arc Yen', decimals: 18, addr: CONTRACT_ADDRESSES.mJPYC },
];

// TokenBox moved outside to prevent re-creation and focus loss
const TokenBox = ({ type, amount, setAmount, token, isReadOnly, balance }: any) => {
  const formattedBalance = balance ? parseFloat(formatUnits(balance as bigint, token.decimals)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00';

  return (
    <div className="flex flex-col gap-1.5 mb-1">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-wider">
          <Wallet size={10} className="text-blue-400/50" />
          <span>Balance: {formattedBalance} {token.symbol}</span>
        </div>
        {!isReadOnly && parseFloat(formattedBalance.replace(/,/g, '')) > 0 && (
          <button 
            onClick={() => setAmount(formatUnits(balance as bigint, token.decimals))}
            className="text-[9px] font-bold text-blue-400 hover:text-white transition-colors uppercase"
          >
            Max
          </button>
        )}
      </div>
      
      <div className="bg-white/5 border border-white/[0.08] backdrop-blur-md rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.08] transition-all group border-transparent focus-within:border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 p-1 flex items-center justify-center shadow-lg shadow-black/40 relative overflow-hidden">
             <img src={TOKEN_ICONS[token.symbol]} alt={token.symbol} className="w-full h-full object-contain" />
          </div>
          <div className="text-left relative">
            <div className="text-base font-bold text-white pr-4 flex items-center gap-1">
              {token.symbol}
              <ChevronDown size={12} className="text-white/20" />
            </div>
            <div className="text-[9px] font-medium text-white/20 uppercase tracking-tighter">{token.name}</div>
          </div>
        </div>

        <div className="text-right">
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={isReadOnly}
            placeholder="0.00"
            className={`bg-transparent text-2xl font-bold text-white text-right outline-none w-32 placeholder-white/5 ${isReadOnly ? 'opacity-60 cursor-default' : 'cursor-text'}`}
          />
          {isReadOnly && (
            <div className="text-[9px] font-medium text-white/10 uppercase tracking-widest mt-1">Estimated Output</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SwapCard = ({ slippage, setSlippage }: { slippage: string, setSlippage: (val: string) => void }) => {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    document.title = 'Swap | ArcFX Protocol';
  }, []);

  const [fromAmount, setFromAmount] = useState('0');
  const [tokenIn, setTokenIn] = useState(TOKENS[1]); 
  const [tokenOut, setTokenOut] = useState(TOKENS[0]); 
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getPoolAddress = () => {
    const pools = (CONTRACT_ADDRESSES as any).POOLS;
    if (tokenIn.symbol === 'mUSDC') return pools[tokenOut.symbol];
    if (tokenOut.symbol === 'mUSDC') return pools[tokenIn.symbol];
    return null;
  };

  const poolAddress = getPoolAddress();

  const { data: balanceIn, refetch: refetchIn } = useReadContract({
    address: tokenIn.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: balanceOut, refetch: refetchOut } = useReadContract({
    address: tokenOut.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { data: amountOutRaw, refetch: refetchQuote } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'getAmountOut',
    args: [parseUnits(fromAmount || '0', tokenIn.decimals), tokenIn.addr],
    query: { enabled: !!poolAddress && parseFloat(fromAmount || '0') > 0 }
  });

  const toAmount = amountOutRaw ? formatUnits(amountOutRaw as bigint, tokenOut.decimals) : '0.00';

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, poolAddress] : undefined,
    query: { enabled: !!address && !!poolAddress }
  });

  const { data: swapHash, writeContract: swapWrite, isPending: isSwapPending } = useWriteContract();
  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapHash });

  const { data: approveHash, writeContract: approveWrite, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchIn(), refetchOut(), refetchQuote(), refetchAllowance()]);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  useEffect(() => {
    if (isSwapConfirmed || isApproveConfirmed) {
      handleRefresh();
      if (isSwapConfirmed) setFromAmount('0');
    }
  }, [isSwapConfirmed, isApproveConfirmed]);

  const needsApproval = isConnected && allowance !== undefined && 
    parseFloat(fromAmount || '0') > 0 && 
    (allowance as bigint) < parseUnits(fromAmount || '0', tokenIn.decimals);

  const handleAction = () => {
    if (!isConnected || !poolAddress) return;
    if (needsApproval) {
      approveWrite({ address: tokenIn.addr as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [poolAddress, parseUnits(fromAmount, tokenIn.decimals)] });
    } else {
      const minAmountOut = amountOutRaw ? (amountOutRaw as bigint) * BigInt(Math.floor((100 - parseFloat(slippage)) * 100)) / 10000n : 0n;
      swapWrite({ address: poolAddress as `0x${string}`, abi: AMM_ABI, functionName: 'swap', args: [tokenIn.addr, parseUnits(fromAmount, tokenIn.decimals), minAmountOut] });
    }
  };

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setFromAmount('0');
  };

  const isButtonLoading = isSwapPending || isSwapConfirming || isApprovePending || isApproveConfirming;
  const noPool = !poolAddress;

  return (
    <div className="flex flex-col h-[506px] w-full max-w-[480px] justify-between group/card">
      <div className="premium-card p-4 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-2 pl-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h1 className="text-xs font-black text-white/90 uppercase tracking-[0.3em]">Direct Swap</h1>
        </div>
        <button className="p-1.5 rounded-xl hover:bg-white/[0.05] transition-all text-white/20 hover:text-white"><Settings size={16} /></button>
      </div>

      <div className="premium-card p-5 flex-1 flex flex-col justify-center relative mx-0 my-[6px]">
        <TokenBox 
          type="From" 
          token={tokenIn}
          amount={fromAmount} 
          setAmount={setFromAmount} 
          isReadOnly={false} 
          balance={balanceIn}
        />
        
        <div className="relative h-2 flex items-center justify-center my-4">
          <div className="absolute inset-x-0 h-px bg-white/[0.04]" />
          <button onClick={handleSwapTokens} className="z-10 w-9 h-9 rounded-full bg-[#0a0a0b] border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] group/swapBtn hover:border-blue-500/50">
            <ArrowUpDown size={14} className="text-white/40 group-hover/swapBtn:text-blue-400 group-hover/swapBtn:rotate-180 transition-all duration-500" />
          </button>
        </div>

        <TokenBox 
          type="To" 
          token={tokenOut}
          amount={toAmount} 
          setAmount={() => {}} 
          isReadOnly={true} 
          balance={balanceOut}
        />
      </div>

      <div className="premium-card p-5 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Slippage</span>
            <div className="h-px w-4 bg-white/10" /><span className="text-[10px] font-bold text-blue-400/80">{slippage}%</span>
          </div>
          <button onClick={() => setIsEditingSlippage(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all"><Edit2 size={10} /></button>
        </div>

        <button onClick={handleAction} disabled={!isConnected || isButtonLoading || parseFloat(fromAmount || '0') <= 0 || noPool} className={`group relative overflow-hidden w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 ${!isConnected || isButtonLoading || parseFloat(fromAmount || '0') <= 0 || noPool ? "bg-white/[0.02] text-white/10 border border-white/5 cursor-not-allowed" : "bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95"}`}>
          {isButtonLoading ? <div className="flex items-center justify-center gap-3"><Loader2 size={14} className="animate-spin" /><span>Processing...</span></div> : <div className="flex items-center justify-center gap-3">{!isConnected ? "Connect Wallet" : noPool ? "Pool Not Found" : needsApproval ? `Approve ${tokenIn.symbol}` : "Execute Swap"}{!isButtonLoading && isConnected && parseFloat(fromAmount || '0') > 0 && !noPool && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}</div>}
        </button>

        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/10 tracking-widest uppercase"><RefreshCw size={10} className={`text-blue-500/40 ${isRefreshing ? 'animate-spin' : ''}`} /><span>Rate Updated</span></div>
          <div className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
            Liquidity: <span className="text-white/30">Deep (Low Impact)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
