import React, { useState, useMemo } from 'react';
import { ArrowDown, Check, ChevronDown, RefreshCw, AlertCircle, ArrowRightLeft, ExternalLink, Loader2 } from 'lucide-react';
import { useReadContract, useSwitchChain, useChainId, useWriteContract } from 'wagmi';
import { useAccount } from '../hooks/web3';
import { formatUnits, parseUnits } from 'viem';
import { useNotifications } from '../context/NotificationContext';
import { triggerIsland } from './TransactionIsland';
import { useSound } from '../context/SoundContext';
import { ARC_TESTNET_CONFIG } from '../config/contracts';

// ─── CCTP V2 Contract ABIs ────────────────────────────────────────────────────

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'value', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  }
] as const;

const TOKEN_MESSENGER_ABI = [
  {
    name: 'depositForBurn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [{ name: 'nonce', type: 'uint64' }]
  }
] as const;

const MESSAGE_TRANSMITTER_ABI = [
  {
    name: 'receiveMessage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' }
    ],
    outputs: [{ name: 'success', type: 'bool' }]
  }
] as const;

// ─── CCTP Contract Addresses ──────────────────────────────────────────────────

const TOKEN_MESSENGER_V2 = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';
const MESSAGE_TRANSMITTER_V2_ARC = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275';
const ARC_DOMAIN_ID = 26;

const CHAINS = [
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    chainId: 84532,
    domain: 6,
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGN9M22J699TqO4l1VBJJtzE3bJx_e4xihJjwJ1Aj8qN72LhBWfjRai4ZN&s=10',
    bg: 'transparent',
    containerClass: 'w-7 h-7 rounded-md overflow-hidden border border-white/50',
    imgClass: 'w-full h-full object-cover',
    explorer: 'https://sepolia.basescan.org/tx'
  },
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    domain: 3,
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
    bg: '#1a1a1a',
    containerClass: 'w-7 h-7 rounded-md border border-white/10',
    imgClass: 'w-6 h-6',
    explorer: 'https://sepolia.arbiscan.io/tx'
  },
  {
    id: 'optimism-sepolia',
    name: 'Optimism Sepolia',
    chainId: 11155420,
    domain: 2,
    usdc: '0x5fd842b3f1aba4a6012d93e155452292f7680957',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',
    bg: '#FF0420',
    containerClass: 'w-7 h-7 rounded-md border border-white/10',
    imgClass: 'w-6 h-6',
    explorer: 'https://sepolia-optimism.etherscan.io/tx'
  },
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    domain: 0,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    bg: '#FFFFFF',
    containerClass: 'w-7 h-7 rounded-md border border-white/10',
    imgClass: 'w-[22px] h-[22px]',
    explorer: 'https://sepolia.etherscan.io/tx'
  },
];

type BridgeStep = 'idle' | 'approve' | 'burn' | 'attestation' | 'mint' | 'success' | 'error';

// ─── Attestation Polling ──────────────────────────────────────────────────────

const pollAttestation = async (
  sourceDomain: number,
  txHash: string,
  onUpdate: (msg: string) => void
): Promise<{ message: string; attestation: string }> => {
  const url = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${txHash}`;
  let attempts = 0;
  while (true) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      const msg = data?.messages?.[0];
      if (msg && msg.attestation && msg.attestation !== 'PENDING') {
        return { message: msg.message, attestation: msg.attestation };
      }
      attempts++;
      onUpdate(`Waiting for Circle attestation... (${attempts * 5}s elapsed)`);
    } catch (err) {
      // Network error – keep retrying
    }
    await new Promise(r => setTimeout(r, 5000));
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export const BridgePanel = () => {
  const { isConnected, address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { play } = useSound();
  const { notify } = useNotifications();
  const { writeContractAsync } = useWriteContract();

  const [srcChain, setSrcChain] = useState(CHAINS[0]);
  const [amount, setAmount] = useState('');
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeStep, setBridgeStep] = useState<BridgeStep>('idle');
  const [bridgeTxHash, setBridgeTxHash] = useState('');
  const [arcTxHash, setArcTxHash] = useState('');
  const [attestationStatus, setAttestationStatus] = useState('');

  const { data: rawBalance, refetch: refetchBalance } = useReadContract({
    address: srcChain.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: srcChain.chainId,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const formattedBalance = useMemo(() => {
    if (rawBalance === undefined) return '0.00';
    return Number(formatUnits(rawBalance, 6)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, [rawBalance]);

  const isCorrectChain = currentChainId === srcChain.chainId;

  const handleBridge = async () => {
    if (!address || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;

    // 1. Switch to source chain if needed
    if (!isCorrectChain) {
      play('click');
      try { await switchChain({ chainId: srcChain.chainId }); } catch {}
      return;
    }

    setIsBridging(true);
    setBridgeTxHash('');
    setAttestationStatus('');
    play('click');
    triggerIsland('processing', 'Starting CCTP Bridge...');

    try {
      const parsedAmount = parseUnits(amount, 6);
      // Pad address to bytes32 for mintRecipient
      const mintRecipient = `0x000000000000000000000000${address.slice(2)}` as `0x${string}`;

      // ── STEP 1: APPROVE ─────────────────────────────────────────────────────
      setBridgeStep('approve');
      triggerIsland('processing', 'Approving USDC to Circle TokenMessenger...');

      await writeContractAsync({
        address: srcChain.usdc as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TOKEN_MESSENGER_V2, parsedAmount],
        chainId: srcChain.chainId,
      });

      // ── STEP 2: DEPOSIT FOR BURN ─────────────────────────────────────────────
      setBridgeStep('burn');
      triggerIsland('processing', 'Burning USDC via CCTP...');

      // CCTP V2 relay fee: 0.5% of amount, minimum 0.001 USDC
      const maxFee = parsedAmount / BigInt(200) > BigInt(1000)
        ? parsedAmount / BigInt(200)
        : BigInt(1000);

      const burnTxHash = await writeContractAsync({
        address: TOKEN_MESSENGER_V2 as `0x${string}`,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [
          parsedAmount,
          ARC_DOMAIN_ID,         // destination: Arc Testnet domain 26
          mintRecipient,          // bytes32 recipient
          srcChain.usdc as `0x${string}`,  // burnToken
          '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`, // any caller
          maxFee,                 // 0.5% relay fee in USDC
          500,                    // minFinalityThreshold (fast finality)
        ],
        chainId: srcChain.chainId,
      });

      setBridgeTxHash(burnTxHash);
      triggerIsland('processing', 'Burn confirmed. Waiting for Circle attestation...');

      // ── STEP 3: POLL CIRCLE ATTESTATION API ────────────────────────────────
      setBridgeStep('attestation');
      const { message, attestation } = await pollAttestation(
        srcChain.domain,
        burnTxHash,
        (msg) => {
          setAttestationStatus(msg);
          triggerIsland('processing', msg);
        }
      );

      // ── STEP 4: SWITCH TO ARC & RECEIVE MESSAGE ────────────────────────────
      setBridgeStep('mint');
      triggerIsland('processing', 'Switching to Arc Testnet to mint USDC...');

      await switchChain({ chainId: ARC_TESTNET_CONFIG.chainId });

      triggerIsland('processing', 'Minting native USDC on Arc Testnet...');

      const arcHash = await writeContractAsync({
        address: MESSAGE_TRANSMITTER_V2_ARC as `0x${string}`,
        abi: MESSAGE_TRANSMITTER_ABI,
        functionName: 'receiveMessage',
        args: [message as `0x${string}`, attestation as `0x${string}`],
        chainId: ARC_TESTNET_CONFIG.chainId,
      });

      setArcTxHash(arcHash);

      // ── SUCCESS ─────────────────────────────────────────────────────────────
      setBridgeStep('success');
      setIsBridging(false);
      refetchBalance();
      triggerIsland('success', `${amount} USDC bridged to Arc Testnet!`);
      notify({
        type: 'success',
        title: 'CCTP Bridge Complete',
        message: `${amount} native USDC minted on Arc Testnet!`,
        link: `${srcChain.explorer}/${burnTxHash}`
      });

    } catch (err: any) {
      console.error('CCTP bridge error:', err);
      setIsBridging(false);
      setBridgeStep('error');
      triggerIsland('error', err?.shortMessage || 'Bridge transaction failed');
    }
  };

  const stepLabels: { key: BridgeStep; label: string }[] = [
    { key: 'approve', label: '1. Approve USDC to TokenMessenger' },
    { key: 'burn',    label: '2. depositForBurn on Source Chain' },
    { key: 'attestation', label: '3. Circle Attestation Signature' },
    { key: 'mint',    label: '4. receiveMessage → Mint on Arc' },
  ];

  const stepOrder = ['approve', 'burn', 'attestation', 'mint', 'success'];
  const currentIdx = stepOrder.indexOf(bridgeStep);

  const isButtonDisabled = !isConnected || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isBridging;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-700 py-6">

      <div className="flex flex-col gap-1.5 text-center md:text-left">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center justify-center md:justify-start gap-2">
          <ArrowRightLeft className="text-blue-500 animate-pulse" size={24} /> USDC Bridge
        </h2>
        <span className="text-[8px] md:text-[9.5px] font-black text-white/20 uppercase tracking-[0.15em] whitespace-nowrap block text-center md:text-left">
          Powered by Circle CCTP V2 — Real on-chain burn &amp; mint
        </span>
      </div>

      <div className="premium-card p-6 bg-white/[0.01] border border-white/5 relative overflow-hidden flex flex-col gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col gap-4">

          {/* FROM NETWORK SELECTOR */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Source Chain</span>
            <div className="flex justify-between items-center relative w-full">

              <div className="relative">
                <button
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                  disabled={isBridging}
                  className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className={`flex items-center justify-center shrink-0 ${srcChain.containerClass || 'w-7 h-7 rounded-xl overflow-hidden'}`} style={{ background: srcChain.bg }}>
                    <img src={srcChain.logo} className={`object-contain ${srcChain.imgClass || 'w-5 h-5'}`} alt="" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{srcChain.name}</span>
                  <ChevronDown size={14} className="text-white/30 group-hover:text-white transition-colors" />
                </button>

                {isSelectOpen && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-[115%] w-[210px] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-150">
                    {CHAINS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSrcChain(c); setIsSelectOpen(false); }}
                        className="w-full py-2 px-3 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <div className={`flex items-center justify-center shrink-0 ${c.containerClass || 'w-7 h-7 rounded-xl overflow-hidden'}`} style={{ background: c.bg }}>
                          <img src={c.logo} className={`object-contain ${c.imgClass || 'w-5 h-5'}`} alt="" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">{c.name}</span>
                        {srcChain.id === c.id && <Check size={10} className="text-blue-400 ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 select-none">
                <span className="text-[10px] font-bold text-white/30 tabular-nums">
                  Balance: {isConnected ? `${formattedBalance} USDC` : '0.00 USDC'}
                </span>
                {isConnected && (
                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    Get testnet USDC <ExternalLink size={8} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ARROW */}
          <div className="flex justify-center -my-2 z-10">
            <div className="p-2 bg-[#0d0d0d] border border-white/10 rounded-2xl text-blue-500 shadow-xl shadow-blue-500/5">
              <ArrowDown size={14} className="animate-bounce" />
            </div>
          </div>

          {/* TO NETWORK (ARC) */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Destination Chain</span>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/stable_logos/usdc.png" className="w-3.5 h-3.5 object-contain" alt="" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-wider">Arc Testnet</span>
              </div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">⚡ Native USDC</span>
            </div>
          </div>

          {/* AMOUNT INPUT */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Amount</span>
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

        {/* BRIDGE PROGRESS */}
        {(isBridging || bridgeStep === 'success' || bridgeStep === 'error') && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Bridge Progress</span>
            <div className="flex flex-col gap-2.5">
              {stepLabels.map(({ key, label }, idx) => {
                const stepIdx = stepOrder.indexOf(key);
                const isDone = bridgeStep !== 'error' && currentIdx > stepIdx;
                const isActive = bridgeStep === key && isBridging;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold transition-colors ${
                      isActive ? 'text-blue-400 font-black' :
                      isDone ? 'text-white/50' :
                      'text-white/20'
                    }`}>
                      {isActive && <Loader2 size={9} className="inline animate-spin mr-1.5" />}
                      {label}
                      {isActive && key === 'attestation' && attestationStatus && (
                        <span className="ml-1 text-white/30">– {attestationStatus}</span>
                      )}
                    </span>
                    {isDone && <Check size={10} className="text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
            {bridgeStep === 'error' && (
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1">
                ✕ Transaction failed or rejected
              </p>
            )}
          </div>
        )}

        {/* ACTION BUTTON */}
        {!isConnected ? (
          <button disabled className="w-full py-5 rounded-2xl bg-white/5 text-white/20 font-black text-xs uppercase tracking-[0.4em] cursor-not-allowed">
            Connect Wallet
          </button>
        ) : isBridging ? (
          <button disabled className="w-full py-5 rounded-2xl bg-blue-500/10 text-blue-400 font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-2 cursor-wait">
            <RefreshCw className="animate-spin" size={14} />
            {bridgeStep === 'attestation' ? 'Waiting for Attestation...' :
             bridgeStep === 'mint' ? 'Minting on Arc...' :
             bridgeStep === 'burn' ? 'Burning USDC...' :
             'Approving...'}
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
            Bridge USDC via CCTP
          </button>
        )}

        {/* BURN TX LINK */}
        <div className="flex flex-col gap-2">
          {bridgeTxHash && (
            <a
              href={`${srcChain.explorer}/${bridgeTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
            >
              View Burn Tx on {srcChain.name} Explorer <ExternalLink size={12} />
            </a>
          )}
          {arcTxHash && (
            <a
              href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${arcTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest transition-colors"
            >
              View Mint Tx on ArcScan <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* DISCLOSURE */}
        <div className="flex items-start gap-2 text-[10px] font-bold text-white/20 uppercase tracking-wide leading-relaxed p-1">
          <AlertCircle size={14} className="shrink-0 text-white/20 mt-0.5" />
          <span>
            Real CCTP V2 bridge: USDC is burned on source chain, attested by Circle, and native USDC is minted on Arc Testnet.
            Attestation typically takes 2–5 minutes.
          </span>
        </div>

      </div>
    </div>
  );
};
