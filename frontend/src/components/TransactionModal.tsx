import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';
import { ARC_TESTNET_CONFIG } from '../config/contracts';

export const TransactionModal = () => {
  const { state, closeTransaction } = useTransaction();
  const [successAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    if (state.status === 'success') {
      setSuccessAnim(true);
    } else {
      setSuccessAnim(false);
    }
  }, [state.status]);

  if (!state.isOpen) return null;

  const humanizeError = (error?: string) => {
    if (!error) return 'An unknown error occurred.';
    const e = error.toLowerCase();
    
    if (e.includes('user rejected') || e.includes('action rejected')) {
      return "Transaction cancelled in wallet. You need to approve it to continue.";
    }
    if (e.includes('insufficient funds') || e.includes('exceeds balance') || e.includes('gas price') || e.includes('not enough')) {
      return "Insufficient USDC (Gas) in wallet. Claim free USDC from the Faucet!";
    }
    if (e.includes('slippage') || e.includes('amount out') || e.includes('too little')) {
      return "Price impact too high (Slippage). Try increasing your slippage tolerance.";
    }
    if (e.includes('allowance') || e.includes('approve')) {
      return "Token allowance not granted. Please approve the token first.";
    }
    if (e.includes('reverted') || e.includes('execution reverted')) {
      return "Transaction reverted by blockchain. Please check pool liquidity.";
    }
    if (e.includes('deadline')) {
      return "Transaction expired (Deadline). Please try again.";
    }

    return error.length > 100 ? error.slice(0, 100) + '...' : error;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-700 ${state.isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={state.status === 'success' || state.status === 'error' ? closeTransaction : undefined}
      />
      
      <div className="relative w-full max-w-[360px] bg-blue-950/40 border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 backdrop-blur-3xl">
        {/* Subtle top glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] blur-[30px] transition-all duration-1000 ${
          state.status === 'success' ? 'bg-emerald-400' : 
          state.status === 'error' ? 'bg-rose-500' : 'bg-blue-400'
        }`} />

        <div className="p-8 flex flex-col items-center">
          {/* Status Header */}
          <div className="w-full flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  state.status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 
                  state.status === 'error' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 
                  'bg-blue-400 shadow-[0_0_10px_#3b82f6]'
                }`} />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Network Active</span>
             </div>
             <button onClick={closeTransaction} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                <X size={14} className="text-white/20" />
             </button>

          </div>

          {/* Main Visual Component - Reduced Size */}
          <div className="mb-6 relative">
             <div className={`relative w-20 h-20 rounded-full border border-white/5 flex items-center justify-center transition-all duration-1000 ${
               successAnim ? 'bg-emerald-500/10 border-emerald-500/20 scale-105' : 'bg-white/[0.02]'
             }`}>
                {state.status === 'confirming' && (
                  <div className="relative">
                    <ShieldCheck size={36} className="text-blue-400" />
                    <div className="absolute inset-0 border-2 border-blue-400/20 rounded-full animate-ping" />
                  </div>
                )}
                {state.status === 'executing' && (
                  <div className="relative">
                    <Loader2 size={36} className="text-blue-500 animate-spin" />
                    <div className="absolute -inset-3 border border-blue-500/5 rounded-full animate-pulse" />
                  </div>
                )}
                {state.status === 'success' && (
                  <div className="relative animate-in zoom-in-50 duration-700">
                    <CheckCircle2 size={42} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                    <div className="absolute -inset-6 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                  </div>
                )}
                {state.status === 'error' && (
                  <AlertCircle size={36} className="text-rose-500 animate-in shake-1 duration-500" />
                )}
             </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-white tracking-tighter mb-1.5">{state.title}</h2>
            <p className={`text-[10px] font-bold uppercase tracking-[0.12em] max-w-[240px] mx-auto leading-relaxed ${state.status === 'error' ? 'text-rose-400/90' : 'text-white/30'}`}>
              {state.status === 'confirming' && 'Approve action in your wallet'}
              {state.status === 'executing' && 'Processing on blockchain'}
              {state.status === 'success' && 'Transaction completed successfully'}
              {state.status === 'error' && humanizeError(state.error)}
            </p>
          </div>

          {/* Connected Steps (Vertical) - More compact */}
          <div className="w-full space-y-0 mb-8 pl-1">
            {state.steps.map((step, i) => {
              const isActive = step.status === 'loading';
              const isDone = step.status === 'completed';
              const isError = step.status === 'error';
              
              return (
                <div key={step.id} className="relative flex items-start gap-4 pb-4 last:pb-0">
                  {/* Vertical Line */}
                  {i < state.steps.length - 1 && (
                    <div className={`absolute left-[6px] top-[14px] w-[1px] h-full transition-all duration-1000 ${
                      isDone ? 'bg-emerald-500/40' : isError ? 'bg-rose-500/40' : 'bg-white/5'
                    }`} />
                  )}

                  {/* Indicator Dot */}
                  <div className="relative z-10 mt-0.5">
                    {isActive ? (
                      <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.6)]">
                         <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      </div>
                    ) : isDone ? (
                      <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                         <CheckCircle2 size={8} className="text-white" />
                      </div>
                    ) : isError ? (
                      <div className="w-3 h-3 rounded-full bg-rose-500 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.4)]">
                         <X size={8} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-white/10 border border-white/5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${
                      isActive ? 'text-blue-400' : isDone ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-white/20'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Area */}
          <div className="w-full space-y-3">
            {state.txHash && (
              <a 
                href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${state.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 transition-all"
              >
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] group-hover:text-white transition-colors">View on Explorer</span>
                <ExternalLink size={10} className="text-white/10 group-hover:text-blue-400" />
              </a>
            )}

            {(state.status === 'success' || state.status === 'error') && (
              <button 
                onClick={closeTransaction}
                className={`w-full py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${
                  state.status === 'success' 
                    ? 'bg-white text-black hover:bg-[#F1F1F1] shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                    : 'bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                }`}
              >
                {state.status === 'success' ? 'DONE' : 'CLOSE & TRY AGAIN'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
