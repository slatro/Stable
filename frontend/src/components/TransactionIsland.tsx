import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';

export type IslandState = 'idle' | 'processing' | 'success' | 'error';

interface IslandData {
  state: IslandState;
  message?: string;
  txHash?: string;
}

export const TransactionIsland = () => {
  const [data, setData] = useState<IslandData>({ state: 'idle' });
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEvent = (event: any) => {
      const { state, message, txHash } = event.detail;
      
      // Clear existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setData({ state, message, txHash });
      setIsVisible(true);

      if (state === 'success' || state === 'error') {
        timeoutRef.current = setTimeout(() => setIsVisible(false), 6000);
      }
    };

    window.addEventListener('arc-transaction', handleEvent);
    return () => {
      window.removeEventListener('arc-transaction', handleEvent);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isVisible && data.state === 'idle') return null;

  const getStatusColor = () => {
    switch (data.state) {
      case 'processing': return 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]';
      case 'success': return 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]';
      case 'error': return 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]';
      default: return 'border-white/10 shadow-2xl';
    }
  };

  const getStatusIcon = () => {
    switch (data.state) {
      case 'processing': return <Loader2 size={16} className="animate-spin text-blue-400" />;
      case 'success': return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'error': return <AlertCircle size={16} className="text-rose-400" />;
      default: return <CheckCircle2 size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className={`fixed top-6 right-6 z-[1000] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
    }`}>
      <div className={`premium-card min-w-[320px] max-w-[420px] p-4 bg-black/60 backdrop-blur-3xl border ${getStatusColor()} transition-all duration-500 overflow-hidden relative group`}>
        {/* Progress Bar */}
        {(data.state === 'success' || data.state === 'error') && isVisible && (
          <div className="absolute bottom-0 left-0 h-[2px] bg-white/20 w-full overflow-hidden">
            <div className={`h-full ${data.state === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} animate-toast-progress`} />
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            data.state === 'processing' ? 'bg-blue-500/10 border-blue-500/20' :
            data.state === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
            'bg-rose-500/10 border-rose-500/20'
          }`}>
            {getStatusIcon()}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
              {data.state === 'processing' ? 'Transaction Processing' : 
               data.state === 'error' ? 'Transaction Failed' : 'Transaction Confirmed'}
            </span>
            <span className="text-[13px] font-black text-white uppercase tracking-tight leading-tight">
              {data.message || (data.state === 'processing' ? 'Waiting for block confirmation' : 'Something went wrong')}
            </span>
          </div>

          <div className="flex items-center gap-1 self-start">
            {data.txHash && (
              <a 
                href={`https://testnet.arcscan.app/tx/${data.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <button 
              onClick={() => setIsVisible(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-white/20 hover:text-white transition-all"
            >
              <AlertCircle size={14} className="rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to trigger the island
export const triggerIsland = (state: IslandState, message?: string, txHash?: string, metadata?: any) => {
  window.dispatchEvent(new CustomEvent('arc-transaction', { 
    detail: { state, message, txHash, ...metadata } 
  }));
};
