import React from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { ARC_TESTNET_CONFIG } from '../config/contracts';

interface NetworkInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const NetworkInfoModal = ({ isOpen, onClose, onConfirm }: NetworkInfoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[480px] bg-[#1a1a1a] rounded-[24px] overflow-hidden shadow-2xl border border-white/[0.08] animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-1.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8 pt-10">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-4">Before connecting</h2>
          <p className="text-sm text-white/50 leading-relaxed mb-8">
            ArcFX runs on the private Arc Testnet. Your wallet may show warnings when adding this network.
          </p>

          {/* Warning Box */}
          <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <p className="text-[13px] text-amber-200/80 leading-snug">
              You may see warnings about unrecognized networks or mismatched token symbols. This is normal for test networks.
            </p>
          </div>

          {/* Network Details */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/[0.05] p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Info className="text-white/30" size={16} />
              <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Network Details</span>
            </div>

            <div className="space-y-4">
              <DetailRow label="Network" value={ARC_TESTNET_CONFIG.chainName} />
              <DetailRow label="Chain ID" value={ARC_TESTNET_CONFIG.chainId.toString()} />
              <DetailRow label="Currency" value={ARC_TESTNET_CONFIG.nativeCurrency.symbol} />
              <DetailRow label="RPC" value={ARC_TESTNET_CONFIG.rpcUrl} />
              <DetailRow label="Explorer" value={ARC_TESTNET_CONFIG.blockExplorerUrl} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            <button 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
            >
              Connect wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center gap-8">
    <span className="text-xs font-bold text-white/30">{label}</span>
    <span className="text-xs font-mono font-bold text-white/80 truncate max-w-[240px]">{value}</span>
  </div>
);
