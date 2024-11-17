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

import {
  polygon,
  polygonAmoy, // Mumbai Testnet
  mainnet, // Ethereum Mainnet
  arbitrum,
  arbitrumGoerli,
  celo,
  celoAlfajores,
  sepolia, // Sepolia Testnet
  hedera,
  optimism,
  optimismGoerli,
  base,
  baseGoerli,
  mantle,
  mantleTestnet,
} from "viem/chains"; // Import from viem/chains

const config = createConfig({
  chains: [
    polygon, // Polygon Mainnet
    polygonAmoy, // Polygon Mumbai Testnet
    mainnet, // Ethereum Mainnet
    arbitrum, // Arbitrum Mainnet
    arbitrumGoerli, // Arbitrum Testnet
    celo, // Celo Mainnet
    celoAlfajores, // Celo Alfajores Testnet
    sepolia, // Ethereum Sepolia Testnet
    hedera, // Hedera Mainnet
    optimism, // Optimism Mainnet
    optimismGoerli, // Optimism Testnet
    base, // Base Mainnet
    baseGoerli, // Base Testnet
    mantle, // Mantle Mainnet
    mantleTestnet, // Mantle Testnet
  ],
  multiInjectedProviderDiscovery: false,
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumGoerli.id]: http(),
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [sepolia.id]: http(), // Sepolia RPC
    [hedera.id]: http(),
    [optimism.id]: http(),
    [optimismGoerli.id]: http(),
    [base.id]: http(),
    [baseGoerli.id]: http(),
    [mantle.id]: http(),
    [mantleTestnet.id]: http(),
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
