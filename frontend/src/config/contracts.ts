export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  blockExplorerUrl: "https://testnet.arcscan.app",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
};

export const CONTRACT_ADDRESSES = {
  FACTORY: "0x24a93D7ac6fE6176C86E065fa1B3B651Cc9DB5FA",
  ROUTER: "0xce894c000F4003e3F45F9422b6E47EEcf1eAe4b0",
  VAULT: "0x5858585858585858585858585858585858585858",
  MULTI_FAUCET: "0x256B553b2Db34a0B10536cB4628610aFF4E1e7f6",
  ARC_POINTS: "0x0d08131435cf890e8B4426EA3E0e3B4425c3b33e",
  STAKING_CONTRACT: "0x3554D4d10682fdc680A2cb64ADa35f8E7a297a32",
  aUSDC: "0xeD7cb772b49448027901546870425579596faaE1",
  aEURC: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9",
  aTRYC: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee",
  aGBPC: "0x6374151C499DADc9A54650D25CdFF3B5688652Ba",
  aJPYC: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09",
  astUSDC: "0x3554D4d10682fdc680A2cb64ADa35f8E7a297a32",
  FARM: "0x0000000000000000000000000000000000000000",
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
  { symbol: 'USDC', name: 'Native USDC', decimals: 6, addr: CONTRACT_ADDRESSES.USDC_NATIVE, logo: TOKEN_ICONS.USDC },
  { symbol: 'EURC', name: 'Native EURC', decimals: 6, addr: CONTRACT_ADDRESSES.EURC_NATIVE, logo: TOKEN_ICONS.EURC },
  { symbol: 'aUSDC', name: 'Arc Dollar', decimals: 6, addr: CONTRACT_ADDRESSES.aUSDC, logo: TOKEN_ICONS.aUSDC },
  { symbol: 'aEURC', name: 'Arc Euro', decimals: 18, addr: CONTRACT_ADDRESSES.aEURC, logo: TOKEN_ICONS.aEURC },
  { symbol: 'aTRYC', name: 'Arc Lira', decimals: 18, addr: CONTRACT_ADDRESSES.aTRYC, logo: TOKEN_ICONS.aTRYC },
  { symbol: 'aGBPC', name: 'Arc Pound', decimals: 18, addr: CONTRACT_ADDRESSES.aGBPC, logo: TOKEN_ICONS.aGBPC },
  { symbol: 'aJPYC', name: 'Arc Yen', decimals: 18, addr: CONTRACT_ADDRESSES.aJPYC, logo: TOKEN_ICONS.aJPYC },
  { symbol: 'astUSDC', name: 'Staked Arc Dollar', decimals: 6, addr: CONTRACT_ADDRESSES.astUSDC, logo: TOKEN_ICONS.astUSDC },
];

