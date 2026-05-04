
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  hexChainId: "0x4CEF72",
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  blockExplorerUrl: "https://testnet.arcscan.app",
};

export const CONTRACT_ADDRESSES = {
  mUSDC: "0x0c938f3E45ab4d2B24887164cf36D9Ef355Aac17",
  mEURC: "0x68c57B355393466bF98721000142E1f071a4F2FF",
  mTRYC: "0x6DC8c90BE39f189b6Ea1C9f5Ec07245653a2acB8",
  mGBPC: "0x8f974cB7b600a7C7f5d8Cd0D3962d212e4074599",
  mJPYC: "0x9be5544f53c7A8031b688E8aC3Ac9a679CA75f02",
  FAUCET: "0x6f037bC668A0D7BbCc6b5f8549dD0340b4FB4D81",
  AMM: "0x89cEf6CB36D0c7BB06D6D859B6371f05E466Bfcb",
  POOLS: {
    "mEURC": "0x89cEf6CB36D0c7BB06D6D859B6371f05E466Bfcb",
    "mTRYC": "0x367f7D5Dc40F80db2Ed95835d79430c8D574B654",
    "mGBPC": "0xac80a476d435E63c5071cE2d2a8707588de7f53a",
    "mJPYC": "0x91614dd9F4be986b1c049027c3D4DD98bC83E56C",
  }
} as const;
