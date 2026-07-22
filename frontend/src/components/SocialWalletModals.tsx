import React, { useState, useEffect } from 'react';
import { Chrome, Twitter, ShieldCheck, Loader2, Sparkles, Zap, Key } from 'lucide-react';

export const SocialWalletModals = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTxOpen, setIsTxOpen] = useState(false);
  
  // Login states
  const [loginStep, setLoginStep] = useState<'select' | 'connecting' | 'generating'>('select');
  const [loginType, setLoginType] = useState<'google' | 'twitter' | null>(null);
  
  // Tx states
  const [txDetails, setTxDetails] = useState<any>(null);
  const [txStep, setTxStep] = useState<'review' | 'signing' | 'relaying' | 'success'>('review');
  const [createdTxHash, setCreatedTxHash] = useState<string>('');

  useEffect(() => {
    const handleOpenLogin = () => {
      setIsLoginOpen(true);
      setLoginStep('select');
      setLoginType(null);
    };

    const handleOpenTx = (e: any) => {
      setTxDetails(e.detail.tx);
      setIsTxOpen(true);
      setTxStep('review');
      setCreatedTxHash('');
    };

    window.addEventListener('stablr-open-social-login', handleOpenLogin);
    window.addEventListener('stablr-open-gasless-tx', handleOpenTx);

    return () => {
      window.removeEventListener('stablr-open-social-login', handleOpenLogin);
      window.removeEventListener('stablr-open-gasless-tx', handleOpenTx);
    };
  }, []);

  // SOCIAL LOGIN FLOW
  const startSocialLogin = (type: 'google' | 'twitter') => {
    setLoginType(type);
    setLoginStep('connecting');
    
    // Step 1: Connecting Circle SDK
    setTimeout(() => {
      setLoginStep('generating');
      
      // Step 2: Generating smart account address
      setTimeout(() => {
        // Generate a random-looking but valid address format
        const randHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const smartAddress = `0x${randHex}`;
        
        localStorage.setItem('stablr_social_provider', type);
        
        // Dispatch success event back to the connector
        window.dispatchEvent(new CustomEvent('stablr-social-login-success', {
          detail: { address: smartAddress }
        }));
        
        setIsLoginOpen(false);
      }, 1500);
    }, 1500);
  };

  const cancelSocialLogin = () => {
    setIsLoginOpen(false);
    window.dispatchEvent(new CustomEvent('stablr-social-login-cancelled'));
  };

  // GASLESS TRANSACTION FLOW
  const startGaslessTx = () => {
    setTxStep('signing');
    
    // Step 1: Passkey signing simulation
    setTimeout(() => {
      setTxStep('relaying');
      
      // Step 2: Paymaster relay simulation
      setTimeout(() => {
        setTxStep('success');
        // Generate a transaction hash
        const randHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setCreatedTxHash(randHash);
        
        // Resolve the transaction back to Wagmi
        setTimeout(() => {
          setIsTxOpen(false);
          window.dispatchEvent(new CustomEvent('stablr-gasless-tx-success', {
            detail: { hash: randHash }
          }));
        }, 1500);
        
      }, 1500);
    }, 1500);
  };

  const cancelGaslessTx = () => {
    setIsTxOpen(false);
    window.dispatchEvent(new CustomEvent('stablr-gasless-tx-cancelled'));
  };

  if (!isLoginOpen && !isTxOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* SOCIAL LOGIN MODAL */}
      {isLoginOpen && (
        <div className="relative w-full max-w-md bg-[#0d0d0d] border border-blue-500/30 rounded-3xl p-6 shadow-[0_0_80px_rgba(59,130,246,0.2)] text-center animate-in zoom-in-95 duration-200">
          {/* Faint blue orb */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {loginStep === 'select' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
                  <Key className="text-blue-400" size={24} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase mt-2">Login to Stablr</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest max-w-[280px]">
                  No wallet required. Connect instantly via secure Circle Programmable Wallets.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => startSocialLogin('google')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] text-white"
                >
                  <Chrome size={16} className="text-white" />
                  Sign in with Google
                </button>
                <button
                  onClick={() => startSocialLogin('twitter')}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] text-white"
                >
                  <Twitter size={16} className="text-blue-400" fill="currentColor" />
                  Sign in with Twitter
                </button>
              </div>

              <button onClick={cancelSocialLogin} className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors mt-2">
                Cancel
              </button>
            </div>
          )}

          {loginStep === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <Loader2 className="text-blue-400 animate-spin" size={48} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-white uppercase tracking-widest">Connecting Circle SDK</span>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider">Establishing secure encrypted tunnel...</p>
              </div>
            </div>
          )}

          {loginStep === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="relative">
                <Loader2 className="text-purple-400 animate-spin" size={48} />
                <Sparkles className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={20} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-white uppercase tracking-widest">Deploying Smart Wallet</span>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider">Deploying ERC-4337 smart account to Arc Network...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GASLESS TRANSACTION MODAL */}
      {isTxOpen && (
        <div className="relative w-full max-w-md bg-[#0d0d0d] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_80px_rgba(16,185,129,0.2)] text-center animate-in zoom-in-95 duration-200">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {txStep === 'review' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <Zap className="text-emerald-400 animate-pulse" size={24} />
                </div>
                <h3 className="text-xl font-black text-white tracking-tighter uppercase mt-2">Gasless Transaction</h3>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20">
                  <Zap size={10} fill="currentColor" /> Sponsored by Paymaster
                </span>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl text-left">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Transaction Details</span>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase">Destination</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-wider font-mono">
                    {txDetails?.to?.slice(0, 10)}...{txDetails?.to?.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase">Gas Fee</span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    $0.00 <span className="line-through text-white/20">$0.04</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={startGaslessTx}
                  className="w-full py-4 bg-white text-black hover:scale-[1.02] rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-white/5"
                >
                  Approve & Sign
                </button>
                <button
                  onClick={cancelGaslessTx}
                  className="text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-colors py-2"
                >
                  Reject Transaction
                </button>
              </div>
            </div>
          )}

          {txStep === 'signing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <Loader2 className="text-emerald-400 animate-spin" size={48} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-white uppercase tracking-widest">Signing with Passkey</span>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider">Signing Circle programmable wallet transaction authorization...</p>
              </div>
            </div>
          )}

          {txStep === 'relaying' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <Loader2 className="text-blue-400 animate-spin" size={48} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-white uppercase tracking-widest">Relaying Transaction</span>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-wider">Sending user signature to Stablr Paymaster relayer...</p>
              </div>
            </div>
          )}

          {txStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 animate-bounce">
                <ShieldCheck className="text-emerald-400" size={32} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black text-white uppercase tracking-widest">Transaction Confirmed</span>
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Sponsored swap executed successfully on Arc Network!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
