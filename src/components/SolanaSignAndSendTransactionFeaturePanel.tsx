import { Blockquote, Button, Dialog, Link, Text, TextField } from "@radix-ui/themes";
import {
  address,
  lamports,
} from "@solana/kit";
import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import { getTransferSolInstruction } from "@solana-program/system";
import { type UiWalletAccount, useWallets } from "@wallet-standard/react";
import type { SyntheticEvent } from "react";
import { useContext, useId, useRef, useState } from "react";
import { useSWRConfig } from "swr";

import { ChainContext } from "../context/ChainContext";
import { ConnectionContext } from "../context/ConnectionContext";
import { ErrorDialog } from "./ErrorDialog";

// mikemaccana.sol (reminder this is devnet)
const DEFAULT_RECIPIENT_ADDRESS = "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8";
const DEFAULT_LAMPORTS = 7;

type Props = Readonly<{
  account: UiWalletAccount;
}>;

function parseLamports(lamportsString: string) {
  if (Number.isNaN(Number(lamportsString))) {
    throw new Error("Could not parse lamports quantity: " + String(lamportsString));
  }
  return lamports(BigInt(lamportsString));
}

export function SolanaSignAndSendTransactionFeaturePanel({ account }: Props) {
  const { mutate } = useSWRConfig();
  const { current: NO_ERROR } = useRef(Symbol());
  const { connection } = useContext(ConnectionContext);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [error, setError] = useState(NO_ERROR);
  const [lastSignature, setLastSignature] = useState<string | undefined>();
  const [lamportsString, setLamportsString] = useState<string>(String(DEFAULT_LAMPORTS));
  const [recipientAddress, setRecipientAddress] = useState<string>(DEFAULT_RECIPIENT_ADDRESS);
  const { chain: currentChain, solanaExplorerClusterName } = useContext(ChainContext);
  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(account, currentChain);
  const lamportsInputId = useId();
  const recipientInputId = useId();
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setError(NO_ERROR);
        setIsSendingTransaction(true);
        try {
          const amount = parseLamports(lamportsString);
          if (!recipientAddress) {
            throw new Error("Please enter a recipient address");
          }

          const sendSolInstruction = getTransferSolInstruction({
            amount,
            destination: address(recipientAddress),
            source: transactionSendingSigner,
          });

          const signature = await connection.sendTransactionFromInstructionsWithWalletApp({
            instructions: [sendSolInstruction],
            feePayer: transactionSendingSigner,
          });

          void mutate({ address: transactionSendingSigner.address, chain: currentChain });
          void mutate({ address: recipientAddress, chain: currentChain });
          setLastSignature(signature);
          setLamportsString(String(DEFAULT_LAMPORTS));
          setRecipientAddress(DEFAULT_RECIPIENT_ADDRESS);
        } catch (error) {
          setLastSignature(undefined);
          setError(error as unknown as symbol);
        } finally {
          setIsSendingTransaction(false);
        }
      }}
    >
      <TextField.Root
        disabled={isSendingTransaction}
        id={lamportsInputId}
        placeholder="Amount in lamports"
        onChange={(event: SyntheticEvent<HTMLInputElement>) => setLamportsString(event.currentTarget.value)}
        style={{ width: "auto" }}
        type="number"
        value={lamportsString}
      >
        <TextField.Slot side="right">lamports</TextField.Slot>
      </TextField.Root>

      <Text as="label" color="gray" htmlFor={recipientInputId} weight="medium">
        To Address
      </Text>

      <TextField.Root
        disabled={isSendingTransaction}
        id={recipientInputId}
        placeholder="Enter recipient's Solana address"
        onChange={(event: SyntheticEvent<HTMLInputElement>) => setRecipientAddress(event.currentTarget.value)}
        value={recipientAddress}
      />

      <Dialog.Root
        open={Boolean(lastSignature)}
        onOpenChange={(open) => {
          if (!open) {
            setLastSignature(undefined);
          }
        }}
      >
        <Dialog.Trigger>
          <Button
            color={error ? undefined : "red"}
            disabled={lamportsString === "" || !recipientAddress}
            loading={isSendingTransaction}
            type="submit"
          >
            Transfer
          </Button>
        </Dialog.Trigger>
        {lastSignature ? (
          <Dialog.Content
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Dialog.Title>You transferred tokens!</Dialog.Title>
            <Text>Signature:</Text>
            <Blockquote>{lastSignature}</Blockquote>
            <Text>
              <Link
                href={connection.getExplorerLink('transaction', lastSignature)}
                target="_blank"
              >
                View this transaction
              </Link>{" "}
              on Explorer
            </Text>
            <Dialog.Close>
              <Button>Cool!</Button>
            </Dialog.Close>
          </Dialog.Content>
        ) : null}
      </Dialog.Root>
      {error !== NO_ERROR ? (
        <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Transfer failed" />
      ) : null}
    </form>
  );
}
