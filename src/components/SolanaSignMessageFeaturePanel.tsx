import type { Address } from "@solana/kit";
import { useWalletAccountMessageSigner } from "@solana/react";
import type { ReadonlyUint8Array } from "@wallet-standard/core";
import type { UiWalletAccount } from "@wallet-standard/react";
import { useCallback } from "react";

import { BaseSignMessageFeaturePanel } from "./BaseSignMessageFeaturePanel";

type Props = Readonly<{
  account: UiWalletAccount;
}>;

async function signMessage(
  message: string,
  messageSigner: ReturnType<typeof useWalletAccountMessageSigner>,
  accountAddress: string
): Promise<ReadonlyUint8Array> {
  const encodedMessage = new TextEncoder().encode(message);
  const [result] = await messageSigner.modifyAndSignMessages([
    {
      content: encodedMessage as Uint8Array,
      signatures: {},
    },
  ]);
  const signature = result?.signatures[accountAddress as Address];
  if (!signature) {
    throw new Error();
  }
  return signature as ReadonlyUint8Array;
}

export function SolanaSignMessageFeaturePanel({ account }: Props) {
  const messageSigner = useWalletAccountMessageSigner(account);
  const signMessageCallback = useCallback(
    (message: string) => signMessage(message, messageSigner, account.address),
    [account.address, messageSigner],
  );
  return <BaseSignMessageFeaturePanel signMessage={signMessageCallback} />;
}
