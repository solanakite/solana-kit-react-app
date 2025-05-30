import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { ReactNode, useContext, useMemo } from "react";

import { ChainContext } from "./ChainContext";
import { RpcContext } from "./RpcContext";

// Define the props type
type RpcContextProviderProps = {
  children: ReactNode;
};

// Define the context value type
type RpcContextValue = {
  rpc: ReturnType<typeof createSolanaRpc>;
  rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
};

// Create the provider component
export function RpcContextProvider({ children }: RpcContextProviderProps) {
  const { solanaRpcSubscriptionsUrl, solanaRpcUrl } = useContext(ChainContext);

  // Create the context value
  const contextValue: RpcContextValue = useMemo(() => {
    return {
      rpc: createSolanaRpc(solanaRpcUrl),
      rpcSubscriptions: createSolanaRpcSubscriptions(solanaRpcSubscriptionsUrl),
    };
  }, [solanaRpcSubscriptionsUrl, solanaRpcUrl]);

  return (
    <RpcContext.Provider value={contextValue}>
      {children}
    </RpcContext.Provider>
  );
}
