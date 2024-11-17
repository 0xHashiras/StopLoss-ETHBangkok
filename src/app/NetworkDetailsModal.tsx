"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useChains,
  useSwitchChain,
  useReadContract,
} from "wagmi";
import { parseEther, formatUnits, isAddress, getAddress } from "viem";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Token {
  chain_id: number;
  contract_address: string;
  amount: number;
  price_to_usd: number;
  value_usd: number;
  abs_profit_usd: number;
  roi: number;
  status: number;
}

interface Network {
  id: number;
  name: string;
  icon: string;
  chainId: number | null;
  nativeToken: string;
  tokens: Token[];
  chartData: { timestamp: number; value_usd: number }[];
  totalValue?: string;
}

interface NetworkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  network: Network;
}

const NETWORKS = [
  {
    id: 1,
    chainId: 9,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 2,
    chainId: 8453,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 3,
    chainId: 1,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 4,
    chainId: 42220,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 5,
    chainId: 2442,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 6,
    chainId: 137,
    contractAddress: "0xe74991308cb61c5e72d9be8ed4a9233f98eb7f4a",
    usdtAddress: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    roundId: "18446744073709569269",
  },
  {
    id: 15,
    chainId: 11155111,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 7,
    chainId: 12,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 8,
    chainId: 101,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 9,
    chainId: 42161,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 10,
    chainId: 9999,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 11,
    chainId: 534352,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 12,
    chainId: 23448,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 13,
    chainId: 5000,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
  {
    id: 14,
    chainId: 88888,
    contractAddress: "0x...",
    usdtAddress: "0x...",
    roundId: "...",
  },
];

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address[]", name: "tokenAddresses", type: "address[]" },
      { internalType: "uint256[]", name: "thresholds", type: "uint256[]" },
    ],
    name: "configureUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      {
        internalType: "uint256",
        name: "chroniclePairIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "chainlink_compare_roundid",
        type: "uint256",
      },
    ],
    name: "executeStopLoss",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getTokenAndThresholdByIndex",
    outputs: [
      { internalType: "address[]", name: "tokens", type: "address[]" },
      { internalType: "uint256[]", name: "thresholds", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function EnhancedNetworkDetailsModal({
  isOpen,
  onClose,
  network,
}: NetworkDetailsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState("select");
  const [profitLossData, setProfitLossData] = useState<(number | "N/A")[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds, setThresholds] = useState<{ [key: string]: string }>({});
  const [contractThresholds, setContractThresholds] = useState<{
    [key: string]: string;
  }>({});

  const { address } = useAccount();
  const chainId = useChainId();
  const chains = useChains();
  const { switchChain } = useSwitchChain();

  const { writeContract, data: hash } = useWriteContract();
  const { data: tokenAndThresholdData, isLoading: isLoadingTokenAndThreshold } =
    useReadContract({
      address: NETWORKS.find((n) => n.chainId === chainId)
        ?.contractAddress as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "getTokenAndThresholdByIndex",
      args: [address as `0x${string}`],
    });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const resetModalState = () => {
    setSearchTerm("");
    setSelectedTokens([]);
    setCurrentStep("select");
    setThresholds({});
  };

  useEffect(() => {
    if (
      tokenAndThresholdData &&
      Array.isArray(tokenAndThresholdData) &&
      tokenAndThresholdData.length === 2
    ) {
      const [tokens, thresholds] = tokenAndThresholdData;
      const newThresholds: { [key: string]: string } = {};

      tokens.forEach((token, index) => {
        newThresholds[token] = formatUnits(thresholds[index], 18);
      });

      setContractThresholds(newThresholds);
    }
  }, [tokenAndThresholdData]);

  const filteredTokens = network?.tokens?.filter((token) =>
    token.contract_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalValue = () =>
    network?.tokens.reduce((total, token) => total + token.value_usd, 0);

  const handleTokenSelection = (
    tokenName: string,
    profitLoss: number | "N/A"
  ) => {
    if (typeof profitLoss === "number") {
      if (profitLoss <= -5) {
        setSelectedTokens([tokenName]);
        setCurrentStep("confirm");
      } else {
        setSelectedTokens((prev) =>
          prev.includes(tokenName)
            ? prev.filter((name) => name !== tokenName)
            : [...prev, tokenName]
        );
      }
    }
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  const handleNextStep = () => {
    if (currentStep === "select") setCurrentStep("type");
    else if (currentStep === "type") setCurrentStep("confirm");
  };

  const handleThresholdChange = (token: string, value: string) => {
    setThresholds((prev) => ({ ...prev, [token]: value }));
  };

  function truncateAddress(
    address: string,
    start: number = 6,
    end: number = 4
  ): string {
    if (!address) return "";
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  }

  const handleExecute = async () => {
    try {
      if (!address) {
        throw new Error("Please connect your wallet");
      }

      if (chainId !== network.chainId) {
        switchChain({ chainId: network.chainId as number });
      }

      const tokenAddresses = selectedTokens
        .filter((addr) => isAddress(addr))
        .map((addr) => getAddress(addr)) as `0x${string}`[];

      if (tokenAddresses.length !== selectedTokens.length) {
        throw new Error("Some selected addresses are invalid");
      }

      const thresholdValues = tokenAddresses.map((token) =>
        parseEther(thresholds[token] || "0")
      );

      const currentNetwork = NETWORKS.find((n) => n.chainId === chainId);
      if (!currentNetwork) {
        throw new Error("Current network configuration not found");
      }

      writeContract({
        address: currentNetwork.contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "configureUser",
        args: [tokenAddresses, thresholdValues],
      });
      setCurrentStep("explorer");
    } catch (error) {
      console.log("Error executing transaction:", error);
      // Handle error appropriately in your UI
    }
  };

  const handleExecuteStopLoss = async (token: Token) => {
    try {
      if (!address) {
        throw new Error("Please connect your wallet");
      }

      if (chainId !== network.chainId) {
        switchChain({ chainId: network.chainId as number });
      }

      const currentNetwork = NETWORKS.find((n) => n.chainId === chainId);
      if (!currentNetwork) {
        throw new Error("Current network configuration not found");
      }

      const tokenIn = getAddress(token.contract_address);
      const tokenOut = getAddress(currentNetwork.usdtAddress);
      const fee = 3000;
      const recipient = address;
      const amountIn = parseEther(token.amount.toString());
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 minutes from now
      const chainlink_compare_roundid = BigInt(currentNetwork.roundId);

      // // Fetch amountOutMinimum from 1inch API
      // const response = await axios.get(
      //   `http://localhost:3004/api/current_value?address=${tokenOut}&chainId=${token.chain_id}`
      // );
      // const amountOutMinimum = parseEther(
      //   response.data.result[2].result[1].value_usd.toString()
      // );

      writeContract({
        address: currentNetwork.contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: "executeStopLoss",
        args: [
          tokenIn,
          tokenOut,
          fee,
          recipient,
          amountIn,
          // amountOutMinimum,
          deadline,
          BigInt("0"),
          chainlink_compare_roundid,
        ],
      });
      setCurrentStep("explorer");
    } catch (error) {
      console.log("Error executing stop loss:", error);
      // Handle error appropriately in your UI
    }
  };

  useEffect(() => {
    const fetchProfitLossData = async () => {
      setIsLoading(true);
      try {
        const promises = network.tokens.map(async (token) => {
          try {
            const res = await axios.get(
              `http://localhost:3004/api/profit_loss?address=${token.contract_address}&chainId=${token.chain_id}`
            );
            return parseFloat(
              (res.data.result[1].abs_profit_usd / 100).toFixed(2)
            );
          } catch (error) {
            console.log("Error fetching profit loss:", error);
            return "N/A";
          }
        });
        const results = await Promise.all(promises);
        setProfitLossData(results);
      } catch (error) {
        console.log("Error fetching profit loss data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfitLossData();
  }, [network.tokens]);

  console.log("chainId", chainId, network.chainId);
  const isCorrectNetwork = chainId === network.chainId;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-400 flex items-center">
            <img
              src={network.icon}
              alt={`${network.name} logo`}
              className="w-6 h-6 mr-2"
            />{" "}
            {network?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Transfer tokens from this network
          </DialogDescription>
        </DialogHeader>
        {!isCorrectNetwork && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Wrong Network</AlertTitle>
            <AlertDescription>
              Please switch to the {network.name} network to interact with this
              contract.
            </AlertDescription>
          </Alert>
        )}
        <Tabs value={currentStep} className="mt-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="select" disabled={currentStep !== "select"}>
              Select Tokens
            </TabsTrigger>
            <TabsTrigger
              value="type"
              disabled={currentStep === "select" || currentStep === "process"}
            >
              Set Thresholds
            </TabsTrigger>
            <TabsTrigger
              value="confirm"
              disabled={currentStep === "select" || currentStep === "process"}
            >
              Confirm Details
            </TabsTrigger>
            <TabsTrigger
              value="explorer"
              disabled={currentStep === "select" || currentStep === "type"}
            >
              Explorer
            </TabsTrigger>
          </TabsList>
          <TabsContent value="select">
            <Alert
              variant="default"
              className="mb-4"
              style={{ color: "#856404" }}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                You can only select multiple tokens with more than -5%
                profit/loss. If the token has less than -5% profit/loss, you can
                transfer directly that particular token separately.
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="text-gray-400" />
              <Input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow bg-gray-800 text-white border-gray-700"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-blue-400 w-12">Action</TableHead>
                    <TableHead className="text-blue-400">Contract</TableHead>
                    <TableHead className="text-blue-400">Profit/Loss</TableHead>
                    <TableHead className="text-blue-400">Threshold</TableHead>
                    <TableHead className="text-blue-400">Balance</TableHead>
                    <TableHead className="text-blue-400">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Loading profit/loss data...
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTokens?.map((token, index) => (
                      <TableRow
                        key={index}
                        className="border-gray-700 hover:bg-gray-800 transition-colors"
                      >
                        <TableCell>
                          {typeof profitLossData[index] === "number" &&
                          profitLossData[index] <= -5 ? (
                            <Button
                              onClick={() => handleExecuteStopLoss(token)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                              disabled={!isCorrectNetwork}
                            >
                              Send
                            </Button>
                          ) : (
                            <Checkbox
                              checked={selectedTokens.includes(
                                token.contract_address
                              )}
                              onCheckedChange={() =>
                                handleTokenSelection(
                                  token.contract_address,
                                  profitLossData[index]
                                )
                              }
                              className="border-gray-500"
                              disabled={!isCorrectNetwork}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-gray-300">
                          {truncateAddress(token.contract_address)}
                        </TableCell>
                        <TableCell
                          className={`text-gray-300 ${
                            typeof profitLossData[index] === "number"
                              ? profitLossData[index] > 0
                                ? "text-green-500"
                                : "text-red-500"
                              : ""
                          }`}
                        >
                          {typeof profitLossData[index] === "number"
                            ? `${
                                profitLossData[index] > 0 ? "+" : ""
                              }${profitLossData[index].toFixed(2)}%`
                            : profitLossData[index]}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {contractThresholds[token.contract_address]
                            ? `${(
                                Number(
                                  contractThresholds[token.contract_address]
                                ) * 100
                              ).toFixed(2)}%`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {token.amount}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          ${token.value_usd.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-right">
              <p className="text-lg font-semibold text-blue-400">
                Total Value: ${calculateTotalValue()?.toLocaleString()}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={selectedTokens.length === 0 || !isCorrectNetwork}
              >
                Next
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="type">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Set Thresholds for Selected Tokens
                </label>
                {selectedTokens.map((token) => (
                  <div key={token} className="flex items-center space-x-2 mb-2">
                    <span className="text-gray-300">
                      {truncateAddress(token)}
                    </span>
                    <Input
                      type="number"
                      placeholder="Threshold %"
                      value={thresholds[token] || ""}
                      onChange={(e) =>
                        handleThresholdChange(token, e.target.value)
                      }
                      className="w-32 bg-gray-800 border-gray-700 text-white"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                onClick={() => setCurrentStep("select")}
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  Object.keys(thresholds).length !== selectedTokens.length
                }
              >
                Next
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="confirm">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-400">
                Confirm Transfer Details
              </h3>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300">
                  <span className="font-medium">
                    Selected Tokens, Thresholds, and Values:
                  </span>
                  {selectedTokens.map((token) => {
                    const tokenData = network.tokens.find(
                      (t) => t.contract_address === token
                    );
                    return (
                      <div
                        key={token}
                        className="flex justify-between items-center"
                      >
                        <span>
                          {truncateAddress(token)}: {thresholds[token]}%
                        </span>
                        <span>${tokenData?.value_usd.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </p>
                <div className="mt-4 text-right">
                  <p className="text-lg font-semibold text-blue-400">
                    Total Value: $
                    {selectedTokens
                      .reduce((total, token) => {
                        const tokenData = network.tokens.find(
                          (t) => t.contract_address === token
                        );
                        return total + (tokenData?.value_usd || 0);
                      }, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
              {isSuccess && (
                <Alert className="bg-green-500/20 text-green-500">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    Transaction confirmed. Your tokens have been configured.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                onClick={() => setCurrentStep("type")}
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white"
                disabled={isConfirming}
              >
                Back
              </Button>
              <Button
                onClick={handleExecute}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isConfirming || !isCorrectNetwork}
              >
                {isConfirming ? "Confirming..." : "Confirm and Process"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="explorer">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-blue-400">
                Transaction Explorer
              </h3>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300">
                  {hash ? (
                    <>
                      <span className="font-medium">Transaction Hash: </span>
                      <a
                        href={`https://${network.name.toLowerCase()}scan.com/tx/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {truncateAddress(hash)}
                      </a>
                    </>
                  ) : (
                    "No transaction has been submitted yet."
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                onClick={() => setCurrentStep("confirm")}
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                Back
              </Button>
              {hash && (
                <Button
                  onClick={() =>
                    window.open(
                      `https://${network.name.toLowerCase()}scan.com/tx/${hash}`,
                      "_blank"
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View on Explorer
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
