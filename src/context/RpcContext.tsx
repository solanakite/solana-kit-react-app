import type { Rpc, RpcSubscriptions, SolanaRpcApiMainnet, SolanaRpcSubscriptionsApi } from "@solana/kit";
import { createSolanaRpc, createSolanaRpcSubscriptions, devnet } from "@solana/kit";
import { createContext } from "react";

// Define the type for our context
type RpcContextType = {
  rpc: Rpc<SolanaRpcApiMainnet>; // Limit the API to only those methods found on Mainnet (ie. not `requestAirdrop`)
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

// Create default values
const defaultRpcContext: RpcContextType = {
  rpc: createSolanaRpc(devnet("https://api.devnet.solana.com")),
  rpcSubscriptions: createSolanaRpcSubscriptions(devnet("wss://api.devnet.solana.com")),
};

// Create the context
export const RpcContext = createContext<RpcContextType>(defaultRpcContext);
