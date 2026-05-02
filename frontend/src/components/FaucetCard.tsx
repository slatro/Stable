import React from 'react';
import { Droplets } from 'lucide-react';

export const FaucetCard = () => (
  <div className="glass-panel p-8 rounded-3xl w-full max-w-4xl mx-auto mt-12 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
    
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-left">
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-white mb-2">Mint Test Tokens</h2>
        <p className="text-white/40 text-sm leading-relaxed">
          These are mock tokens for Arc Testnet demos only. Arc uses USDC as native gas, but you'll need these specific mUSDC and mEURC tokens to interact with the AMM pool.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button className="btn-secondary flex items-center gap-3 py-4 group">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Droplets size={20} />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-white/40">Faucet</span>
            <span className="block font-bold">1,000 mUSDC</span>
          </div>
        </button>

        <button className="btn-secondary flex items-center gap-3 py-4 group">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Droplets size={20} />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-white/40">Faucet</span>
            <span className="block font-bold">1,000 mEURC</span>
          </div>
        </button>
      </div>
    </div>
  </div>
);
