
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.arc.io",
  blockExplorerUrl: "https://explorer.arc.io",
  nativeCurrency: {
    name: "ARC",
    symbol: "ARC",
    decimals: 18,
  },
};

export const CONTRACT_ADDRESSES = {
  FACTORY: "0x9D2D8f8B9F5D8f8f8f8f8f8f8f8f8f8f8f8f8f8f",
  ROUTER: "0x94Fb0a829e87f83CD82b1be797431a4552558de6",
  VAULT: "0x5858585858585858585858585858585858585858",
  MULTI_FAUCET: "0x3A34de790Af20F44fAB6e2Bc98D3A4e1d24D42B0",
  // Synthetic Assets (a-Assets)
  aUSDC: "0x83F14a7474205e3eB604CdD19E4F7f9FD688Ed53",
  aEURC: "0x83F15d7890478904789047890478904789047890",
  aTRYC: "0x834D997C5280c5729503AD1608596BB5FE673A3b",
  aGBPC: "0x18183F4FcC1Bbb64aeA4485211C1AaD16384C58A",
  aJPYC: "0xBCfc8FA5E192F7ecfC9F4f55b7BA12fFE940a7F4",
  astUSDC: "0x5858585858585858585858585858585858585858",
  FARM: "0x67c4de5996fF060bD4edC3c19F4f080FC1A0d03a",
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
  { symbol: 'USDC', name: 'Circle USDC', decimals: 6, addr: '0x0000000000000000000000000000000000000000', logo: TOKEN_ICONS.USDC },
  { symbol: 'aUSDC', name: 'Arc Dollar', decimals: 6, addr: CONTRACT_ADDRESSES.aUSDC, logo: TOKEN_ICONS.aUSDC },
  { symbol: 'aEURC', name: 'Arc Euro', decimals: 18, addr: CONTRACT_ADDRESSES.aEURC, logo: TOKEN_ICONS.aEURC },
  { symbol: 'aTRYC', name: 'Arc Lira', decimals: 18, addr: CONTRACT_ADDRESSES.aTRYC, logo: TOKEN_ICONS.aTRYC },
  { symbol: 'aGBPC', name: 'Arc Pound', decimals: 18, addr: CONTRACT_ADDRESSES.aGBPC, logo: TOKEN_ICONS.aGBPC },
  { symbol: 'aJPYC', name: 'Arc Yen', decimals: 18, addr: CONTRACT_ADDRESSES.aJPYC, logo: TOKEN_ICONS.aJPYC },
  { symbol: 'astUSDC', name: 'Staked Arc Dollar', decimals: 18, addr: CONTRACT_ADDRESSES.astUSDC, logo: TOKEN_ICONS.astUSDC },
];
