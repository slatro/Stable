import React from 'react';
import { useConnect, Connector } from 'wagmi';
import { X } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const { connect, connectors } = useConnect();

  if (!isOpen) return null;

  const handleConnect = (connector: Connector) => {
    connect({ connector });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px] premium-card overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/[0.05] flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white/90">Connect Wallet</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              className="group flex items-center justify-between p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-blue-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-blue-500/20">
                  {connector.icon ? (
                    <img src={connector.icon} alt={connector.name} className="w-6 h-6" />
                  ) : (
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white/90">{connector.name}</div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    {connector.id === 'injected' ? 'Installed' : 'Ready to Connect'}
                  </div>
                </div>
              </div>
              <div className="text-white/10 group-hover:text-blue-500/50 transition-colors">
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 pt-0 text-center">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
            By connecting, you agree to our <br />
            <span className="text-blue-500/50 hover:text-blue-400 cursor-pointer">Terms of Service</span> and <span className="text-blue-500/50 hover:text-blue-400 cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
