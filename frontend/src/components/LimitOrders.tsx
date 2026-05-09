import React, { useState, useEffect } from 'react';
import { ListFilter, XCircle, Clock, Zap, ExternalLink, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi';

interface LimitOrder {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: string;
  price: string;
  status: 'Open' | 'Executing' | 'Cancelled';
  filled: string;
  timestamp: number;
}

export const LimitOrders = () => {
  const { address, isConnected } = useAccount();
  const [orders, setOrders] = useState<LimitOrder[]>([]);

  // Load and listen for limit orders
  useEffect(() => {
    if (!address || !isConnected) {
      setOrders([]);
      return;
    }

    const userAddr = address.toLowerCase();
    const localKey = `arc_limit_orders_${userAddr}`;
    
    // Initial load
    const saved = JSON.parse(localStorage.getItem(localKey) || '[]');
    setOrders(saved);

    const handleNewTx = (event: any) => {
      const { state, type, asset, amount, price, txHash } = event.detail;
      
      // We only care about Limit Orders here
      if (type === 'Limit Order' && (state === 'success' || state === 'processing')) {
        const newOrder: LimitOrder = {
          id: txHash || `limit-${Date.now()}`,
          pair: asset || 'Unknown Pair',
          type: 'BUY', // Default to BUY for now, in real app we'd get this from metadata
          amount: amount || '0',
          price: price || '0',
          status: state === 'processing' ? 'Executing' : 'Open',
          filled: '0%',
          timestamp: Date.now()
        };

        setOrders(prev => {
          const exists = prev.find(o => o.id === newOrder.id);
          if (exists && state === 'success') {
            const updated = prev.map(o => o.id === newOrder.id ? { ...o, status: 'Open' as const } : o);
            localStorage.setItem(localKey, JSON.stringify(updated));
            return updated;
          }
          if (!exists) {
            const updated = [newOrder, ...prev].slice(0, 10);
            localStorage.setItem(localKey, JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener('arc-transaction', handleNewTx);
    return () => window.removeEventListener('arc-transaction', handleNewTx);
  }, [address, isConnected]);

  const handleCancel = (id: string) => {
    if (!address) return;
    const localKey = `arc_limit_orders_${address.toLowerCase()}`;
    setOrders(prev => {
      const filtered = prev.filter(o => o.id !== id);
      localStorage.setItem(localKey, JSON.stringify(filtered));
      return filtered;
    });
  };

  return (
    <div className="w-full animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <Zap size={16} className="text-orange-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Active Limit Orders</h3>
            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">Pending execution on-chain</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black text-emerald-400/60 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10 uppercase tracking-widest">
            {orders.length} ACTIVE
          </span>
        </div>
      </div>

      <div className="premium-card overflow-hidden border border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-4 py-5">Market / Pair</th>
                <th className="px-4 py-5">Side</th>
                <th className="px-4 py-5">Price</th>
                <th className="px-4 py-5">Amount</th>
                <th className="px-4 py-5">Filled</th>
                <th className="px-4 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {orders.length > 0 ? orders.map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] transition-all duration-300">
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${order.type === 'BUY' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.4)]'}`} />
                      <span className="text-[9px] font-black text-white uppercase tracking-[0.15em]">{order.pair}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${order.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
                      {order.type}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[12px] font-black text-white tabular-nums">{order.price}</span>
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[12px] font-black text-white/70 tabular-nums">{order.amount}</span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className={`h-full ${order.type === 'BUY' ? 'bg-emerald-400/50' : 'bg-rose-400/50'}`} 
                          style={{ width: order.filled }} 
                        />
                      </div>
                      <span className="text-[10px] font-black text-white/40 tabular-nums">{order.filled}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right">
                    <button 
                      onClick={() => handleCancel(order.id)}
                      className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-rose-500/5 border border-rose-500/10 text-[8px] font-black text-rose-400/70 uppercase tracking-widest hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-95"
                    >
                      <XCircle size={10} />
                      Cancel
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <ListFilter size={32} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                        {isConnected ? "No Active Limit Orders" : "Connect Wallet to view orders"}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
