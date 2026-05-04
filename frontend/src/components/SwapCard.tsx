import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw } from 'lucide-react';

/* 
  ARCFX TERMINAL - FINAL SEAL v2.7
  - Implementation: Strict 506px Total Height for the SwapCard stack.
  - Alignment: Synchronized with the 506px chart height.
  - Theme: Imperial Cream (#FDF5E6).
*/

export const SwapCard = ({ slippage, setSlippage }: { slippage: string, setSlippage: (val: string) => void }) => {
  const [fromAmount, setFromAmount] = useState('10');
  const [toAmount, setToAmount] = useState('11.73');
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rate, setRate] = useState(1.1733); 
  const [isSwapped, setIsSwapped] = useState(false);

  const fetchLiveRate = async () => {
    try {
      const response = await fetch('https://api.coinbase.com/v2/prices/EUR-USD/spot');
      const data = await response.json();
      if (data?.data?.amount) {
        setRate(parseFloat(data.data.amount));
      }
    } catch (error) {
      console.error('API Error:', error);
    }
  };

  useEffect(() => {
    fetchLiveRate();
    const interval = setInterval(handleRefresh, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isNaN(parseFloat(fromAmount))) {
      const currentRate = isSwapped ? (1 / rate) : rate;
      setToAmount((parseFloat(fromAmount) * currentRate).toFixed(4));
    }
  }, [fromAmount, rate, isSwapped]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveRate();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSwapTokens = () => {
    setIsSwapped(!isSwapped);
    const temp = fromAmount;
    setFromAmount(toAmount);
    setToAmount(temp);
  };

  const TokenBox = ({ type, amount, setAmount, symbol, name, iconColor, isReadOnly }: any) => {
    const finalUsdValue = symbol === 'mEURC' ? (parseFloat(amount || '0') * rate).toFixed(2) : (parseFloat(amount || '0') * 1.0).toFixed(2);

    return (
      <div className="flex flex-col gap-1.5 mb-1">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-wider">
            <Wallet size={10} style={{ color: '#FDF5E6' }} />
            <span>{type}: 0x2EE5...1704</span>
          </div>
          <div className="text-[9px] font-bold text-white/30 flex items-center gap-1">
            <Settings size={9} /> {type === 'From' ? '2,450.00' : '1,200.00'}
          </div>
        </div>
        
        <div className="bg-white/10 border border-white/[0.12] backdrop-blur-md rounded-[12px] p-3 flex items-center justify-between hover:bg-white/[0.15] transition-all group">
          <button className="flex items-center gap-3 px-2 py-0.5 rounded-[12px] hover:bg-white/5 transition-all">
            <div className={`w-7 h-7 rounded-full ${iconColor} flex items-center justify-center shadow-lg shadow-black/20`}>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="font-bold text-base text-white">{symbol}</span>
                <ChevronDown size={12} className="text-white/30" />
              </div>
              <div className="text-[9px] font-medium text-white/20">{name}</div>
            </div>
          </button>

          <div className="text-right">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              readOnly={isReadOnly}
              className={`bg-transparent text-xl font-bold text-white text-right outline-none w-28 placeholder-white/10 ${isReadOnly ? 'opacity-60' : ''}`}
            />
            <div className="text-[9px] font-medium text-white/10">~{finalUsdValue} USD</div>
          </div>
        </div>
      </div>
    );
  };

  const fromToken = isSwapped ? { symbol: 'mUSDC', name: 'Arc Dollar', color: 'bg-emerald-500' } : { symbol: 'mEURC', name: 'Arc Euro', color: 'bg-blue-600' };
  const toToken = isSwapped ? { symbol: 'mEURC', name: 'Arc Euro', color: 'bg-blue-600' } : { symbol: 'mUSDC', name: 'Arc Dollar', color: 'bg-emerald-500' };

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
        <TokenBox type="From" symbol={fromToken.symbol} name={fromToken.name} amount={fromAmount} setAmount={setFromAmount} iconColor={fromToken.color} isReadOnly={false} />
        
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

        <TokenBox type="To" symbol={toToken.symbol} name={toToken.name} amount={toAmount} setAmount={setToAmount} iconColor={toToken.color} isReadOnly={true} />
      </div>

      {/* FOOTER ACTION CARD */}
      <div className="premium-card p-3.5 md:p-4 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Slippage Tolerance</span>
          <div 
            onClick={() => setIsEditingSlippage(true)}
            className="flex items-center gap-2 bg-[#FDF5E6]/5 border border-[#FDF5E6]/10 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-[#FDF5E6]/10 transition-all"
          >
            {isEditingSlippage ? (
              <input 
                autoFocus
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                onBlur={() => setIsEditingSlippage(false)}
                className="bg-transparent text-[9px] font-black w-8 outline-none"
                style={{ color: '#FDF5E6' }}
              />
            ) : (
              <span className="text-[9px] font-black" style={{ color: '#FDF5E6' }}>{slippage}%</span>
            )}
            <Edit2 size={8} style={{ color: '#FDF5E6', opacity: 0.6 }} />
          </div>
        </div>

        <button className="w-full py-2 md:py-2.5 rounded-[12px] bg-gradient-to-b from-blue-600 to-[#111827] hover:from-blue-500 hover:to-[#1f2937] text-white font-black text-sm md:text-base transition-all shadow-xl active:scale-95 text-shadow-premium">
          Swap
        </button>

        <div className="flex justify-between items-center px-2">
          <button onClick={handleRefresh} className="flex items-center gap-1.5 text-[9px] font-bold text-white/20 tracking-tight hover:text-blue-400 transition-colors">
            <RefreshCw size={10} className={`text-blue-500/60 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className={isRefreshing ? 'animate-pulse text-white' : ''}>
              1 {fromToken.symbol} ≈ {isSwapped ? (1/rate).toFixed(4) : rate.toFixed(4)} {toToken.symbol}
            </span>
          </button>
          <div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest">
            Fee <span className="text-white/40">0.0025 mUSDC</span> <ChevronDown size={8} />
          </div>
        </div>
      </div>
    </div>
  );
};
