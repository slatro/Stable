import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// Web3 Imports
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ARC_TESTNET_CONFIG } from "./config/contracts";
import { PriceProvider } from "./context/PriceContext";

const arcTestnet = {
  id: ARC_TESTNET_CONFIG.chainId,
  name: ARC_TESTNET_CONFIG.chainName,
  nativeCurrency: ARC_TESTNET_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: [ARC_TESTNET_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_TESTNET_CONFIG.blockExplorerUrl },
  },
  testnet: true,
} as const;

import { socialWalletConnector } from "./config/socialWalletConnector";

const config = getDefaultConfig({
  appName: "Stablr Protocol",
  projectId: "89a92bcf5ff047a59a84b2335a2932ee",
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(ARC_TESTNET_CONFIG.rpcUrl),
  },
});

config.connectors.push(socialWalletConnector());

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          <PriceProvider>
            <App />
          </PriceProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
