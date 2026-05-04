
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  hexChainId: "0x4CEF72",
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  blockExplorerUrl: "https://testnet.arcscan.app",
};

export const CONTRACT_ADDRESSES = {
  mUSDC: "0x46DEa89357D8C5319e19dE75465aEB08b9825b86",
  mEURC: "0xF8FF716f92e8F129605fB03b64E149b5176ee8e1",
  mTRYC: "0x555D5018b6D85FC6262aBcd453c8F57Ccd2e73A4",
  mGBPC: "0xB1F99B5CE6223dcF24530190Bf1Bb9997e526d19",
  mJPYC: "0x9d437C31AD1f2090d01b7Ad6f5E35d4407A7cCE5",
  AMM: "0x7701BfDcC4240AF8dde934cE4047157f6814bd97", // Default pool
  POOLS: {
    "mEURC": "0x7701BfDcC4240AF8dde934cE4047157f6814bd97",
    "mTRYC": "0x5E09Fca40426EaB4E8074591F212EBe452e37e9e",
    "mGBPC": "0xAAb6b4B8dE17A59C5AD47ec15ce9958EF20a0110",
    "mJPYC": "0xBee492594CF6c2a3f71dA592272D91547dc09b07",
  }
} as const;
