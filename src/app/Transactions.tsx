"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Network {
  id: number;
  name: string;
  chainId: number | null;
  icon: string;
  nativeToken: string;
  blockscoutDomain: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  gasUsed: string;
  txreceipt_status: string;
}

const initialNetworks: Network[] = [
  {
    id: 1,
    name: "Polygon",
    chainId: 137,
    icon: "/images/polygon_e.png",
    nativeToken: "MATIC",
    blockscoutDomain: "polygon.blockscout.com",
  },
  {
    id: 2,
    name: "Sepolia",
    chainId: 11155111,
    icon: "/images/sepolia.svg",
    nativeToken: "ETH",
    blockscoutDomain: "eth-sepolia.blockscout.com",
  },
  {
    id: 3,
    name: "Ethereum",
    chainId: 1,
    icon: "/images/ETH2.png",
    nativeToken: "ETH",
    blockscoutDomain: "eth.blockscout.com",
  },
];

export default function Transactions({ address = "" }: { address?: string }) {
  const [networks] = useState<Network[]>(initialNetworks);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!selectedNetwork || !selectedNetwork.chainId || !address) {
      setError("Please select a valid network.");
      return;
    }

    setLoading(true);
    setError(null);

    const apiUrl = `https://${selectedNetwork.blockscoutDomain}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === "1") {
        setTransactions(data.result);
      } else {
        setError(data.message || "No transactions found.");
        setTransactions([]);
      }
    } catch (err) {
      setError("Failed to fetch transaction history. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkChange = (value: string) => {
    const networkId = parseInt(value);
    const network = networks.find((n) => n.id === networkId) || null;
    setSelectedNetwork(network);
    setTransactions([]); // Clear transactions when network changes
  };

  const formatValue = (value: string, decimals: number = 18): string => {
    const formatted = parseFloat(value) / Math.pow(10, decimals);
    return formatted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Network Transaction Viewer</CardTitle>
          <CardDescription>
            View transaction history across multiple networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Select onValueChange={handleNetworkChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id.toString()}>
                    <div className="flex items-center gap-2">
                      <img
                        src={network.icon}
                        alt={network.name}
                        className="w-4 h-4"
                      />
                      {network.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchTransactions}
              disabled={loading || !selectedNetwork}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Fetch Transactions"
              )}
            </Button>
          </div>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-4 rounded-md mb-4">
              {error}
            </div>
          )}
          {transactions.length > 0 && (
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hash</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.hash}>
                      <TableCell className="font-medium">
                        {tx.hash.slice(0, 6)}...{tx.hash.slice(-6)}
                      </TableCell>
                      <TableCell>
                        {tx.from.slice(0, 6)}...{tx.from.slice(-6)}
                      </TableCell>
                      <TableCell>
                        {tx.to
                          ? `${tx.to.slice(0, 6)}...${tx.to.slice(-6)}`
                          : "Contract Creation"}
                      </TableCell>
                      <TableCell>
                        {formatValue(tx.value)} {selectedNetwork?.nativeToken}
                      </TableCell>
                      <TableCell>
                        {new Date(
                          parseInt(tx.timeStamp) * 1000
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            tx.txreceipt_status === "1"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {tx.txreceipt_status === "1" ? "Success" : "Failed"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a
                            href={`https://${selectedNetwork?.blockscoutDomain}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
