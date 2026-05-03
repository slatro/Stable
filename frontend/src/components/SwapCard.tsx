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
    <div className="flex-1 min-h-[130px] md:min-h-[150px] p-5 md:p-6 rounded-[28px] bg-white/[0.03] border border-white/[0.1] backdrop-blur-[20px] flex flex-col justify-center transition-all hover:bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div className="flex justify-between mb-4 px-1 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/30">
        <span>{type}</span>
        <span className="text-white/50">Balance: {currentIsFlipped ? '1,200.00' : '2,450.00'}</span>
      </div>
      <div className="flex items-center gap-4">
        {/* Lightened, More Glassy Input Box */}
        <div className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-2xl px-4 py-2.5 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]">
          <input 
            type="number" 
            placeholder="0.0" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={type === 'to'}
            className={`w-full bg-transparent text-2xl md:text-3xl font-bold text-white placeholder-white/10 outline-none ${type === 'to' ? 'opacity-70' : ''}`}
          />
        </div>

        <button className="flex items-center gap-2 md:gap-3 px-3.5 md:px-5 py-3 md:py-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-white hover:bg-blue-500/20 transition-all shrink-0 shadow-lg">
          <div className={`w-6 md:w-7 h-6 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-[12px] font-bold shadow-xl ${currentIsFlipped ? 'bg-emerald-500' : 'bg-blue-600'}`}>
            {currentIsFlipped ? '$' : '€'}
          </div>
          <span className="font-bold text-xs md:text-sm tracking-tight">{currentIsFlipped ? 'mUSDC' : 'mEURC'}</span>
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
    // Swap amounts too when flipped
    const temp = fromAmount;
    setFromAmount(toAmount);
    setToAmount(temp);
  };

  return (
    <div className="premium-card p-5 md:p-8 flex flex-col h-[480px] md:h-[520px] relative overflow-hidden max-w-[460px] w-full">
      {/* Subtle inner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-end mb-4 md:mb-6 px-2">
        <button className="p-2 md:p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white transition-all shadow-md">
          <Settings size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 md:gap-3 relative">
        <AssetSection 
          type="from" 
          amount={fromAmount} 
          setAmount={setFromAmount} 
          isFlipped={isFlipped} 
        />
        
        {/* Flip Button - Perfectly Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <button 
            onClick={handleFlip}
            className="w-10 md:w-12 h-10 md:h-12 rounded-2xl bg-[#0a0a0c] border border-white/[0.15] flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:scale-110 transition-transform active:rotate-180 duration-300"
          >
            <ArrowUpDown size={18} />
          </button>
        </div>

        <AssetSection 
          type="to" 
          amount={toAmount} 
          setAmount={setToAmount} 
          isFlipped={isFlipped} 
        />
      </div>

      <div className="mt-6 md:mt-8 flex flex-col gap-4">
        <button className="btn-premium w-full py-4 md:py-5 text-[15px] font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(59,130,246,0.2)] h-14 md:h-16 flex items-center justify-center">
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-white/90">SWAP</span>
        </button>

        <div className="text-center mt-2">
          <p className="text-[8px] md:text-[9px] font-extrabold text-white/30 uppercase tracking-[0.5em]">
            Powered by Arc Network
          </p>
        </div>
      </div>
    </div>
  );
};
