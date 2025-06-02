import { useWalletAccountMessageSigner } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import { useCallback } from "react";
import bs58 from "bs58";

import { BaseSignMessageFeaturePanel } from "./BaseSignMessageFeaturePanel";

type Props = Readonly<{
  account: UiWalletAccount;
}>;

async function signMessage(
  message: string,
  messageSigner: ReturnType<typeof useWalletAccountMessageSigner>,
): Promise<string> {
  const encodedMessage = new TextEncoder().encode(message);
  // Oddly, there's only a modifyAndSignMessages (which accept an array of messages and returns an array of results) 
  // but no singular modifyAndSignMessage. 
  // TODO: should be fixed upstream.
  const results = await messageSigner.modifyAndSignMessages([
    {
      content: encodedMessage as Uint8Array,
      signatures: {},
    },
  ]);
  const result = results[0]

  // Get the first (and should be only) signature from the result
  const signature = Object.values(result?.signatures)[0];
  if (!signature) {
    throw new Error('Could not find signature in the result');
  }
  return bs58.encode(signature as Uint8Array);
}

export function SolanaSignMessageFeaturePanel({ account }: Props) {
  const messageSigner = useWalletAccountMessageSigner(account);
  const signMessageCallback = useCallback(
    (message: string) => signMessage(message, messageSigner),
    [messageSigner],
  );
  return <BaseSignMessageFeaturePanel signMessage={signMessageCallback} />;
}
