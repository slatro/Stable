import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';

const TOKENS = [
  { symbol: 'mUSDC', name: 'Arc Dollar', decimals: 6, color: 'bg-emerald-500', addr: CONTRACT_ADDRESSES.mUSDC },
  { symbol: 'mEURC', name: 'Arc Euro', decimals: 18, color: 'bg-blue-600', addr: CONTRACT_ADDRESSES.mEURC },
  { symbol: 'mTRY', name: 'Arc Lira', decimals: 18, color: 'bg-red-500', addr: (CONTRACT_ADDRESSES as any).mTRY },
  { symbol: 'mGBP', name: 'Arc Pound', decimals: 18, color: 'bg-purple-600', addr: (CONTRACT_ADDRESSES as any).mGBP },
];

export const SwapCard = ({ slippage, setSlippage }: { slippage: string, setSlippage: (val: string) => void }) => {
  const { address, isConnected } = useAccount();
  const [fromAmount, setFromAmount] = useState('0');
  const [tokenIn, setTokenIn] = useState(TOKENS[1]); // Default EURC
  const [tokenOut, setTokenOut] = useState(TOKENS[0]); // Default USDC
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pool Selection Logic (Always assuming USDC is the other side for simplicity)
  const getPoolAddress = () => {
    const pools = (CONTRACT_ADDRESSES as any).POOLS;
    if (tokenIn.symbol === 'mUSDC') return pools[tokenOut.symbol];
    if (tokenOut.symbol === 'mUSDC') return pools[tokenIn.symbol];
    return null; // For now, we only support USDC pairs
  };

  const poolAddress = getPoolAddress();

  // 2. Read Balances
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

  // 3. Read Amount Out (Quote)
  const { data: amountOutRaw, refetch: refetchQuote } = useReadContract({
    address: poolAddress as `0x${string}`,
    abi: AMM_ABI,
    functionName: 'getAmountOut',
    args: [parseUnits(fromAmount || '0', tokenIn.decimals), tokenIn.addr],
    query: { enabled: !!poolAddress && parseFloat(fromAmount || '0') > 0 }
  });

  const toAmount = amountOutRaw ? formatUnits(amountOutRaw as bigint, tokenOut.decimals) : '0.00';

  // 4. Read Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenIn.addr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, poolAddress] : undefined,
    query: { enabled: !!address && !!poolAddress }
  });

  // 5. Write Transactions
  const { data: swapHash, writeContract: swapWrite, isPending: isSwapPending } = useWriteContract();
  const { isLoading: isSwapConfirming, isSuccess: isSwapConfirmed } = useWaitForTransactionReceipt({ hash: swapHash });

  const { data: approveHash, writeContract: approveWrite, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });

  // 6. Refresh Data
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

  // 7. Logic Helpers
  const needsApproval = isConnected && allowance !== undefined && 
    parseFloat(fromAmount || '0') > 0 && 
    (allowance as bigint) < parseUnits(fromAmount || '0', tokenIn.decimals);

  const handleAction = () => {
    if (!isConnected || !poolAddress) return;
    
    if (needsApproval) {
      approveWrite({
        address: tokenIn.addr as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [poolAddress, parseUnits(fromAmount, tokenIn.decimals)],
      });
    } else {
      const minAmountOut = amountOutRaw 
        ? (amountOutRaw as bigint) * BigInt(Math.floor((100 - parseFloat(slippage)) * 100)) / 10000n
        : 0n;

      swapWrite({
        address: poolAddress as `0x${string}`,
        abi: AMM_ABI,
        functionName: 'swap',
        args: [
          tokenIn.addr,
          parseUnits(fromAmount, tokenIn.decimals),
          minAmountOut
        ],
      });
    }
  };

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setFromAmount('0');
  };

  const TokenBox = ({ type, amount, setAmount, token, isReadOnly, balance }: any) => {
    const formattedBalance = balance ? parseFloat(formatUnits(balance as bigint, token.decimals)).toFixed(2) : '0.00';

    return (
      <div className="flex flex-col gap-1.5 mb-1">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-wider">
            <Wallet size={10} className="text-blue-400/50" />
            <span>Balance: {formattedBalance} {token.symbol}</span>
          </div>
          {!isReadOnly && parseFloat(formattedBalance) > 0 && (
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
            <div className={`w-8 h-8 rounded-full ${token.color} flex items-center justify-center shadow-lg shadow-black/40 relative overflow-hidden`}>
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
               <span className="text-[10px] font-bold text-white relative z-10">{token.symbol[1]}</span>
            </div>
            <div className="text-left relative">
              <select 
                value={token.symbol} 
                onChange={(e) => {
                  const selected = TOKENS.find(t => t.symbol === e.target.value);
                  if (selected) {
                    if (type === 'From') setTokenIn(selected);
                    else setTokenOut(selected);
                  }
                }}
                className="bg-transparent text-base font-bold text-white outline-none appearance-none cursor-pointer pr-4"
              >
                {TOKENS.map(t => (
                  <option key={t.symbol} value={t.symbol} className="bg-black text-white">{t.symbol}</option>
                ))}
              </select>
              <div className="text-[9px] font-medium text-white/20 uppercase tracking-tighter">{token.name}</div>
              <ChevronDown size={12} className="absolute right-0 top-1 text-white/20 pointer-events-none" />
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

  const isButtonLoading = isSwapPending || isSwapConfirming || isApprovePending || isApproveConfirming;
  const noPool = !poolAddress;

  return (
    <div className="flex flex-col h-[506px] w-full max-w-[480px] justify-between group/card">
      {/* HEADER CARD */}
      <div className="premium-card p-4 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-2 pl-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <h1 className="text-xs font-black text-white/90 uppercase tracking-[0.3em]">Direct Swap</h1>
        </div>
        <button className="p-1.5 rounded-xl hover:bg-white/[0.05] transition-all text-white/20 hover:text-white">
          <Settings size={16} />
        </button>
      </div>

      {/* INPUT CARD */}
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
          <button 
            onClick={handleSwapTokens}
            className="z-10 w-9 h-9 rounded-full bg-[#0a0a0b] border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] group/swapBtn hover:border-blue-500/50"
          >
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

      {/* FOOTER ACTION CARD */}
      <div className="premium-card p-5 flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Slippage</span>
            <div className="h-px w-4 bg-white/10" />
            <span className="text-[10px] font-bold text-blue-400/80">{slippage}%</span>
          </div>
          <button 
            onClick={() => setIsEditingSlippage(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all"
          >
            <Edit2 size={10} />
          </button>
        </div>

        <button 
          onClick={handleAction}
          disabled={!isConnected || isButtonLoading || parseFloat(fromAmount || '0') <= 0 || noPool}
          className={`group relative overflow-hidden w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 ${
            !isConnected || isButtonLoading || parseFloat(fromAmount || '0') <= 0 || noPool
              ? "bg-white/[0.02] text-white/10 border border-white/5 cursor-not-allowed"
              : "bg-white text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-95"
          }`}
        >
          {isButtonLoading ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 size={14} className="animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              {!isConnected ? "Connect Wallet" : noPool ? "Pool Not Found" : needsApproval ? `Approve ${tokenIn.symbol}` : "Execute Swap"}
              {!isButtonLoading && isConnected && parseFloat(fromAmount || '0') > 0 && !noPool && <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />}
            </div>
          )}
        </button>

        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/10 tracking-widest uppercase">
            <RefreshCw size={10} className={`text-blue-500/40 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Rate Updated</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-white/10 uppercase tracking-widest">
            Protocol Fee: <span className="text-white/30">0.05%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
