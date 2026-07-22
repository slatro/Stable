import { http, createConfig } from 'wagmi';
import { mainnet, localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { ARC_TESTNET_CONFIG } from './contracts';

// Define Arc Testnet as a custom chain
const arcTestnet = {
  id: ARC_TESTNET_CONFIG.chainId,
  name: ARC_TESTNET_CONFIG.chainName,
  nativeCurrency: ARC_TESTNET_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: [ARC_TESTNET_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: ARC_TESTNET_CONFIG.blockExplorerUrl },
  },
} as const;

export const config = createConfig({
  chains: [localhost, arcTestnet, mainnet],
  connectors: [
    injected(),
  ],
  transports: {
    [localhost.id]: http(),
    [arcTestnet.id]: http(),
    [mainnet.id]: http(),
  },
});
