
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  blockExplorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
};

export const CONTRACT_ADDRESSES = {
  FACTORY: "0x9d308F16D2BBa17126518da8756811447a988453",
  ROUTER: "0xF54B19cfef19BD3ca63B1983cF67C047B908532c",
  VAULT: "0x5858585858585858585858585858585858585858",
  MULTI_FAUCET: "0x3A34de790Af20F44fAB6e2Bc98D3A4e1d24D42B0",
  // Synthetic Assets (a-Assets) - NEWLY DEPLOYED
  aUSDC: "0xeD7cb772b49448027901546870425579596faaE1",
  aEURC: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9",
  aTRYC: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee",
  aGBPC: "0x6374151C499DADc9A54650D25CdFF3B5688652Ba",
  aJPYC: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09",
  astUSDC: "0x0000000000000000000000000000000000000000",
  FARM: "0x0000000000000000000000000000000000000000",
  // Native Gas & Tokens
  USDC_NATIVE: "0x3600000000000000000000000000000000000000",
  EURC_NATIVE: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
} as const;

export const TOKEN_ICONS = {
  USDC: "/stable_logos/usdc.png",
  EURC: "/stable_logos/eurc.png",
  aUSDC: "/stable_logos/usdc.png",
  aEURC: "/stable_logos/eurc.png",
  aTRYC: "/stable_logos/tryc.png",
  aGBPC: "/stable_logos/gbpc.png",
  aJPYC: "/stable_logos/jpyc.png",
  astUSDC: "/stable_logos/usdc.png",
};

export const TOKENS = [
  { symbol: 'USDC', name: 'Native USDC', decimals: 18, addr: CONTRACT_ADDRESSES.USDC_NATIVE, logo: TOKEN_ICONS.USDC },
  { symbol: 'EURC', name: 'Native EURC', decimals: 18, addr: CONTRACT_ADDRESSES.EURC_NATIVE, logo: TOKEN_ICONS.EURC },
  { symbol: 'aUSDC', name: 'Arc Dollar', decimals: 6, addr: CONTRACT_ADDRESSES.aUSDC, logo: TOKEN_ICONS.aUSDC },
  { symbol: 'aEURC', name: 'Arc Euro', decimals: 18, addr: CONTRACT_ADDRESSES.aEURC, logo: TOKEN_ICONS.aEURC },
  { symbol: 'aTRYC', name: 'Arc Lira', decimals: 18, addr: CONTRACT_ADDRESSES.aTRYC, logo: TOKEN_ICONS.aTRYC },
  { symbol: 'aGBPC', name: 'Arc Pound', decimals: 18, addr: CONTRACT_ADDRESSES.aGBPC, logo: TOKEN_ICONS.aGBPC },
  { symbol: 'aJPYC', name: 'Arc Yen', decimals: 18, addr: CONTRACT_ADDRESSES.aJPYC, logo: TOKEN_ICONS.aJPYC },
  { symbol: 'astUSDC', name: 'Staked Arc Dollar', decimals: 18, addr: CONTRACT_ADDRESSES.astUSDC, logo: TOKEN_ICONS.astUSDC },
];
