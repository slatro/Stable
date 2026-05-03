import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw } from 'lucide-react';

export const SwapCard = ({ slippage, setSlippage }: { slippage: string, setSlippage: (val: string) => void }) => {
  const [fromAmount, setFromAmount] = useState('10');
  const [toAmount, setToAmount] = useState('11.748');
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const RATE = 1.1748;

  useEffect(() => {
    if (!isNaN(parseFloat(fromAmount))) {
      const calculated = parseFloat(fromAmount) * RATE;
      setToAmount(calculated.toFixed(4));
    }
  }, [fromAmount]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const TokenBox = ({ type, amount, setAmount, symbol, name, iconColor, isReadOnly }: any) => (
    <div className="flex flex-col gap-1.5 mb-3">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 text-[9px] font-bold text-white/30 uppercase tracking-wider">
          <Wallet size={10} className="text-orange-500/80" />
          <span>{type}: 0x2EE5...1704</span>
        </div>
        <div className="text-[9px] font-bold text-white/30 flex items-center gap-1">
          <Settings size={9} /> {type === 'From' ? '2,450.00' : '1,200.00'}
        </div>
      </div>
      
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-[12px] p-3 md:p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-all group">
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
          <div className="text-[9px] font-medium text-white/10">~{(parseFloat(amount || '0') * 1.0).toFixed(2)} USD</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 w-full max-w-[480px]">
      {/* LAYER 1: CENTERED WHITE HEADER */}
      <div className="premium-card p-2.5 md:p-3 flex items-center justify-center relative">
        <h1 className="text-[10px] font-black uppercase tracking-[0.6em] text-white pl-2">Swap</h1>
        <button className="absolute right-3 p-1.5 rounded-xl hover:bg-white/[0.05] transition-all text-white/20 hover:text-white">
          <Settings size={16} />
        </button>
      </div>

      {/* LAYER 2: MAIN ASSET CARD */}
      <div className="premium-card p-4 md:p-5 relative">
        <TokenBox 
          type="From" 
          symbol="mEURC" 
          name="Arc Euro" 
          amount={fromAmount} 
          setAmount={setFromAmount}
          iconColor="bg-blue-600"
          isReadOnly={false}
        />
        
        <div className="relative h-2 flex items-center justify-center my-1">
          <div className="absolute inset-x-0 h-px bg-white/[0.04]" />
          <button className="z-10 w-7 h-7 rounded-full bg-[#0a0a0c] border border-white/[0.08] flex items-center justify-center text-blue-400 hover:scale-110 transition-transform shadow-lg">
            <ArrowDown size={12} />
          </button>
        </div>

        <TokenBox 
          type="To" 
          symbol="mUSDC" 
          name="Arc Dollar" 
          amount={toAmount} 
          setAmount={setToAmount}
          iconColor="bg-emerald-500"
          isReadOnly={true}
        />
      </div>

      {/* LAYER 3: COMPACT GRADIENT ACTION CARD */}
      <div className="premium-card p-3 md:p-3.5 flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] border-b border-dashed border-white/5 pb-0.5">
            Slippage Tolerance
          </span>
          <div 
            onClick={() => setIsEditingSlippage(true)}
            className="flex items-center gap-2 bg-orange-500/5 border border-orange-500/10 px-2.5 py-1 rounded-xl cursor-pointer hover:bg-orange-500/10 transition-all"
          >
            {isEditingSlippage ? (
              <input 
                autoFocus
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                onBlur={() => setIsEditingSlippage(false)}
                className="bg-transparent text-[9px] font-black text-orange-500 w-8 outline-none"
              />
            ) : (
              <span className="text-[9px] font-black text-orange-500">{slippage}%</span>
            )}
            <Edit2 size={8} className="text-orange-500/60" />
          </div>
        </div>

        <button className="w-full py-2.5 md:py-3 rounded-[12px] bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white font-bold text-sm md:text-base transition-all shadow-[0_4px_20px_rgba(37,99,235,0.2)] active:scale-95 border border-white/10">
          Swap
        </button>

        <div className="flex justify-between items-center px-2">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-[9px] font-bold text-white/20 tracking-tight hover:text-blue-400 transition-colors"
          >
            <RefreshCw size={10} className={`text-blue-500/60 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>1 mEURC ≈ {RATE} mUSDC</span>
          </button>
          <div className="flex items-center gap-1 text-[9px] font-bold text-white/20 uppercase tracking-widest">
            Fee <span className="text-white/40">0.0025 mEURC</span> <ChevronDown size={8} />
          </div>
        </div>
      </div>
    </div>
  );
};
