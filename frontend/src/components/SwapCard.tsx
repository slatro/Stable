import React, { useState } from 'react';
import { ArrowDown, Settings, ChevronDown, Wallet, Edit2, RefreshCw } from 'lucide-react';

export const SwapCard = () => {
  const [fromAmount, setFromAmount] = useState('10');
  const [toAmount, setToAmount] = useState('0.1949');
  const [activeTab, setActiveTab] = useState('Swap');

  const TokenBox = ({ type, amount, setAmount, symbol, name, iconColor }: any) => (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wider">
          <Wallet size={12} className="text-orange-500/80" />
          <span>{type}: 0x2EE5...1704</span>
        </div>
        <div className="text-[10px] font-bold text-white/40 flex items-center gap-1">
          <Settings size={10} /> 36.740963
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
            className="bg-transparent text-2xl font-bold text-white text-right outline-none w-32 placeholder-white/10"
          />
          <div className="text-[10px] font-medium text-white/20">~0.29 USD</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full max-w-[480px]">
      {/* LAYER 1: SEGMENTED HEADER */}
      <div className="premium-card p-1.5 flex gap-1">
        {['Swap', 'TWAP', 'Limit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-inner' 
                : 'text-white/20 hover:text-white/40'
            }`}
          >
            {tab}
          </button>
        ))}
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
        />
      </div>

      {/* LAYER 3: FOOTER CARD */}
      <div className="premium-card p-5 md:p-6 flex flex-col gap-5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] border-b border-dashed border-white/10 pb-0.5">
            Slippage Tolerance
          </span>
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-black text-orange-500">3.00%</span>
            <Edit2 size={10} className="text-orange-500" />
          </div>
        </div>

        <button className="w-full py-4 md:py-5 rounded-[24px] bg-cyan-500/80 hover:bg-cyan-400 text-black font-bold text-base md:text-lg transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95">
          Swap
        </button>

        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 tracking-tight">
            <RefreshCw size={12} className="text-blue-400" />
            <span>1 mEURC ≈ 1.0825 mUSDC</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Fee <span className="text-white/60">0.0025 mEURC</span> <ChevronDown size={10} />
          </div>
        </div>
      </div>
    </div>
  );
};
