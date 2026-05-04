import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ARC_TESTNET_CONFIG } from "./config/contracts";

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

const config = getDefaultConfig({
  appName: "ArcFX Protocol",
  projectId: "YOUR_PROJECT_ID", // For production, use a real ID
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()} modalSize="compact">
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
