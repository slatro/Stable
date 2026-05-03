import React from 'react';
import { ExternalLink, RefreshCw, ArrowDown, Plus } from 'lucide-react';

export const TransactionPanel = () => {
  const transactions = [
    { time: "14:20:12", pair: "mUSDC/mEURC", side: "BUY", price: "1.0848", amount: "1,200.00", status: "Success" },
    { time: "14:18:45", pair: "mUSDC/mEURC", side: "SELL", price: "1.0845", amount: "450.00", status: "Success" },
    { time: "14:15:22", pair: "mUSDC/mEURC", side: "BUY", price: "1.0842", amount: "2,100.00", status: "Success" },
    { time: "14:12:10", pair: "mUSDC/mEURC", side: "BUY", price: "1.0844", amount: "890.00", status: "Success" },
  ];

  return (
    <div className="premium-card overflow-hidden">
      {/* Desktop View: Full Table */}
      <div className="hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.01]">
              <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Time</th>
              <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Pair</th>
              <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Side</th>
              <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Price</th>
              <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20">Amount</th>
              <th className="px-8 py-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/20 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {transactions.map((tx, i) => (
              <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6 text-sm font-medium text-white/30">{tx.time}</td>
                <td className="px-8 py-6 text-sm font-bold text-white/90">{tx.pair}</td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${tx.side === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                    {tx.side}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm font-mono font-medium text-white/60">{tx.price}</td>
                <td className="px-8 py-6 text-sm font-bold text-white">{tx.amount}</td>
                <td className="px-8 py-6 text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Confirmed</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Compressed Minimalist List */}
      <div className="md:hidden flex flex-col divide-y divide-white/[0.05]">
        {transactions.map((tx, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/90 tracking-tight">{tx.pair}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm ${tx.side === 'BUY' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {tx.side}
                </span>
              </div>
              <span className="text-[9px] font-medium text-white/30">{tx.time}</span>
            </div>
            
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[11px] font-black text-white">{tx.amount}</span>
              <div className="flex items-center gap-1 opacity-80 scale-90 origin-right">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[8px] font-bold text-emerald-500 uppercase">Confirmed</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
