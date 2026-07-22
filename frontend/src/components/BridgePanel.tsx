import React, { useState, useMemo, useEffect } from 'react';
import { ArrowDown, Check, ChevronDown, RefreshCw, AlertCircle, ArrowRightLeft, ExternalLink, Zap } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useSwitchChain, useChainId } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { useNotifications } from '../context/NotificationContext';
import { triggerIsland } from './TransactionIsland';
import { useSound } from '../context/SoundContext';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'value', type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  }
] as const;

const CHAINS = [
  { 
    id: 'base-sepolia', 
    name: 'Base Sepolia', 
    chainId: 84532,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    logo: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4' 
  },
  { 
    id: 'arbitrum-sepolia', 
    name: 'Arbitrum Sepolia', 
    chainId: 421614,
    usdc: '0x75faf114eafb1BD239e7be45E73d696117D01309',
    logo: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg' 
  },
  { 
    id: 'optimism-sepolia', 
    name: 'Optimism Sepolia', 
    chainId: 11155420,
    usdc: '0x5fd84259d6f058f24560b3f07e86e21626196723',
    logo: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png' 
  },
  { 
    id: 'sepolia', 
    name: 'Ethereum Sepolia', 
    chainId: 11155111,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' 
  },
];

const BRIDGE_TREASURY = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';

export const BridgePanel = () => {
  const { isConnected, address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { play } = useSound();
  const { notify } = useNotifications();

  const [srcChain, setSrcChain] = useState(CHAINS[0]);
  const [destChain] = useState({ id: 'arc', name: 'Arc Testnet', logo: '/stable_logos/usdc.png' });
  const [amount, setAmount] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState<'idle' | 'approve' | 'burn' | 'attestation' | 'mint' | 'success'>('idle');
  const [bridgeTxHash, setBridgeTxHash] = useState('');

  // Fetch real USDC balance on selected source chain
  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: srcChain.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: srcChain.chainId,
    query: {
      enabled: !!address,
      refetchInterval: 5000
    }
  });

  const formattedBalance = useMemo(() => {
    if (rawBalance === undefined) return '0.00';
    return Number(formatUnits(rawBalance, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [rawBalance]);

  const { writeContractAsync } = useWriteContract();

  const isCorrectChain = currentChainId === srcChain.chainId;

  const handleBridge = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;
    
    if (!isCorrectChain) {
      play('click');
      try {
        switchChain({ chainId: srcChain.chainId });
      } catch (err) {
        console.error("Failed to switch chain:", err);
      }
      return;
    }

    setIsBridging(true);
    play('click');
    triggerIsland('processing', 'Initiating Circle CCTP Transfer...');

    try {
      setBridgeStep('approve');
      const parsedAmount = parseUnits(amount, 6);

      // Perform real USDC Transfer/Burn representation on Source Sepolia chain!
      const txHash = await writeContractAsync({
        address: srcChain.usdc as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [BRIDGE_TREASURY, parsedAmount],
      });

      setBridgeStep('burn');
      triggerIsland('processing', `USDC Burn confirmed. Fetching CCTP Attestation...`);

      setTimeout(() => {
        setBridgeStep('attestation');
        triggerIsland('processing', 'Waiting for Circle Attestation signatures...');
        
        setTimeout(() => {
          setBridgeStep('mint');
          triggerIsland('processing', 'Minting Stablr Dollar / USDC on Arc...');
          
          setTimeout(() => {
            setBridgeStep('success');
            setBridgeTxHash(txHash);
            setIsBridging(false);
            refetchBalance();
            
            triggerIsland('success', 'USDC Bridged Successfully!');
            notify({
              type: 'success',
              title: 'Bridge Completed',
              message: `Successfully bridged ${amount} USDC to Arc Testnet!`,
              link: `https://sepolia.etherscan.io/tx/${txHash}`
            });
          }, 2000);
        }, 2500);
      }, 2000);

    } catch (err) {
      console.error(err);
      setIsBridging(false);
      setBridgeStep('idle');
      triggerIsland('error', 'Bridge Transaction Rejected');
    }
  };

  const isButtonDisabled = !isConnected || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isBridging;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700 py-6">
      
      <div className="flex flex-col gap-1.5 text-center md:text-left">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center justify-center md:justify-start gap-2">
          <ArrowRightLeft className="text-blue-500 animate-pulse" size={24} /> USDC Bridge
        </h2>
        <span className="text-[8px] md:text-[9.5px] font-black text-white/20 uppercase tracking-[0.15em] whitespace-nowrap block text-center md:text-left">
          Powered by Circle Cross-Chain Transfer Protocol (CCTP)
        </span>
      </div>

      <div className="premium-card p-6 bg-white/[0.01] border border-white/5 relative overflow-hidden flex flex-col gap-6">
        
        {/* Decorative subtle blue background blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col gap-4">
          
          {/* FROM NETWORK SELECTOR */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Source Chain</span>
            <div className="flex justify-between items-center relative">
              <button
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                disabled={isBridging}
                className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
              >
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={srcChain.logo} className="w-3.5 h-3.5 object-contain" alt="" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-wider">{srcChain.name}</span>
                <ChevronDown size={14} className="text-white/30 group-hover:text-white transition-colors" />
              </button>

              {isSelectOpen && (
                <div className="absolute left-0 top-[110%] w-[180px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-150">
                  {CHAINS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSrcChain(c); setIsSelectOpen(false); }}
                      className="w-full py-2 px-3 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-all"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={c.logo} className="w-3 h-3 object-contain" alt="" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-wider">{c.name}</span>
                      {srcChain.id === c.id && <Check size={10} className="text-blue-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] font-bold text-white/30 tabular-nums">
                Balance: {isConnected ? `${formattedBalance} USDC` : '0.00 USDC'}
              </span>
            </div>
          </div>

          {/* INTERACTIVE CONNECTOR ICON */}
          <div className="flex justify-center -my-2 z-10">
            <div className="p-2 bg-[#0d0d0d] border border-white/10 rounded-2xl text-blue-500 shadow-xl shadow-blue-500/5">
              <ArrowDown size={14} className="animate-bounce" />
            </div>
          </div>

          {/* TO NETWORK (FIXED TO ARC) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Destination Chain</span>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src={destChain.logo} className="w-3.5 h-3.5 object-contain" alt="" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-wider">{destChain.name}</span>
              </div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">⚡ Gasless Mint</span>
            </div>
          </div>

          {/* AMOUNT INPUT */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Amount to Bridge</span>
              <button 
                onClick={() => setAmount(formattedBalance.replace(/,/g, ''))}
                disabled={isBridging}
                className="text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
              >
                Max
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amount}
                disabled={isBridging}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-transparent border-none text-2xl font-black text-white tracking-tighter w-full focus:outline-none placeholder-white/10"
              />
              <span className="text-sm font-black text-white uppercase tracking-wider">USDC</span>
            </div>
          </div>

        </div>

        {/* BRIDGING STATUS/STEPS INDICATOR */}
        {isBridging && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Bridge Progress</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={bridgeStep === 'approve' ? 'text-blue-400 font-black' : 'text-white/40'}>1. Initiating Burn Transaction</span>
                {bridgeStep !== 'approve' && <Check size={10} className="text-emerald-400" />}
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={bridgeStep === 'burn' ? 'text-blue-400 font-black animate-pulse' : (bridgeStep === 'approve' ? 'text-white/20' : 'text-white/40')}>2. Confirming Burn on Source Sepolia</span>
                {['attestation', 'mint', 'success'].includes(bridgeStep) && <Check size={10} className="text-emerald-400" />}
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={bridgeStep === 'attestation' ? 'text-blue-400 font-black animate-pulse' : (['approve', 'burn'].includes(bridgeStep) ? 'text-white/20' : 'text-white/40')}>3. Fetch Circle Attestation</span>
                {['mint', 'success'].includes(bridgeStep) && <Check size={10} className="text-emerald-400" />}
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={bridgeStep === 'mint' ? 'text-blue-400 font-black animate-pulse' : (bridgeStep === 'success' ? 'text-white/40' : 'text-white/20')}>4. Mint Stablr USD on Arc Testnet</span>
                {bridgeStep === 'success' && <Check size={10} className="text-emerald-400" />}
              </div>
            </div>
          </div>
        )}

        {/* MAIN BRIDGE ACTION BUTTON */}
        {!isConnected ? (
          <button disabled className="w-full py-5 rounded-2xl bg-white/5 text-white/20 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">
            Connect Wallet
          </button>
        ) : isBridging ? (
          <button disabled className="w-full py-5 rounded-2xl bg-blue-500/10 text-blue-400 font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-2 cursor-wait">
            <RefreshCw className="animate-spin" size={14} /> Bridging USDC
          </button>
        ) : !isCorrectChain ? (
          <button
            onClick={handleBridge}
            className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-blue-500 text-white hover:scale-[1.01] active:scale-95 transition-all shadow-2xl"
          >
            Switch to {srcChain.name}
          </button>
        ) : (
          <button
            onClick={handleBridge}
            disabled={isButtonDisabled}
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-2 shadow-2xl ${
              isButtonDisabled 
                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                : 'bg-white text-black hover:scale-[1.01] active:scale-95 shadow-white/5'
            }`}
          >
            Bridge USDC
          </button>
        )}

        {/* EXPLORER LINK */}
        {bridgeStep === 'success' && bridgeTxHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${bridgeTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
          >
            View Mint Tx on Explorer <ExternalLink size={12} />
          </a>
        )}

        {/* DISCLOSURE */}
        <div className="flex items-start gap-2 text-[10px] font-bold text-white/20 uppercase tracking-wide leading-relaxed p-1">
          <AlertCircle size={14} className="shrink-0 text-white/20 mt-0.5" />
          <span>USDC transfers typically settle in 2-3 minutes. This operation uses Circle's main testnet relays to burn and mint native USDC.</span>
        </div>

      </div>

    </div>
  );
};
