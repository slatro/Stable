import React, { useState, useEffect } from 'react';
import { X, Copy, LogOut, CheckCircle2, Wallet, ExternalLink, Zap, Edit2, Award, Star, Shield, Trophy, Camera } from 'lucide-react';
import { useAccount, useDisconnect, useReadContract, useReadContracts, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import ERC20_ABI from '../abis/ERC20.json';

export const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Nala',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiki',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lilly',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Buster',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Ginger',
];

const TOKEN_ICONS: Record<string, string> = {
  aUSDC: '/stable_logos/usdc.png',
  aEURC: '/stable_logos/eurc.png',
  aTRYC: '/stable_logos/tryc.png',
  aGBPC: '/stable_logos/gbpc.png',
  aJPYC: '/stable_logos/jpyc.png',
  astUSDC: '/stable_logos/usdc.png',
};

export const ProfileModal = ({ isOpen, onClose, selectedAvatar, setSelectedAvatar }: any) => {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  
  // Persistence for Name (Local to modal is fine, or shared if needed)
  const [userName, setUserName] = useState(() => localStorage.getItem('arc_profile_name') || 'Arc Explorer');
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    localStorage.setItem('arc_profile_name', userName);
  }, [userName]);

  const ARC_CHAIN_ID = 5042002;

  const commonQuery = { enabled: !!address, refetchInterval: 5000 };

  const { data: usdcNativeBal } = useBalance({ address, chainId: ARC_CHAIN_ID, query: commonQuery });
  const { data: eurcNativeBal } = useBalance({ address, token: CONTRACT_ADDRESSES.EURC_NATIVE as `0x${string}`, chainId: ARC_CHAIN_ID, query: commonQuery });
  const { data: balAUSDC } = useBalance({ address, token: CONTRACT_ADDRESSES.aUSDC as `0x${string}`, chainId: ARC_CHAIN_ID, query: commonQuery });
  const { data: balAEURC } = useBalance({ address, token: CONTRACT_ADDRESSES.aEURC as `0x${string}`, chainId: ARC_CHAIN_ID, query: commonQuery });
  const { data: balATRYC } = useBalance({ address, token: CONTRACT_ADDRESSES.aTRYC as `0x${string}`, chainId: ARC_CHAIN_ID, query: commonQuery });
  const { data: balAGBPC } = useBalance({ address, token: CONTRACT_ADDRESSES.aGBPC as `0x${string}`, chainId: ARC_CHAIN_ID, query: commonQuery });
  const { data: balAJPYC } = useBalance({ address, token: CONTRACT_ADDRESSES.aJPYC as `0x${string}`, chainId: ARC_CHAIN_ID, query: commonQuery });

  if (!isOpen) return null;

  const balances = [
    { symbol: 'USDC', name: 'Native Gas', amount: usdcNativeBal?.value, dec: usdcNativeBal?.decimals || 18, icon: TOKEN_ICONS.aUSDC },
    { symbol: 'EURC', name: 'Native Euro', amount: eurcNativeBal?.value, dec: eurcNativeBal?.decimals || 6, icon: TOKEN_ICONS.aEURC },
    { symbol: 'aUSDC', name: 'Stablr Dollar', amount: balAUSDC?.value, dec: balAUSDC?.decimals || 18, icon: TOKEN_ICONS.aUSDC },
    { symbol: 'aEURC', name: 'Stablr Euro', amount: balAEURC?.value, dec: balAEURC?.decimals || 18, icon: TOKEN_ICONS.aEURC },
    { symbol: 'aTRYC', name: 'Stablr Lira', amount: balATRYC?.value, dec: balATRYC?.decimals || 18, icon: TOKEN_ICONS.aTRYC },
    { symbol: 'aGBPC', name: 'Stablr Pound', amount: balAGBPC?.value, dec: balAGBPC?.decimals || 18, icon: TOKEN_ICONS.aGBPC },
    { symbol: 'aJPYC', name: 'Stablr Yen', amount: balAJPYC?.value, dec: balAJPYC?.decimals || 18, icon: TOKEN_ICONS.aJPYC },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md premium-card overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        
        {/* Neon Line at Top */}
        <div className="absolute top-0 left-10 right-10 h-[4px] bg-gradient-to-r from-blue-400 via-indigo-500 via-purple-500 to-pink-500 rounded-b-full shadow-[0_0_25px_rgba(168,85,247,0.6)] z-20" />

        <div className="p-6 flex flex-col gap-8">
          <div className="flex justify-end">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20 transition-all"><X size={18} /></button>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-2 border-white/10 p-1.5 bg-black/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:border-blue-500/50 transition-all duration-500">
                <img src={selectedAvatar} alt="Avatar" className="w-full h-full rounded-full transition-all group-hover:scale-105" />
              </div>
              <button 
                onClick={() => setIsSelectingAvatar(!isSelectingAvatar)}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg border-2 border-[#121212] hover:scale-110 active:scale-90 transition-all"
              >
                <Edit2 size={12} strokeWidth={3} />
              </button>

              {/* Avatar Selector Grid */}
              {isSelectingAvatar && (
                <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-[240px] bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map((av, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => { setSelectedAvatar(av); setIsSelectingAvatar(false); }}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${selectedAvatar === av ? 'border-blue-500 bg-blue-500/20' : 'border-transparent bg-white/5'}`}
                      >
                        <img src={av} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Name Section */}
            <div className="flex flex-col items-center gap-2 w-full px-8">
               {isEditingName ? (
                 <input 
                   autoFocus
                   value={userName}
                   onChange={(e) => setUserName(e.target.value)}
                   onBlur={() => setIsEditingName(false)}
                   onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                   className="bg-white/5 border-b-2 border-blue-500 outline-none text-center text-2xl font-black text-white w-full py-1 animate-in fade-in duration-300"
                 />
               ) : (
                 <div onClick={() => setIsEditingName(true)} className="group flex items-center justify-center gap-2 cursor-pointer relative">
                    <span className="text-2xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-all text-center">{userName}</span>
                    <div className="absolute left-[100%] ml-2">
                      <Edit2 size={14} className="text-white/0 group-hover:text-blue-400/50 transition-all" />
                    </div>
                 </div>
               )}
               
               <div className="flex items-center gap-2">
                 <button onClick={() => { navigator.clipboard.writeText(address || ''); setCopied(true); }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white/30 hover:text-white transition-all flex items-center gap-2 group">
                   {address?.slice(0,6)}...{address?.slice(-4)} 
                   <Copy size={10} className="text-white/0 group-hover:text-white/40 transition-all" />
                   {copied && <span className="text-emerald-400 ml-1">✓</span>}
                 </button>
                 <a 
                   href={`https://testnet.arcscan.app/address/${address}`} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all"
                   title="View on ArcScan"
                 >
                   <ExternalLink size={12} />
                 </a>
               </div>
            </div>
          </div>

          {/* Asset List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500 rounded-full" />
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Vault Assets</h3>
            </div>
            <div className="max-h-[260px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {balances.map(b => (
              <div key={b.symbol} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center p-1.5 border border-white/5 group-hover:border-white/10 transition-all">
                    <img src={b.icon} alt={b.symbol} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black text-white">{b.symbol}</span>
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">{b.name}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black text-white/90 tabular-nums">
                    {b.amount !== undefined ? parseFloat(formatUnits(b.amount as bigint, b.dec)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                  </span>
                </div>
              </div>
            ))}
            </div>
          </div>

          <button onClick={() => { disconnect(); onClose(); }} className="w-full py-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5">Disconnect Wallet</button>
        </div>
      </div>
    </div>
  );
};
