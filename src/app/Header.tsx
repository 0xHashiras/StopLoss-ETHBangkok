"use client";

import { useCallback, useEffect, useState } from "react";
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import BlockchainDashboard from "./Dashboard";
import Transactions from "./Transactions";
import { WalletClient } from "viem";
import { createSmartAccount } from "./Biconomy";

type PrimaryWallet = {
  getWalletClient: () => Promise<WalletClient | null>;
} | null;

export default function Header() {
  const { address } = useAccount();
  const [showTransactions, setShowTransactions] = useState(false);

  const { primaryWallet } = useDynamicContext() as {
    primaryWallet: PrimaryWallet;
  };
  const [smartAccount, setSmartAccount] = useState<any | null>(null);

  const createAndSetSmartAccount = useCallback(async () => {
    if (!primaryWallet) {
      setSmartAccount(null);
      return;
    }

    try {
      const walletClient =
        (await primaryWallet.getWalletClient()) as WalletClient;
      if (walletClient && !smartAccount) {
        const newSmartAccount = await createSmartAccount(walletClient);
        console.log(newSmartAccount, "new smart account");
        setSmartAccount(newSmartAccount);
      }
    } catch (error) {
      console.log(
        "Error fetching wallet clients or creating smart account:",
        error
      );
    }
  }, [primaryWallet, smartAccount]);

  useEffect(() => {
    createAndSetSmartAccount();
  }, [address]);

  console.log("my Biconomy smart account", smartAccount);

  const handleViewTransactions = () => {
    setShowTransactions(true); // Show transactions view when clicked
  };

  const handleViewDashboard = () => {
    setShowTransactions(false); // Show dashboard view when clicked
  };

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
        <h1 className="text-[#5DA1F3] text-2xl font-bold">TokenWave</h1>
        <div className="flex items-center space-x-4">
          {/* Container to hold buttons and DynamicWidget */}
          {address && (
            <Button
              variant="ghost"
              className={`${
                showTransactions ? "text-[#5DA1F3] font-bold" : "text-white"
              } hover:text-[#5DA1F3] transition-colors`}
              onClick={handleViewTransactions}
            >
              View Transactions
            </Button>
          )}
          <Button
            variant="ghost"
            className={`${
              !showTransactions ? "text-[#5DA1F3] font-bold" : "text-white"
            } hover:text-[#5DA1F3] transition-colors`}
            onClick={handleViewDashboard}
          >
            Dashboard
          </Button>
          <div>
            <DynamicWidget />
          </div>
        </div>
      </header>

      {showTransactions ? (
        <Transactions address={address} /> // Show transactions view
      ) : (
        <BlockchainDashboard address={address} /> // Show dashboard view
      )}
    </>
  );
}
