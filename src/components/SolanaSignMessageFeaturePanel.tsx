import type { Address } from "@solana/kit";
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
  accountAddress: string
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

  const signature = result?.signatures[accountAddress as Address];
  if (!signature) {
    throw new Error(`Could not find signature for ${accountAddress}`);
  }
  return bs58.encode(signature as Uint8Array);
}

export function SolanaSignMessageFeaturePanel({ account }: Props) {
  const messageSigner = useWalletAccountMessageSigner(account);
  const signMessageCallback = useCallback(
    (message: string) => signMessage(message, messageSigner, account.address),
    [account.address, messageSigner],
  );
  return <BaseSignMessageFeaturePanel signMessage={signMessageCallback} />;
}
