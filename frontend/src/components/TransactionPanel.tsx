import React from 'react';
import { ExternalLink, RefreshCw, ArrowDown, Plus } from 'lucide-react';

export const TransactionPanel = () => {
  const transactions = [
    { type: 'Swap', status: 'confirmed', hash: '0x123...456', amount: '100 mUSDC -> 91.8 mEURC', time: '2m ago' },
    { type: 'Mint', status: 'confirmed', hash: '0xabc...def', amount: '1,000 mUSDC', time: '10m ago' },
    { type: 'Add Liquidity', status: 'pending', hash: '0x789...012', amount: '500 mUSDC / 460 mEURC', time: 'Just now' },
  ];

  return (
    <div className="glass-panel p-8 rounded-3xl w-full max-w-4xl mx-auto mt-12 mb-20 text-left">
      <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
      
      <div className="space-y-4">
        {transactions.map((tx, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500 animate-pulse'
              }`}>
                {tx.type === 'Swap' && <RefreshCw size={18} />}
                {tx.type === 'Mint' && <ArrowDown size={18} />}
                {tx.type === 'Add Liquidity' && <Plus size={18} />}
              </div>
              <div>
                <span className="block text-sm font-bold text-white">{tx.type}</span>
                <span className="block text-xs text-white/40">{tx.amount}</span>
              </div>
            </div>
            
            <div className="text-right">
              <a 
                href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-1 transition-colors"
              >
                {tx.hash} <ExternalLink size={12} />
              </a>
              <span className="block text-[10px] uppercase tracking-wider text-white/20">{tx.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
