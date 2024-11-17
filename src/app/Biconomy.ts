import { Bundler } from "@biconomy/bundler";
import {
  Paymaster,
  createSmartAccountClient,
  DEFAULT_ENTRYPOINT_ADDRESS,
  ECDSAOwnershipValidationModule,
  DEFAULT_ECDSA_OWNERSHIP_MODULE,
} from "@biconomy/account";
import { WalletClient } from "viem";
import { sepolia } from "viem/chains";

const bundler = new Bundler({
  bundlerUrl: process.env.REACT_APP_BICONOMY_BUNDLER_URL as string, // Ensure the environment variable is a string
  chainId: sepolia.id, // Replace this with your desired network
  entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS, // This is a Biconomy constant
});

const paymaster = new Paymaster({
  paymasterUrl: process.env.REACT_APP_BICONOMY_PAYMASTER_URL as string, // Ensure the environment variable is a string
});

const createValidationModule = async (signer: WalletClient) => {
  return await ECDSAOwnershipValidationModule.create({
    signer: signer,
    moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE, // This is a Biconomy constant
  });
};

export const createSmartAccount = async (walletClient: WalletClient) => {
  const validationModule = await createValidationModule(walletClient);

  return await createSmartAccountClient({
    signer: walletClient,
    chainId: sepolia.id, // Replace this with your target network
    bundler: bundler as any, // Use the `bundler` we initialized above
    paymaster: paymaster, // Use the `paymaster` we initialized above
    entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS, // This is a Biconomy constant
    defaultValidationModule: validationModule, // Use the `validationModule` we initialized above
    activeValidationModule: validationModule, // Use the `validationModule` we initialized above
  });
};
