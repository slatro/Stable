import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw, Loader2 } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import ERC20_ABI from '../abis/ERC20.json';

export const SwapCard = ({ slippage, setSlippage }: { slippage: string, setSlippage: (val: string) => void }) => {
  const { address, isConnected } = useAccount();
  const [fromAmount, setFromAmount] = useState('0');
  const [toAmount, setToAmount] = useState('0');
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false); // false: EURC -> USDC, true: USDC -> EURC

  // 1. Contract Constants
  const tokenInAddress = isSwapped ? CONTRACT_ADDRESSES.mUSDC : CONTRACT_ADDRESSES.mEURC;
  const tokenOutAddress = isSwapped ? CONTRACT_ADDRESSES.mEURC : CONTRACT_ADDRESSES.mUSDC;
  const tokenInDecimals = isSwapped ? 6 : 18;
  const tokenOutDecimals = isSwapped ? 18 : 6;
  const tokenInSymbol = isSwapped ? 'mUSDC' : 'mEURC';
  const tokenOutSymbol = isSwapped ? 'mEURC' : 'mUSDC';

  // 2. Read Balances
  const { data: balanceIn, refetch: refetchIn } = useReadContract({
    address: tokenInAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: balanceOut, refetch: refetchOut } = useReadContract({
    address: tokenOutAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // 3. Read Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenInAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, CONTRACT_ADDRESSES.AMM],
  });

  // 4. Swap Logic
  const { data: hash, writeContract, isPending: isSwapPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // 5. Approval Logic
  const { data: approveHash, writeContract: approveWrite, isPending: isApprovePending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });

  // Refetch after success
  useEffect(() => {
    if (isConfirmed || isApproveConfirmed) {
      refetchIn();
      refetchOut();
      refetchAllowance();
      if (isConfirmed) setFromAmount('0');
    }
  }, [isConfirmed, isApproveConfirmed]);

  const needsApproval = isConnected && allowance !== undefined && 
    parseFloat(fromAmount) > 0 && 
    (allowance as bigint) < parseUnits(fromAmount, tokenInDecimals);

  const handleAction = () => {
    if (!isConnected) return;
    
    if (needsApproval) {
      approveWrite({
        address: tokenInAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.AMM, parseUnits(fromAmount, tokenInDecimals)],
      });
    } else {
      writeContract({
        address: CONTRACT_ADDRESSES.AMM as `0x${string}`,
        abi: AMM_ABI,
        functionName: 'swap',
        args: [
          tokenInAddress,
          tokenOutAddress,
          parseUnits(fromAmount, tokenInDecimals)
        ],
      });
    }
  };

  const handleSwapTokens = () => {
    setIsSwapped(!isSwapped);
    setFromAmount('0');
    setToAmount('0');
  };

  const TokenBox = ({ type, amount, setAmount, symbol, name, iconColor, isReadOnly, balance, decimals }: any) => {
    const formattedBalance = balance ? parseFloat(formatUnits(balance as bigint, decimals)).toFixed(2) : '0.00';

    return (
      <div className="flex flex-col gap-1.5 mb-1">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-wider">
            <Wallet size={10} style={{ color: '#FDF5E6' }} />
            <span>Balance: {formattedBalance} {symbol}</span>
          </div>
        </div>
        
        <div className="bg-white/10 border border-white/[0.12] backdrop-blur-md rounded-[12px] p-3 flex items-center justify-between hover:bg-white/[0.15] transition-all group">
          <div className="flex items-center gap-3 px-2 py-0.5 rounded-[12px]">
            <div className={`w-7 h-7 rounded-full ${iconColor} flex items-center justify-center shadow-lg shadow-black/20`}>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20" />
            </div>
            <div className="text-left">
              <span className="font-bold text-base text-white">{symbol}</span>
              <div className="text-[9px] font-medium text-white/20">{name}</div>
            </div>
          </div>

          <div className="text-right">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              readOnly={isReadOnly}
              placeholder="0.0"
              className={`bg-transparent text-xl font-bold text-white text-right outline-none w-28 placeholder-white/10 ${isReadOnly ? 'opacity-60' : ''}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const fromToken = isSwapped ? { symbol: 'mUSDC', name: 'Arc Dollar', color: 'bg-emerald-500', balance: balanceIn, decimals: 6 } : { symbol: 'mEURC', name: 'Arc Euro', color: 'bg-blue-600', balance: balanceIn, decimals: 18 };
  const toToken = isSwapped ? { symbol: 'mEURC', name: 'Arc Euro', color: 'bg-blue-600', balance: balanceOut, decimals: 18 } : { symbol: 'mUSDC', name: 'Arc Dollar', color: 'bg-emerald-500', balance: balanceOut, decimals: 6 };

  const isLoading = isSwapPending || isConfirming || isApprovePending || isApproveConfirming;

  return (
    <div className="flex flex-col h-[506px] w-full max-w-[480px] justify-between">
      {/* HEADER CARD */}
      <div className="premium-card p-3.5 md:p-4 flex items-center justify-center relative shrink-0">
        <h1 className="text-sm md:text-base font-black text-white pl-2 text-shadow-premium">Swap</h1>
        <button className="absolute right-4 p-1.5 rounded-xl hover:bg-white/[0.05] transition-all text-white/20 hover:text-white">
          <Settings size={18} />
        </button>
      </div>

      {/* INPUT CARD */}
      <div className="premium-card p-4 md:p-5 flex-1 flex flex-col justify-center relative mx-0 my-[5px]">
        <TokenBox 
          type="From" 
          symbol={fromToken.symbol} 
          name={fromToken.name} 
          amount={fromAmount} 
          setAmount={setFromAmount} 
          iconColor={fromToken.color} 
          isReadOnly={false} 
          balance={fromToken.balance}
          decimals={fromToken.decimals}
        />
        
        <div className="relative h-1 flex items-center justify-center my-3">
          <div className="absolute inset-x-0 h-px bg-white/[0.04]" />
          <button 
            onClick={handleSwapTokens}
            className="z-10 w-7 h-7 rounded-full bg-[#0a0a0c] border border-white/[0.12] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl group/swap"
            style={{ color: '#FDF5E6' }}
          >
            <ArrowUpDown size={12} className="group-hover/swap:rotate-180 transition-transform duration-500" />
          </button>
        </div>

        <TokenBox 
          type="To" 
          symbol={toToken.symbol} 
          name={toToken.name} 
          amount={toAmount} 
          setAmount={setToAmount} 
          iconColor={toToken.color} 
          isReadOnly={true} 
          balance={toToken.balance}
          decimals={toToken.decimals}
        />
      </div>

      {/* FOOTER ACTION CARD */}
      <div className="premium-card p-3.5 md:p-4 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Slippage Tolerance</span>
          <div className="flex items-center gap-2 bg-[#FDF5E6]/5 border border-[#FDF5E6]/10 px-2.5 py-1 rounded-xl">
            <span className="text-[9px] font-black" style={{ color: '#FDF5E6' }}>{slippage}%</span>
          </div>
        </div>

        <button 
          onClick={handleAction}
          disabled={!isConnected || isLoading || parseFloat(fromAmount) <= 0}
          className={`w-full py-2 md:py-2.5 rounded-[12px] text-white font-black text-sm md:text-base transition-all shadow-xl active:scale-95 text-shadow-premium flex items-center justify-center gap-2 ${
            !isConnected || isLoading || parseFloat(fromAmount) <= 0
              ? "bg-white/5 text-white/20 cursor-not-allowed"
              : "bg-gradient-to-b from-blue-600 to-[#111827] hover:from-blue-500 hover:to-[#1f2937]"
          }`}
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : null}
          {!isConnected ? "Connect Wallet" : needsApproval ? `Approve ${tokenInSymbol}` : "Swap"}
        </button>

        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/20 tracking-tight">
            <RefreshCw size={10} className={`text-blue-500/60 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Predicted Rate: ~1.17 {tokenInSymbol}/{tokenOutSymbol}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest">
            Fee <span className="text-white/40">0.3%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
