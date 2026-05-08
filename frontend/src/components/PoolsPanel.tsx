import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Check, ChevronDown, Wallet, ArrowLeft, RefreshCw, Layers, Droplets, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { CONTRACT_ADDRESSES, TOKENS, ARC_TESTNET_CONFIG } from '../config/contracts';
import AMM_ABI from '../abis/ArcFXAMM.json';
import FACTORY_ABI from '../abis/ArcFXFactory.json';
import ROUTER_ABI from '../abis/ArcFXRouter.json';
import ERC20_ABI from '../abis/ERC20.json';
import { usePrices } from '../context/PriceContext';
import { useNotifications } from '../context/NotificationContext';

const FormatSymbol = ({ symbol, className = "" }: { symbol: string | undefined, className?: string }) => {
  if (!symbol) return null;
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
  label, amount, onAmountChange, selectedToken, onTokenSelect, tokens, otherToken, address, onUpdateState
}: any) => {
  const { data: balance } = useReadContract({
    address: (selectedToken?.addr || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: ERC20_ABI.abi || ERC20_ABI as any,
    functionName: 'balanceOf',
    args: address && selectedToken?.addr ? [address] : undefined,
    query: { enabled: !!address && !!selectedToken?.addr, refetchInterval: 5000 }
  });

  const { data: allowance } = useReadContract({
    address: (selectedToken?.addr || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: ERC20_ABI.abi || ERC20_ABI as any,
    functionName: 'allowance',
    args: address && selectedToken?.addr ? [address, CONTRACT_ADDRESSES.ROUTER] : undefined,
    query: { enabled: !!address && !!selectedToken?.addr, refetchInterval: 5000 }
  });

  const parsedAmount = useMemo(() => {
    if (!amount || !selectedToken?.decimals || isNaN(parseFloat(amount)) || amount === '.') return 0n;
    try { return parseUnits(amount, selectedToken.decimals); } catch (e) { return 0n; }
  }, [amount, selectedToken]);

  const insufficient = useMemo(() => {
    if (!address || balance === undefined || balance === null || !selectedToken) return false;
    try { return BigInt(balance.toString()) < parsedAmount; } catch (e) { return false; }
  }, [address, balance, parsedAmount, selectedToken]);

  const needsApprove = useMemo(() => {
    if (!address || allowance === undefined || allowance === null || !selectedToken || parsedAmount === 0n) return false;
    try { return BigInt(allowance.toString()) < parsedAmount; } catch (e) { return false; }
  }, [address, allowance, parsedAmount, selectedToken]);

  useEffect(() => {
    if (onUpdateState) onUpdateState({ insufficient, needsApprove, balance, selectedToken });
  }, [insufficient, needsApprove, balance, selectedToken, onUpdateState]);

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{label}</span>
        <div className="relative">
          <button onClick={() => setIsSelectOpen(!isSelectOpen)} className="flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-all group w-[130px] justify-between">
            <div className="flex items-center gap-2">
              {selectedToken ? (
                <>
                  <img src={selectedToken.logo} alt="" className="w-4 h-4 rounded-full" />
                  <span className="text-[10px] font-black text-white uppercase tracking-wider">{selectedToken.symbol}</span>
                </>
              ) : <span className="text-[10px] font-black text-white/30 uppercase">Select</span>}
            </div>
            <ChevronDown size={12} className="text-white/20 group-hover:text-white transition-all" />
          </button>
          {isSelectOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[110%] w-[130px] bg-[#1a1a1a] border border-white/20 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1">
              <div className="flex flex-col">
                {(tokens || []).map((t: any) => {
                  const isSelected = selectedToken?.symbol === t.symbol;
                  const isOther = otherToken?.symbol === t.symbol;
                  return (
                    <button key={t.symbol} disabled={isOther} onClick={() => { onTokenSelect(t); setIsSelectOpen(false); }} className={`w-full py-1.5 px-2.5 flex items-center justify-between hover:bg-white/5 rounded-lg transition-all group ${isOther ? 'opacity-20 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center gap-2">
                        <img src={t.logo} alt="" className="w-4 h-4 rounded-full" />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-400' : 'text-white/50 group-hover:text-white'}`}>{t.symbol}</span>
                      </div>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-blue-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-end">
        <input type="text" value={amount} onChange={(e) => onAmountChange(e.target.value)} placeholder="0.00" className="bg-transparent border-none outline-none text-xl font-black text-white w-2/3 p-0 placeholder:text-white/5" />
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-tighter">Balance</span>
          <span className="text-[10px] font-black text-white/60 tabular-nums">
            {balance !== undefined ? parseFloat(formatUnits(balance as bigint, selectedToken?.decimals || 18)).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

export const PoolsPanel = () => {
  const { address } = useAccount();
  const { prices } = usePrices();
  const { notify, dismiss } = useNotifications();
  const [view, setView] = useState<'list' | 'add' | 'remove'>('list');
  const [tokenA, setTokenA] = useState<any>(TOKENS[2]);
  const [tokenB, setTokenB] = useState<any>(TOKENS[4]); 
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePercent, setRemovePercent] = useState(50);
  const [stateA, setStateA] = useState<any>({});
  const [stateB, setStateB] = useState<any>({});
  const [activeTid, setActiveTid] = useState<string | null>(null);

  const { data: hash, writeContract: writeAction } = useWriteContract();

  // WAIT FOR TX RECEIPT
  const { isLoading: isWaiting, data: receipt, isSuccess: isConfirmed, isError: isTxError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!hash) return;

    if (isConfirmed && receipt) {
      if (activeTid) dismiss(activeTid);
      
      if (receipt.status === 'success') {
        notify({ 
          type: 'success', 
          title: 'Transaction Confirmed', 
          message: 'Operation was successful!', 
          txHash: hash 
        });
        setView('list');
        setAmountA('');
        setAmountB('');
      } else {
        notify({ 
          type: 'error', 
          title: 'Transaction Reverted', 
          message: 'Blockchain rejected the transaction. Check explorer for details.', 
          txHash: hash 
        });
      }
      setActiveTid(null);
    }

    if (isTxError) {
      if (activeTid) dismiss(activeTid);
      notify({ type: 'error', title: 'Network Error', message: 'Failed to fetch transaction status.', txHash: hash });
      setActiveTid(null);
    }
  }, [isConfirmed, isTxError, receipt, hash]);

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
    abi: FACTORY_ABI.abi || FACTORY_ABI as any,
    functionName: 'getPool',
    args: tokenA?.addr && tokenB?.addr ? [tokenA.addr as `0x${string}`, tokenB.addr as `0x${string}`] : undefined,
    query: { enabled: !!tokenA?.addr && !!tokenB?.addr }
  });

  const { data: totalPoolLiquidity } = useReadContract({
    address: (poolAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: AMM_ABI.abi || AMM_ABI as any,
    functionName: 'totalLiquidity',
    query: { enabled: !!poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000', refetchInterval: 5000 }
  });

  const { data: reservesData } = useReadContracts({
    contracts: [
      { address: (poolAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'reserve0' },
      { address: (poolAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'reserve1' }
    ],
    query: { enabled: !!poolAddress && poolAddress !== '0x0000000000000000000000000000000000000000', refetchInterval: 5000 }
  });

  const reserves = useMemo(() => {
    if (!reservesData || reservesData.length < 2) return null;
    const r0 = reservesData[0].result as bigint | undefined;
    const r1 = reservesData[1].result as bigint | undefined;
    if (r0 === undefined || r1 === undefined) return null;
    return [r0, r1];
  }, [reservesData]);

  const ratio = useMemo(() => {
    if (reserves && tokenA && tokenB) {
      const [r0, r1] = reserves as [bigint, bigint];
      if (r0 > 0n && r1 > 0n) {
        const sorted = [tokenA.addr?.toLowerCase(), tokenB.addr?.toLowerCase()].sort();
        const isA0 = tokenA.addr?.toLowerCase() === sorted[0];
        const val0 = parseFloat(formatUnits(r0, (isA0 ? tokenA.decimals : tokenB.decimals) || 18));
        const val1 = parseFloat(formatUnits(r1, (isA0 ? tokenB.decimals : tokenA.decimals) || 18));
        if (val0 > 0 && val1 > 0) return isA0 ? val1 / val0 : val0 / val1;
      }
    }
    if (!tokenA || !tokenB || !prices) return 1;
    try {
      const priceA = (prices as any)[tokenA.symbol]?.price || 0;
      const priceB = (prices as any)[tokenB.symbol]?.price || 0;
      if (priceA > 0 && priceB > 0) return priceA / priceB;
    } catch (e) { return 1; }
    return 1;
  }, [reserves, tokenA, tokenB, prices]);

  const handleAmountAChange = (val: string) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    setAmountA(val);
    const num = parseFloat(val);
    if (ratio && val && !isNaN(num) && num > 0) setAmountB((num * ratio).toFixed(6));
    else if (!val || isNaN(num)) setAmountB('');
  };

  const handleAmountBChange = (val: string) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    setAmountB(val);
    const num = parseFloat(val);
    if (ratio && val && !isNaN(num) && num > 0) setAmountA((num / ratio).toFixed(6));
    else if (!val || isNaN(num)) setAmountA('');
  };

  const { refetch: refetchA } = useReadContract({ address: tokenA?.addr as `0x${string}`, abi: ERC20_ABI.abi || ERC20_ABI as any, functionName: 'allowance', args: address && CONTRACT_ADDRESSES.ROUTER ? [address, CONTRACT_ADDRESSES.ROUTER] : undefined, query: { enabled: !!address && !!tokenA?.addr } });
  const { refetch: refetchB } = useReadContract({ address: tokenB?.addr as `0x${string}`, abi: ERC20_ABI.abi || ERC20_ABI as any, functionName: 'allowance', args: address && CONTRACT_ADDRESSES.ROUTER ? [address, CONTRACT_ADDRESSES.ROUTER] : undefined, query: { enabled: !!address && !!tokenB?.addr } });

  const handleApprove = async (token: any, amount: string, refetch: () => void) => {
    const tid = notify({ type: 'loading', title: 'Approving Token', message: `Approving ${token.symbol} for Router...` });
    setActiveTid(tid);
    try {
      await writeAction({
        address: token.addr as `0x${string}`,
        abi: ERC20_ABI.abi || ERC20_ABI as any,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.ROUTER, parseUnits(amount, token.decimals || 18)]
      }, {
        onSuccess: () => { setTimeout(refetch, 2000); }
      });
    } catch (e) { dismiss(tid); notify({ type: 'error', title: 'Approval Failed', message: 'User rejected or transaction failed.' }); setActiveTid(null); }
  };

  const handleAddLiquidity = () => {
    if (!tokenA || !tokenB || !amountA || !amountB) return;
    const tid = notify({ type: 'loading', title: 'Adding Liquidity', message: `Supplying assets to the pool...` });
    setActiveTid(tid);
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const rawA = parseUnits(amountA, tokenA.decimals);
    const rawB = parseUnits(amountB, tokenB.decimals);

    writeAction({
      address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`,
      abi: ROUTER_ABI.abi || ROUTER_ABI as any,
      functionName: 'addLiquidity',
      args: [tokenA.addr, tokenB.addr, rawA, rawB, 0n, 0n, address, deadline]
    }, {
      onError: (err) => { dismiss(tid); notify({ type: 'error', title: 'Transaction Failed', message: 'Liquidity provision failed. Check balance/allowance.' }); setActiveTid(null); }
    });
  };

  const { data: userLPBalance } = useReadContract({ address: (poolAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'liquidityShares', args: address ? [address] : undefined, query: { enabled: !!poolAddress && !!address, refetchInterval: 5000 } });

  const handleRemoveLiquidity = () => {
    if (!poolAddress || removePercent <= 0 || !userLPBalance) return;
    const tid = notify({ type: 'loading', title: 'Removing Liquidity', message: `Withdrawing assets...` });
    setActiveTid(tid);
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const liquidityToRemove = (userLPBalance as bigint * BigInt(removePercent)) / 100n;

    writeAction({
      address: CONTRACT_ADDRESSES.ROUTER as `0x${string}`,
      abi: ROUTER_ABI.abi || ROUTER_ABI as any,
      functionName: 'removeLiquidity',
      args: [tokenA.addr, tokenB.addr, liquidityToRemove, 0n, 0n, address, deadline]
    }, {
      onError: () => { dismiss(tid); notify({ type: 'error', title: 'Failed', message: 'Removal failed.' }); setActiveTid(null); }
    });
  };

  const { data: allPoolAddresses } = useReadContracts({
    contracts: PLATFORM_POOLS.map(p => {
      const sorted = [p.tokens[0]?.addr?.toLowerCase(), p.tokens[1]?.addr?.toLowerCase()].sort();
      return { address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`, abi: FACTORY_ABI.abi || FACTORY_ABI as any, functionName: 'getPool', args: [sorted[0], sorted[1]] };
    })
  });

  const { data: allUserBalances } = useReadContracts({
    contracts: (allPoolAddresses || []).map((res: any) => {
      const addr = res.result;
      const isValid = addr && addr !== '0x0000000000000000000000000000000000000000';
      return { address: (isValid ? addr : '0x0000000000000000000000000000000000000000') as `0x${string}`, abi: AMM_ABI.abi || AMM_ABI as any, functionName: 'liquidityShares', args: address ? [address] : undefined };
    }),
    query: { enabled: !!allPoolAddresses && !!address, refetchInterval: 3000 }
  });

  const positions = useMemo(() => {
    if (!allUserBalances || !allPoolAddresses || !Array.isArray(allUserBalances)) return [];
    return PLATFORM_POOLS.map((pool, i) => {
      const balanceRes = allUserBalances[i];
      const poolAddrRes = allPoolAddresses[i];
      if (!balanceRes || !poolAddrRes) return null;
      const balance = (balanceRes.status === 'success') ? (balanceRes.result as bigint) : 0n;
      const poolAddr = (poolAddrRes.status === 'success') ? (poolAddrRes.result as string) : null;
      if (!balance || balance === 0n || !poolAddr || poolAddr === '0x0000000000000000000000000000000000000000') return null;
      return { ...pool, balance, poolAddr };
    }).filter(p => p !== null);
  }, [allUserBalances, allPoolAddresses, PLATFORM_POOLS]);

  if (view === 'add' || view === 'remove') {
    const isAdd = view === 'add';
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[440px] mx-auto w-full py-8">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => setView('list')} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><ArrowLeft size={20} /></button>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setView('add')} className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAdd ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/40 hover:text-white'}`}>Add</button>
            <button onClick={() => setView('remove')} className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isAdd ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/40 hover:text-white'}`}>Remove</button>
          </div>
          <div className="w-10" />
        </div>

        <div className="premium-card p-5 flex flex-col gap-4">
          {isAdd ? (
            <>
              <TokenInputSection label="Token A" selectedToken={tokenA} amount={amountA} onAmountChange={handleAmountAChange} address={address} onTokenSelect={(t: any) => { if(tokenB?.symbol === t.symbol) setTokenB(undefined); setTokenA(t); }} onUpdateState={setStateA} otherToken={tokenB} tokens={TOKENS.slice(2)} />
              <div className="flex justify-center -my-2 z-10"><div className="p-1.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-blue-500"><Plus size={12} strokeWidth={4} /></div></div>
              <TokenInputSection label="Token B" selectedToken={tokenB} amount={amountB} onAmountChange={handleAmountBChange} address={address} onTokenSelect={(t: any) => { if(tokenA?.symbol === t.symbol) setTokenA(undefined); setTokenB(t); }} onUpdateState={setStateB} otherToken={tokenA} tokens={TOKENS.slice(2)} />
            </>
          ) : (
            <div className="flex flex-col gap-6 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end px-1">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Amount to Remove</span>
                  <span className="text-4xl font-black text-white tracking-tighter">{removePercent}%</span>
                </div>
                <input type="range" min="1" max="100" value={removePercent} onChange={(e) => setRemovePercent(parseInt(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button key={pct} onClick={() => setRemovePercent(pct)} className={`py-2 rounded-lg border text-[10px] font-black transition-all ${removePercent === pct ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-white/40'}`}>{pct}%</button>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
                  <span>You will receive</span>
                  <div className="flex items-center gap-1"><Droplets size={12} /> Pool: {tokenA?.symbol}/{tokenB?.symbol}</div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  {[tokenA, tokenB].map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><img src={t?.logo} className="w-5 h-5 rounded-full" /><span className="text-xs font-black text-white uppercase">{t?.symbol}</span></div>
                      <span className="text-sm font-black text-white">~ {(() => {
                        if (!reserves || !userLPBalance || !totalPoolLiquidity || (totalPoolLiquidity as bigint) === 0n) return "0.00";
                        const sorted = [tokenA.addr?.toLowerCase(), tokenB.addr?.toLowerCase()].sort();
                        const isThis0 = t.addr?.toLowerCase() === sorted[0];
                        const res = isThis0 ? reserves[0] : reserves[1];
                        const amount = (res * (userLPBalance as bigint) * BigInt(removePercent)) / (totalPoolLiquidity as bigint) / 100n;
                        return parseFloat(formatUnits(amount, t.decimals || 18)).toLocaleString(undefined, { maximumFractionDigits: 6 });
                      })()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isAdd ? (
            !tokenA || !tokenB ? <button disabled className="w-full py-5 rounded-xl bg-white/5 text-white/20 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Select Tokens</button> :
            stateA.insufficient ? <button disabled className="w-full py-5 rounded-xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Insufficient {tokenA.symbol}</button> :
            stateB.insufficient ? <button disabled className="w-full py-5 rounded-xl bg-red-500/10 text-red-400 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">Insufficient {tokenB.symbol}</button> :
            stateA.needsApprove ? (
              <button onClick={() => handleApprove(tokenA, amountA, refetchA)} disabled={isWaiting} className="w-full py-5 rounded-xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                {isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} Approve {tokenA.symbol}
              </button>
            ) : stateB.needsApprove ? (
              <button onClick={() => handleApprove(tokenB, amountB, refetchB)} disabled={isWaiting} className="w-full py-5 rounded-xl bg-blue-500 text-white font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                {isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} Approve {tokenB.symbol}
              </button>
            ) : (
              <button onClick={handleAddLiquidity} disabled={isWaiting} className="w-full py-5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5">
                {isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} Add Liquidity
              </button>
            )
          ) : (
            <button onClick={handleRemoveLiquidity} disabled={!userLPBalance || userLPBalance === 0n || isWaiting} className={`w-full py-5 rounded-xl font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-2 shadow-xl ${(!userLPBalance || userLPBalance === 0n) ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-red-500 text-white hover:scale-[1.02]'}`}>
              {isWaiting ? <RefreshCw className="animate-spin" size={14} /> : null} {(!userLPBalance || userLPBalance === 0n) ? 'No Position' : 'Remove Liquidity'}
            </button>
          )}
          
          {hash && (
            <a 
              href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[10px] font-black text-blue-400/60 hover:text-blue-400 uppercase tracking-widest pt-2 transition-colors"
            >
              View on Explorer <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 w-full max-w-7xl mx-auto py-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Pools</h2>
        <button onClick={() => setView('add')} className="px-5 py-2.5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-white/10">
          <Plus size={14} strokeWidth={4} /> Create Position
        </button>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <div className="premium-card min-h-[400px] flex flex-col bg-white/[0.02] overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/[0.03] flex items-center justify-between">
               <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2"><Layers size={14} className="text-blue-500" /> My Positions</h3>
               {positions.length > 0 && <span className="px-2 py-0.5 rounded-md bg-blue-500 text-[9px] font-black text-white">{positions.length}</span>}
            </div>
            <div className="p-6 flex-1">
              {positions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-white/10"><Wallet size={40} /><p className="text-[10px] font-black uppercase tracking-widest">No Active Liquidity</p></div>
              ) : (
                <div className="flex flex-col gap-3">
                  {positions.map((pos: any, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2"><img src={pos.tokens[0]?.logo} className="w-6 h-6 rounded-full border border-black" /><img src={pos.tokens[1]?.logo} className="w-6 h-6 rounded-full border border-black" /></div>
                          <span className="text-xs font-black text-white uppercase"><FormatSymbol symbol={pos.tokens[0]?.symbol} /> / <FormatSymbol symbol={pos.tokens[1]?.symbol} /></span>
                        </div>
                        <button onClick={() => { setTokenA(pos.tokens[0]); setTokenB(pos.tokens[1]); setView('remove'); }} className="px-3 py-1.5 rounded-lg bg-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black">Manage</button>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-white/5">
                        <div className="flex flex-col"><span className="text-[8px] font-black text-white/20 uppercase">LP Balance</span><span className="text-[11px] font-black text-white">{parseFloat(formatUnits(pos.balance, 18)).toFixed(6)}</span></div>
                        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400/60 uppercase"><span>Earning</span><div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <div className="premium-card overflow-hidden bg-white/[0.02]">
            <div className="p-4 border-b border-white/5 bg-white/[0.03]"><h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2"><Droplets size={14} className="text-emerald-500" /> Platform Pools</h3></div>
            <table className="w-full text-left">
              <thead><tr className="border-b border-white/5"><th className="py-4 px-6 text-[9px] font-black text-white/20 uppercase">Pair</th><th className="py-4 px-4 text-[9px] font-black text-white/20 uppercase">TVL</th><th className="py-4 px-6 text-right text-[9px] font-black text-white/20 uppercase">Action</th></tr></thead>
              <tbody className="divide-y divide-white/[0.02]">
                {PLATFORM_POOLS.map((pool, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="flex -space-x-1.5"><img src={pool.tokens[0]?.logo} className="w-6 h-6 rounded-full border border-black" /><img src={pool.tokens[1]?.logo} className="w-6 h-6 rounded-full border border-black" /></div><span className="text-[11px] font-black text-white uppercase"><FormatSymbol symbol={pool.tokens[0]?.symbol} /> / <FormatSymbol symbol={pool.tokens[1]?.symbol} /></span></div></td>
                    <td className="py-4 px-4 text-[10px] font-black text-white/50">{pool.tvl}</td>
                    <td className="py-4 px-6 text-right"><button onClick={() => { setTokenA(pool.tokens[0]); setTokenB(pool.tokens[1]); setView('add'); }} className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase hover:bg-white hover:text-black">Add / Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
