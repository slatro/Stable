import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Clock, ExternalLink, ArrowRight, TrendingUp, Zap, ShieldCheck } from 'lucide-react';
import { usePublicClient, useAccount } from 'wagmi';
import { formatUnits, parseAbiItem } from 'viem';
import { CONTRACT_ADDRESSES, ARC_TESTNET_CONFIG, TOKENS } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';

const SWAP_EVENT = parseAbiItem('event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)');

export const TransactionPanel = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'global' | 'my'>('global');
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient) return;

    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        // RPC Limit: 10,000 blocks. We use 9,000 to be safe.
        const fromBlock = currentBlock - 9000n > 0n ? currentBlock - 9000n : 0n;

        const logs = await publicClient.getLogs({
          event: SWAP_EVENT,
          fromBlock: fromBlock,
          toBlock: 'latest'
        });

        const decodedLogs = await Promise.all(logs.map(async (log: any) => {
          const { user, tokenIn, tokenOut, amountIn, amountOut } = log.args;
          const tIn = TOKENS.find(t => t.addr.toLowerCase() === tokenIn.toLowerCase());
          const tOut = TOKENS.find(t => t.addr.toLowerCase() === tokenOut.toLowerCase());

          if (!tIn || !tOut) return null;

          // Decimals-aware price calculation
          const valIn = parseFloat(formatUnits(amountIn, tIn.decimals));
          const valOut = parseFloat(formatUnits(amountOut, tOut.decimals));
          const price = valOut > 0 ? (valIn / valOut) : 0;

          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          const time = new Date(Number(block.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            user,
            tokenIn: tIn,
            tokenOut: tOut,
            amountIn: valIn,
            amountOut: valOut,
            price: price.toFixed(6),
            time,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber
          };
        }));

        setTransactions(decodedLogs.filter(Boolean).sort((a: any, b: any) => Number(b.blockNumber) - Number(a.blockNumber)));
      } catch (error) {
        console.error("Failed to fetch transaction logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [publicClient]);

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'global') return transactions.slice(0, 10);
    return transactions.filter(tx => tx.user.toLowerCase() === address?.toLowerCase()).slice(0, 10);
  }, [transactions, activeTab, address]);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveTab('global')} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'global' ? 'text-white' : 'text-white/20 hover:text-white'}`}>Global Stream</button>
          <button onClick={() => setActiveTab('my')} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'my' ? 'text-white' : 'text-white/20 hover:text-white'}`}>My Activity</button>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Live Sync Active</span>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Time</th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Pair</th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">TX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-3 opacity-20" />
                    <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">Scanning Arc Network...</span>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em]">No transactions found in last 9,000 blocks</span>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/60 tabular-nums">{tx.time}</span>
                        <span className="text-[7px] font-bold text-white/10 uppercase">Confirmed</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center">
                          <Activity size={10} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">Swap</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-white">{tx.tokenIn.symbol}</span>
                        <ArrowRight size={10} className="text-white/20" />
                        <span className="text-[10px] font-black text-white">{tx.tokenOut.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white tabular-nums">{tx.amountIn.toLocaleString()}</span>
                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter">Inbound Asset</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-emerald-400 tabular-nums">${tx.price}</span>
                        <span className="text-[7px] font-bold text-white/20 uppercase tracking-tighter">Market Rate</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all inline-block"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
