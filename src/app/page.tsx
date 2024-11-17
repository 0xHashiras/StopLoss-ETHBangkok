"use client";

import { useState, useEffect } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import Header from "./Header";
import AnimatedLoader from "./AnimatedLoader"; // Import your loader
import animatedData from "../../public/animated.json";

import { polygon, polygonAmoy, mainnet } from "viem/chains"; // Include Ethereum mainnet here

const config = createConfig({
  chains: [polygon, polygonAmoy, mainnet], // Added Ethereum mainnet and Polygon networks
  multiInjectedProviderDiscovery: false,
  transports: {
    [polygon.id]: http("https://polygon.llamarpc.com"), // Polygon RPC URL
    [polygonAmoy.id]: http("https://rpc-mumbai.matic.today"), // Mumbai Testnet RPC
    [mainnet.id]: http("https://ethereum-rpc.publicnode.com"), // Ethereum RPC URL
  },
});

import "./globals.css";
import { url } from "inspector";

const queryClient = new QueryClient();

export default function BlockchainApp() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 6000); // Simulate a 6-second loading
  }, []);

  return (
    <DynamicContextProvider
      settings={{
        environmentId: "09dabf9d-8626-4257-b8b5-9bea0631c3ff",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <div className="min-h-screen bg-gray-900">
              {isLoading && <AnimatedLoader animatedData={animatedData} />}
              <Header />
            </div>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
