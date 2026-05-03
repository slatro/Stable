import React, { useState } from 'react';
import { ArrowUpDown, Settings, ChevronDown } from 'lucide-react';

const AssetSection = ({ 
  type, 
  amount, 
  setAmount, 
  isFlipped 
}: { 
  type: 'from' | 'to', 
  amount: string, 
  setAmount: (val: string) => void,
  isFlipped: boolean
}) => {
  const isFrom = type === 'from';
  const currentIsFlipped = isFrom ? isFlipped : !isFlipped;
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between px-1 text-[9px] font-extrabold uppercase tracking-[0.3em] text-white/30">
        <span>{type}</span>
        <span className="text-white/40">Balance: {currentIsFlipped ? '1,200.00' : '2,450.00'}</span>
      </div>
      <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.1] rounded-[24px] p-4 md:p-5 transition-all hover:bg-white/[0.05]">
        <div className="flex-1">
          <input 
            type="number" 
            placeholder="0.0" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={type === 'to'}
            className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/10 outline-none"
          />
        </div>

        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.1] text-white hover:bg-white/[0.08] transition-all">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${currentIsFlipped ? 'bg-emerald-500' : 'bg-blue-600'}`}>
            {currentIsFlipped ? '$' : '€'}
          </div>
          <span className="font-bold text-xs">{currentIsFlipped ? 'mUSDC' : 'mEURC'}</span>
          <ChevronDown size={14} className="text-white/40" />
        </button>
      </div>
    </div>
  );
};

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    const temp = fromAmount;
    setFromAmount(toAmount);
    setToAmount(temp);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-[460px]">
      {/* LAYER 1: HEADER CARD */}
      <div className="premium-card p-4 flex items-center justify-between">
        <h1 className="text-xs font-black uppercase tracking-[0.6em] text-white/90 pl-2">SWAP</h1>
        <button className="p-2 rounded-xl hover:bg-white/[0.05] transition-all text-white/30 hover:text-white">
          <Settings size={18} />
        </button>
      </div>

      {/* LAYER 2: ASSET CARD */}
      <div className="premium-card p-5 md:p-7 relative flex flex-col gap-3">
        <AssetSection 
          type="from" 
          amount={fromAmount} 
          setAmount={setFromAmount} 
          isFlipped={isFlipped} 
        />
        
        {/* Flip Divider */}
        <div className="relative h-2 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-white/[0.05]" />
          <button 
            onClick={handleFlip}
            className="z-10 w-8 h-8 rounded-full bg-[#0a0a0c] border border-white/[0.1] flex items-center justify-center text-blue-400 hover:scale-110 transition-transform shadow-xl"
          >
            <ArrowUpDown size={14} />
          </button>
        </div>

        <AssetSection 
          type="to" 
          amount={toAmount} 
          setAmount={setToAmount} 
          isFlipped={isFlipped} 
        />
      </div>

      {/* LAYER 3: ACTION CARD */}
      <div className="premium-card p-2 md:p-3">
        <button className="btn-premium w-full py-4 md:py-5 text-[18px] md:text-[20px] font-bold uppercase tracking-[0.3em] flex items-center justify-center">
          SWAP
        </button>
      </div>
    </div>
  );
};
