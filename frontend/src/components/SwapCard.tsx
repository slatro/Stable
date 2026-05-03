import React, { useState } from 'react';
import { ArrowUpDown, Settings, ChevronDown } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const AssetSection = ({ type }: { type: 'pay' | 'receive' }) => {
    const isPay = type === 'pay';
    const currentIsFlipped = isPay ? isFlipped : !isFlipped;
    
    return (
      <div className="flex-1 min-h-[140px] p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.05] flex flex-col justify-center transition-all hover:bg-white/[0.04]">
        <div className="flex justify-between mb-4 px-1 text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/30">
          <span>{currentIsFlipped ? 'Receive' : 'Pay'}</span>
          <span className="text-white/60">Balance: {currentIsFlipped ? '1,200.00' : '2,450.00'}</span>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="number" 
            placeholder="0.0" 
            value={currentIsFlipped ? toAmount : fromAmount}
            onChange={(e) => currentIsFlipped ? setToAmount(e.target.value) : setFromAmount(e.target.value)}
            readOnly={!currentIsFlipped && type === 'receive'}
            className={`swap-input !text-3xl !py-0 flex-1 ${!currentIsFlipped && type === 'receive' ? 'opacity-70' : ''}`}
          />
          <button className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-white hover:bg-blue-500/20 transition-all shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shadow-lg ${currentIsFlipped ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              {currentIsFlipped ? '$' : '€'}
            </div>
            <span className="font-bold text-sm tracking-tight">{currentIsFlipped ? 'mUSDC' : 'mEURC'}</span>
            <ChevronDown size={16} className="text-white/40" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="premium-card p-7 flex flex-col h-[500px] relative overflow-hidden max-w-[440px] w-full">
      {/* Subtle inner glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">SWAP</h3>
        <button className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white transition-all">
          <Settings size={22} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 relative">
        <AssetSection type="pay" />
        
        {/* Flip Button - Perfectly Centered Over the gap */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
          <button 
            onClick={handleFlip}
            className="w-11 h-11 rounded-2xl bg-[#081121] border border-white/[0.1] flex items-center justify-center text-blue-400 shadow-2xl hover:scale-110 transition-transform active:rotate-180 duration-300"
          >
            <ArrowUpDown size={18} />
          </button>
        </div>

        <AssetSection type="receive" />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <button className="btn-premium w-full py-5 text-[14px] font-black uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(59,130,246,0.3)]">
          SWAP
        </button>

        <div className="text-center">
          <p className="text-[9px] font-extrabold text-white/10 uppercase tracking-[0.5em]">
            Powered by Arc Network
          </p>
        </div>
      </div>
    </div>
  );
};
