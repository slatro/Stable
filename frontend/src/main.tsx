import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ARC_TESTNET_CONFIG } from "./config/contracts";

const config = createConfig({
  chains: [{
    id: ARC_TESTNET_CONFIG.chainId,
    name: ARC_TESTNET_CONFIG.chainName,
    nativeCurrency: ARC_TESTNET_CONFIG.nativeCurrency,
    rpcUrls: { default: { http: [ARC_TESTNET_CONFIG.rpcUrl] }, public: { http: [ARC_TESTNET_CONFIG.rpcUrl] } },
    blockExplorers: { default: { name: "ArcScan", url: ARC_TESTNET_CONFIG.blockExplorerUrl } },
    testnet: true,
  }],
  transports: {
    [ARC_TESTNET_CONFIG.chainId]: http(),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
