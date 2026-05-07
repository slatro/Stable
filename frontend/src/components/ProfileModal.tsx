import React, { useState, useEffect } from 'react';
import { X, Copy, LogOut, CheckCircle2, Wallet, ExternalLink, Zap, Edit2, Award, Star, Shield, Trophy } from 'lucide-react';
import { useAccount, useDisconnect, useReadContract, useBalance } from 'wagmi';
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
  const [pointsData, setPointsData] = useState({ total: 12842 });

  const { data: rawBalNativeUSDC } = useReadContract({ address: CONTRACT_ADDRESSES.USDC_NATIVE as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined });
  const { data: decNativeUSDC } = useReadContract({ address: CONTRACT_ADDRESSES.USDC_NATIVE as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' });
  
  const { data: rawBalNativeEURC } = useReadContract({ address: CONTRACT_ADDRESSES.EURC_NATIVE as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined });
  const { data: decNativeEURC } = useReadContract({ address: CONTRACT_ADDRESSES.EURC_NATIVE as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' });

  const { data: balAUSDC } = useBalance({ address: address, token: CONTRACT_ADDRESSES.aUSDC as `0x${string}` });
  const { data: balAEURC } = useBalance({ address: address, token: CONTRACT_ADDRESSES.aEURC as `0x${string}` });
  const { data: balATRYC } = useBalance({ address: address, token: CONTRACT_ADDRESSES.aTRYC as `0x${string}` });
  const { data: balAGBPC } = useBalance({ address: address, token: CONTRACT_ADDRESSES.aGBPC as `0x${string}` });
  const { data: balAJPYC } = useBalance({ address: address, token: CONTRACT_ADDRESSES.aJPYC as `0x${string}` });

  if (!isOpen) return null;

  const balances = [
    { symbol: 'USDC', name: 'Native Gas', amount: rawBalNativeUSDC, dec: (decNativeUSDC as number) || 18, icon: TOKEN_ICONS.aUSDC },
    { symbol: 'EURC', name: 'Native Euro', amount: rawBalNativeEURC, dec: (decNativeEURC as number) || 18, icon: TOKEN_ICONS.aEURC },
    { symbol: 'aUSDC', name: 'Arc Dollar', amount: balAUSDC?.value, dec: 6, icon: TOKEN_ICONS.aUSDC },
    { symbol: 'aEURC', name: 'Arc Euro', amount: balAEURC?.value, dec: 18, icon: TOKEN_ICONS.aEURC },
    { symbol: 'aTRYC', name: 'Arc Lira', amount: balATRYC?.value, dec: 18, icon: TOKEN_ICONS.aTRYC },
    { symbol: 'aGBPC', name: 'Arc Pound', amount: balAGBPC?.value, dec: 18, icon: TOKEN_ICONS.aGBPC },
    { symbol: 'aJPYC', name: 'Arc Yen', amount: balAJPYC?.value, dec: 18, icon: TOKEN_ICONS.aJPYC },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md premium-card overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Identity</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/20"><X size={18} /></button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full border border-white/10 p-1 bg-black/40 shadow-2xl">
              <img src={selectedAvatar} alt="Avatar" className="w-full h-full rounded-full" />
            </div>
            <div className="flex flex-col items-center gap-2">
               <span className="text-lg font-black text-white">Arc Explorer</span>
               <button onClick={() => { navigator.clipboard.writeText(address || ''); setCopied(true); }} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:text-white transition-all">
                 {address?.slice(0,6)}...{address?.slice(-4)} {copied && '✓'}
               </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Assets</h3>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {balances.map(b => (
              <div key={b.symbol} className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img src={b.icon} alt={b.symbol} className="w-6 h-6 object-contain" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white">{b.symbol}</span>
                    <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter">{b.name}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-white/80">
                  {b.amount !== undefined ? formatUnits(b.amount as bigint, b.dec) : '0.00'}
                </span>
              </div>
            ))}
            </div>
          </div>

          <button onClick={() => { disconnect(); onClose(); }} className="w-full py-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-500 hover:text-white transition-all">Disconnect</button>
        </div>
      </div>
    </div>
  );
};
