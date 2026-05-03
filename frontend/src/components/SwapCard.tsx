import React, { useState } from 'react';
import { ArrowUpDown, Settings, ChevronDown } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const AssetSection = ({ type }: { type: 'from' | 'to' }) => {
    const isFrom = type === 'from';
    const currentIsFlipped = isFrom ? isFlipped : !isFlipped;
    
    return (
      <div className="flex-1 min-h-[120px] md:min-h-[140px] p-5 md:p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.05] flex flex-col justify-center transition-all hover:bg-white/[0.04]">
        <div className="flex justify-between mb-3 md:mb-4 px-1 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/20">
          <span>{type}</span>
          <span className="text-white/40">Balance: {currentIsFlipped ? '1,200.00' : '2,450.00'}</span>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="number" 
            placeholder="0.0" 
            value={currentIsFlipped ? toAmount : fromAmount}
            onChange={(e) => currentIsFlipped ? setToAmount(e.target.value) : setFromAmount(e.target.value)}
            readOnly={!currentIsFlipped && type === 'to'}
            className={`swap-input !text-2xl md:!text-3xl !py-0 flex-1 ${!currentIsFlipped && type === 'to' ? 'opacity-70' : ''}`}
          />
          <button className="flex items-center gap-2 md:gap-3 px-3.5 md:px-5 py-2.5 md:py-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-white hover:bg-blue-500/20 transition-all shrink-0">
            <div className={`w-6 md:w-7 h-6 md:h-7 rounded-full flex items-center justify-center text-[10px] md:text-[12px] font-bold shadow-lg ${currentIsFlipped ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              {currentIsFlipped ? '$' : '€'}
            </div>
            <span className="font-bold text-xs md:text-sm tracking-tight">{currentIsFlipped ? 'mUSDC' : 'mEURC'}</span>
            <ChevronDown size={14} className="text-white/40" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="premium-card p-5 md:p-7 flex flex-col h-[460px] md:h-[500px] relative overflow-hidden max-w-[440px] w-full">
      {/* Subtle inner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-end mb-3 md:mb-4 px-2">
        <button className="p-2 md:p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white transition-all">
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 md:gap-2 relative">
        <AssetSection type="from" />
        
        {/* Flip Button - Perfectly Centered */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <button 
            onClick={handleFlip}
            className="w-9 md:w-11 h-9 md:h-11 rounded-2xl bg-[#081121] border border-white/[0.1] flex items-center justify-center text-blue-400 shadow-2xl hover:scale-110 transition-transform active:rotate-180 duration-300"
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        <AssetSection type="to" />
      </div>

      <div className="mt-4 md:mt-6 flex flex-col gap-3 md:gap-4">
        <button className="btn-premium w-full py-4 md:py-5 text-[14px] font-black uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(59,130,246,0.3)] h-14 md:h-16 flex items-center justify-center">
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-white/90">SWAP</span>
        </button>

        <div className="text-center">
          <p className="text-[8px] md:text-[9px] font-extrabold text-white/10 uppercase tracking-[0.5em]">
            Powered by Arc Network
          </p>
        </div>
      </div>
    </div>
  );
};
