import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Check, ChevronDown, Wallet, ArrowLeft, RefreshCw, Layers, Droplets } from 'lucide-react';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { CONTRACT_ADDRESSES, TOKENS } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import ERC20_ABI from '../abis/ERC20.json';
import { usePrices } from '../context/PriceContext';
import { useNotifications } from '../context/NotificationContext';

const FormatSymbol = ({ symbol, className = "" }: { symbol: string, className?: string }) => {
  if (symbol.startsWith('a')) {
    return (
      <span className={className}>
        <span className="text-blue-400 lowercase">a</span>
        <span className="uppercase">{symbol.slice(1)}</span>
      </span>
    );
  }
  return <span className={`${className} uppercase`}>{symbol}</span>;
};

const TokenInputSection = ({ 
  label, 
  token, 
  amount, 
  setAmount, 
  address, 
  onTokenToggle, 
  onUpdateState,
  isSelectOpen,
  onTokenSelect,
  otherToken
}: any) => {
  const { data: balance } = useReadContract({
    address: (token?.addr || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: ERC20_ABI as any,
    functionName: 'balanceOf',
    args: address && token?.addr ? [address] : undefined,
    query: { enabled: !!address && !!token?.addr, refetchInterval: 5000 }
  });

  const { data: allowance } = useReadContract({
    address: (token?.addr || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: ERC20_ABI as any,
    functionName: 'allowance',
    args: address && token?.addr ? [address, CONTRACT_ADDRESSES.ROUTER] : undefined,
    query: { enabled: !!address && !!token?.addr, refetchInterval: 5000 }
  });

  const parsedAmount = amount && token?.decimals && !isNaN(parseFloat(amount)) ? parseUnits(amount, token.decimals) : 0n;
  const insufficient = address && balance !== undefined && token && (parsedAmount > (balance as bigint));
  const needsApprove = address && allowance !== undefined && amount && token && (allowance as bigint) < parsedAmount;

  useEffect(() => {
    onUpdateState({ insufficient, needsApprove, balance, token });
  }, [insufficient, needsApprove, balance, token, onUpdateState]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{label}</span>
        <div className="relative">
          <button onClick={onTokenToggle} className="flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all group w-[130px] justify-between">
            <div className="flex items-center gap-2">
              {token ? (
                <>
                  <img src={token.logo} alt="" className="w-4 h-4 rounded-full" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">{token.symbol}</span>
                </>
              ) : (
                <span className="text-[10px] font-black text-white/30 uppercase">Select</span>
              )}
            </div>
            <ChevronDown size={12} className="text-white/20 group-hover:text-white transition-all" />
          </button>

          {isSelectOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[110%] w-[130px] bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1">
              <div className="flex flex-col">
                {TOKENS.slice(2)
                  .filter(t => t.symbol !== 'aUSDC')
                  .map((t) => {
                  const isSelected = token?.symbol === t.symbol;
                  const isOther = otherToken?.symbol === t.symbol;
                  return (
                    <button 
                      key={t.symbol} 
                      disabled={isOther}
                      onClick={() => { onTokenSelect(t); }} 
                      className={`w-full py-1.5 px-2.5 flex items-center justify-between hover:bg-white/5 rounded-lg transition-all group ${isOther ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={t.logo} alt="" className="w-4 h-4 rounded-full" />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-400' : 'text-white/50 group-hover:text-white'}`}>{t.symbol}</span>
                      </div>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <input 
          type="number" 
          placeholder="0.00" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          className="bg-transparent text-2xl font-black text-white outline-none w-full" 
        />
        <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">{token?.symbol || '...'}</span>
      </div>
      <div className="flex justify-between items-center text-[9px] font-bold text-white/20 uppercase tracking-tighter">
        <div className="flex items-center gap-1.5">
          <span>Balance: {balance && token ? parseFloat(formatUnits(balance as bigint, token?.decimals || 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '0.00'}</span>
          {!needsApprove && allowance !== undefined && (allowance as bigint) > 0n && (
            <Check size={12} className="text-emerald-400" strokeWidth={4} />
          )}
        </div>
        <button onClick={() => balance && token && setAmount(formatUnits(balance as bigint, token?.decimals || 18))} className="text-blue-400 hover:text-blue-300">MAX</button>
      </div>
    </div>
  );
};

export const PoolsPanel = () => {
  const { address, isConnected } = useAccount();
  const { prices } = usePrices();
  const { notify, dismiss } = useNotifications();
  const [view, setView] = useState<'list' | 'add' | 'remove'>('list');
  const [selectedPool, setSelectedPool] = useState<any>(undefined);

  const [tokenA, setTokenA] = useState<any>(TOKENS[2]);
  const [tokenB, setTokenB] = useState<any>(TOKENS[4]); 
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePercent, setRemovePercent] = useState(50);
  const [isSelectOpen, setIsSelectOpen] = useState<'A' | 'B' | undefined>(undefined);

  const [stateA, setStateA] = useState<any>({});
  const [stateB, setStateB] = useState<any>({});

  const { writeContract: writeAction } = useWriteContract();

  const PLATFORM_POOLS = useMemo(() => {
    const ausdc = TOKENS.find(t => t.symbol === 'aUSDC');
    const aeurc = TOKENS.find(t => t.symbol === 'aEURC');
    const agbpc = TOKENS.find(t => t.symbol === 'aGBPC');
    const ajpyc = TOKENS.find(t => t.symbol === 'aJPYC');
    const atryc = TOKENS.find(t => t.symbol === 'aTRYC');

    return [
      { tokens: [ausdc, aeurc], apr: "3.24%", tvl: "$12.4M" },
      { tokens: [ausdc, agbpc], apr: "2.85%", tvl: "$8.1M" },
      { tokens: [ausdc, ajpyc], apr: "3.12%", tvl: "$6.2M" },
      { tokens: [ausdc, atryc], apr: "11.45%", tvl: "$4.8M" }
    ];
  }, []);

  const { data: poolAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: FACTORY_ABI as any,
    functionName: 'getPool',
    args: tokenA?.addr && tokenB?.addr ? [tokenA.addr as `0x${string}`, tokenB.addr as `0x${string}`] : undefined,
    query: { enabled: !!tokenA?.addr && !!tokenB?.addr }
  });

  const { data: reserves } = useReadContract({
    address: (poolAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: AMM_ABI as any,
    functionName: 'getReserves',
    query: { enabled: !!poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000', refetchInterval: 5000 }
  });

  const ratio = useMemo(() => {
    if (reserves && tokenA && tokenB) {
      const [r0, r1] = reserves as [bigint, bigint];
      if (r0 > 0n && r1 > 0n) {
        const sorted = [tokenA.addr.toLowerCase(), tokenB.addr.toLowerCase()].sort();
        const isA0 = tokenA.addr.toLowerCase() === sorted[0];
        const val0 = parseFloat(formatUnits(r0, (isA0 ? tokenA.decimals : tokenB.decimals) || 18));
        const val1 = parseFloat(formatUnits(r1, (isA0 ? tokenB.decimals : tokenA.decimals) || 18));
        return isA0 ? val1 / val0 : val0 / val1;
      }
    }
    if (!tokenA || !tokenB) return null;
    const priceA = (prices as any)[tokenA.symbol]?.price || 0;
    const priceB = (prices as any)[tokenB.symbol]?.price || 0;
    return priceA > 0 && priceB > 0 ? priceA / priceB : null;
  }, [reserves, tokenA, tokenB, prices]);

  const handleAmountAChange = (val: string) => {
    setAmountA(val);
    if (ratio && val && !isNaN(parseFloat(val))) setAmountB((parseFloat(val) * ratio).toFixed(6));
    else if (!val) setAmountB('');
  };

  const handleAmountBChange = (val: string) => {
    setAmountB(val);
    if (ratio && val && !isNaN(parseFloat(val))) setAmountA((parseFloat(val) / ratio).toFixed(6));
    else if (!val) setAmountA('');
  };

  const handleApprove = (token: any) => {
    const tid = notify({ type: 'loading', title: 'Approving', message: `Allowing Router to use ${token.symbol}...` });
    writeAction({
      address: token.addr as `0x${string}`,
      abi: ERC20_ABI as any,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.ROUTER, maxUint256]
    }, {
      onSuccess: () => { dismiss(tid); notify({ type: 'success', title: 'Success', message: 'Approval confirmed.' }); }
    });
  };

  const handleAddLiquidity = () => {
    if (!tokenA || !tokenB || !amountA || !amountB) return;
    const tid = notify({ type: 'loading', title: 'Adding Liquidity', message: `Creating ${tokenA.symbol}/${tokenB.symbol} position...` });
    writeAction({
      address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`,
      abi: ROUTER_ABI as any,
      functionName: 'addLiquidity',
      args: [
        tokenA.addr, tokenB.addr,
        parseUnits(amountA, tokenA.decimals), parseUnits(amountB, tokenB.decimals),
        0n, 0n, address, BigInt(Math.floor(Date.now() / 1000) + 1200)
      ]
    }, {
      onSuccess: () => { dismiss(tid); setView('list'); notify({ type: 'success', title: 'Success', message: 'Liquidity added.' }); }
    });
  };

  const positions = useMemo(() => {
    return []; 
  }, []);

  if (view === 'add') {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[440px] mx-auto w-full py-8">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => setView('list')} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><ArrowLeft size={20} /></button>
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">Add Liquidity</h2>
          <div className="w-10" />
        </div>
        <div className="premium-card p-5 flex flex-col gap-4">
          <TokenInputSection label="Token A" token={tokenA} amount={amountA} setAmount={handleAmountAChange} address={address} isSelectOpen={isSelectOpen === 'A'} onTokenToggle={() => setIsSelectOpen(isSelectOpen === 'A' ? undefined : 'A')} onTokenSelect={(t: any) => { if(tokenB?.symbol === t.symbol) setTokenB(undefined); setTokenA(t); setIsSelectOpen(undefined); }} onUpdateState={setStateA} otherToken={tokenB} />
          <div className="flex justify-center -my-2 z-10"><div className="p-1.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-blue-500"><Plus size={12} strokeWidth={4} /></div></div>
          <TokenInputSection label="Token B" token={tokenB} amount={amountB} setAmount={handleAmountBChange} address={address} isSelectOpen={isSelectOpen === 'B'} onTokenToggle={() => setIsSelectOpen(isSelectOpen === 'B' ? undefined : 'B')} onTokenSelect={(t: any) => { if(tokenA?.symbol === t.symbol) setTokenA(undefined); setTokenB(t); setIsSelectOpen(undefined); }} onUpdateState={setStateB} otherToken={tokenA} />
          {ratio && tokenA && tokenB && <div className="px-1 flex justify-between items-center text-[9px] font-black text-white/20 uppercase tracking-[0.2em]"><span>Pool Ratio</span><span>1 {tokenA.symbol} = {ratio.toFixed(4)} {tokenB.symbol}</span></div>}
          {!tokenA || !tokenB ? <button disabled className="w-full py-5 rounded-xl bg-white/5 text-white/20 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Select Tokens</button> :
           stateA.insufficient ? <button disabled className="w-full py-5 rounded-xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Insufficient {tokenA.symbol}</button> :
           stateB.insufficient ? <button disabled className="w-full py-5 rounded-xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Insufficient {tokenB.symbol}</button> :
           stateA.needsApprove ? <button onClick={() => handleApprove(tokenA)} className="w-full py-5 rounded-xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em]">Approve {tokenA.symbol}</button> :
           stateB.needsApprove ? <button onClick={() => handleApprove(tokenB)} className="w-full py-5 rounded-xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em]">Approve {tokenB.symbol}</button> :
           <button onClick={handleAddLiquidity} className="w-full py-5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5">Add Liquidity</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 w-full max-w-7xl mx-auto py-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Pools</h2>
        </div>
        <button onClick={() => setView('add')} className="px-5 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-white/10">
          <Plus size={14} strokeWidth={4} /> Create Position
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="premium-card min-h-[400px] flex flex-col bg-white/[0.02] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 bg-white/[0.03] flex items-center justify-between">
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                 <Layers size={14} className="text-blue-500" /> My Positions
               </h3>
               {positions.length > 0 && <span className="px-2 py-0.5 rounded-md bg-blue-500 text-[9px] font-black text-white">{positions.length}</span>}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              {positions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-12">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <Wallet className="text-white/10" size={20} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">No Active Liquidity</p>
                    <p className="text-[8px] font-bold text-white/10 uppercase tracking-tighter">Your LP positions will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Positions list */}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="premium-card overflow-hidden border-white/5 shadow-2xl min-h-[400px] bg-white/[0.02]">
            <div className="p-4 border-b border-white/5 bg-white/[0.03]">
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2">
                 <Droplets size={14} className="text-emerald-500" /> Available Platform Pools
               </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="py-4 px-6 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Pair</th>
                    <th className="py-4 px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">TVL</th>
                    <th className="py-4 px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">APR</th>
                    <th className="py-4 px-6 text-right text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {PLATFORM_POOLS.map((pool, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-1.5">
                            <img src={pool.tokens[0]?.logo} className="w-6 h-6 rounded-full border border-[#0a0a0a] bg-[#0a0a0a] z-10" />
                            <img src={pool.tokens[1]?.logo} className="w-6 h-6 rounded-full border border-[#0a0a0a] bg-[#0a0a0a] z-0" />
                          </div>
                          <span className="text-[11px] font-black text-white uppercase tracking-tight">
                            <FormatSymbol symbol={pool.tokens[0]?.symbol || ''} /> / <FormatSymbol symbol={pool.tokens[1]?.symbol || ''} />
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4"><span className="text-[10px] font-black text-white/50 tabular-nums">{pool.tvl}</span></td>
                      <td className="py-4 px-4"><span className="text-[10px] font-black text-emerald-400 tabular-nums">{pool.apr}</span></td>
                      <td className="py-4 px-6 text-right">
                        <button 
                          onClick={() => { setTokenA(pool.tokens[0]); setTokenB(pool.tokens[1]); setView('add'); }} 
                          className="px-4 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
