import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('10');
  const [toAmount, setToAmount] = useState('11.748');
  const [slippage, setSlippage] = useState('3.00');
  const [isEditingSlippage, setIsEditingSlippage] = useState(false);
  
  // Rate from TradingView screenshot
  const RATE = 1.1748;

  useEffect(() => {
    if (!isNaN(parseFloat(fromAmount))) {
      const calculated = parseFloat(fromAmount) * RATE;
      setToAmount(calculated.toFixed(4));
    }
  }, [fromAmount]);

  const TokenBox = ({ type, amount, setAmount, symbol, name, iconColor, isReadOnly }: any) => (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
          <Wallet size={12} className="text-orange-500/80" />
          <span>{type}: 0x2EE5...1704</span>
        </div>
        <div className="text-[10px] font-bold text-white/40 flex items-center gap-1">
          <Settings size={10} /> {type === 'From' ? '2,450.00' : '1,200.00'}
        </div>
      </div>
      
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-4 flex items-center justify-between hover:bg-white/[0.05] transition-all group">
        <button className="flex items-center gap-3 px-2 py-1 rounded-2xl hover:bg-white/5 transition-all">
          <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center shadow-lg shadow-black/20`}>
            <div className="w-4 h-4 rounded-full border-2 border-white/20" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-white">{symbol}</span>
              <ChevronDown size={14} className="text-white/30" />
            </div>
            <div className="text-[10px] font-medium text-white/30">{name}</div>
          </div>
        </button>

        <div className="text-right">
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={isReadOnly}
            className={`bg-transparent text-2xl font-bold text-white text-right outline-none w-32 placeholder-white/10 ${isReadOnly ? 'opacity-70' : ''}`}
          />
          <div className="text-[10px] font-medium text-white/20">~{(parseFloat(amount || '0') * 1.0).toFixed(2)} USD</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full max-w-[480px]">
      {/* LAYER 1: SIMPLE HEADER */}
      <div className="premium-card p-4 flex items-center justify-between">
        <h1 className="text-xs font-black uppercase tracking-[0.6em] text-blue-400/90 pl-2">Swap</h1>
        <button className="p-2 rounded-xl hover:bg-white/[0.05] transition-all text-white/30 hover:text-white">
          <Settings size={18} />
        </button>
      </div>

      {/* LAYER 2: MAIN ASSET CARD */}
      <div className="premium-card p-5 md:p-6 relative">
        <TokenBox 
          type="From" 
          symbol="mEURC" 
          name="Arc Euro" 
          amount={fromAmount} 
          setAmount={setFromAmount}
          iconColor="bg-blue-600"
          isReadOnly={false}
        />
        
        <div className="relative h-4 flex items-center justify-center my-2">
          <div className="absolute inset-x-0 h-px bg-white/[0.05]" />
          <button className="z-10 w-9 h-9 rounded-full bg-[#0a0a0c] border border-white/[0.1] flex items-center justify-center text-blue-400 hover:scale-110 transition-transform shadow-xl">
            <ArrowDown size={16} />
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

      {/* LAYER 3: FOOTER CARD */}
      <div className="premium-card p-5 md:p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-b border-dashed border-white/10 pb-0.5">
            Slippage Tolerance
          </span>
          <div 
            onClick={() => setIsEditingSlippage(true)}
            className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-orange-500/20 transition-all"
          >
            {isEditingSlippage ? (
              <input 
                autoFocus
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                onBlur={() => setIsEditingSlippage(false)}
                className="bg-transparent text-[10px] font-black text-orange-500 w-10 outline-none"
              />
            ) : (
              <span className="text-[10px] font-black text-orange-500">{slippage}%</span>
            )}
            <Edit2 size={10} className="text-orange-500" />
          </div>
        </div>

        <button className="w-full py-3.5 md:py-4 rounded-[24px] bg-cyan-500/80 hover:bg-cyan-400 text-white font-bold text-base md:text-lg transition-all shadow-[0_10px_30px_rgba(6,182,212,0.2)] active:scale-95">
          Swap
        </button>

        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 tracking-tight">
            <RefreshCw size={12} className="text-blue-400" />
            <span>1 mEURC ≈ {RATE} mUSDC</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Fee <span className="text-white/60">0.0025 mEURC</span> <ChevronDown size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};
