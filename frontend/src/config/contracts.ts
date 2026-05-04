
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  hexChainId: "0x4CEF72",
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  blockExplorerUrl: "https://testnet.arcscan.app",
};

export const CONTRACT_ADDRESSES = {
  mUSDC: "0xF75e64c314260A96707DD7Bb68aF7141a36cd4fD",
  mEURC: "0x330C07087a018055b4593C10437fa1745df027B2",
  mTRY: "0xDE5db842c4774C35610337c1f5F81BF4439DAb34",
  mGBP: "0x545fc96961aF0809E75b6b6D19e132bA842B8187",
  AMM: "0x7D265a54D57aDA651A3f6C7d669A5429BA6d0773", // Default pool
  POOLS: {
    "mEURC": "0x7D265a54D57aDA651A3f6C7d669A5429BA6d0773",
    "mTRY": "0x1FCe8fd5a2c8Af5BB6a90b75c15F5d293916aF80",
    "mGBP": "0x40f44E3fB9e9114081C0B8C74F5412377801c8d8",
  }
} as const;
