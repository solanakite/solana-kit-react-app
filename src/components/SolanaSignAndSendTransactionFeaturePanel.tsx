import { Blockquote, Button, Dialog, Link, Select, Text, TextField } from "@radix-ui/themes";
import {
  address,
  getBase58Decoder,
  lamports,
} from "@solana/kit";
import { useWalletAccountTransactionSendingSigner } from "@solana/react";
import { getTransferSolInstruction } from "@solana-program/system";
import { getUiWalletAccountStorageKey, type UiWalletAccount, useWallets } from "@wallet-standard/react";
import type { SyntheticEvent } from "react";
import { useContext, useId, useMemo, useRef, useState } from "react";
import { useSWRConfig } from "swr";

import { ChainContext } from "../context/ChainContext";
import { ConnectionContext } from "../context/ConnectionContext";
import { ErrorDialog } from "./ErrorDialog";
import { WalletMenuItemContent } from "./WalletMenuItemContent";

type Props = Readonly<{
  account: UiWalletAccount;
}>;

function solStringToLamports(solQuantityString: string) {
  if (Number.isNaN(parseFloat(solQuantityString))) {
    throw new Error("Could not parse token quantity: " + String(solQuantityString));
  }
  const numDecimals = BigInt(solQuantityString.split(".")[1]?.length ?? 0);
  const bigIntLamports = BigInt(solQuantityString.replace(".", "")) * 10n ** (9n - numDecimals);
  return lamports(bigIntLamports);
}

export function SolanaSignAndSendTransactionFeaturePanel({ account }: Props) {
  const { mutate } = useSWRConfig();
  const { current: NO_ERROR } = useRef(Symbol());
  const { connection } = useContext(ConnectionContext);
  const wallets = useWallets();
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [error, setError] = useState(NO_ERROR);
  const [lastSignature, setLastSignature] = useState<Uint8Array | undefined>();
  const [solQuantityString, setSolQuantityString] = useState<string>("");
  const [recipientAccountStorageKey, setRecipientAccountStorageKey] = useState<string | undefined>();
  const recipientAccount = useMemo(() => {
    if (recipientAccountStorageKey) {
      for (const wallet of wallets) {
        for (const account of wallet.accounts) {
          if (getUiWalletAccountStorageKey(account) === recipientAccountStorageKey) {
            return account;
          }
        }
      }
    }
  }, [recipientAccountStorageKey, wallets]);
  const { chain: currentChain, solanaExplorerClusterName } = useContext(ChainContext);
  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(account, currentChain);
  const lamportsInputId = useId();
  const recipientSelectId = useId();
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setError(NO_ERROR);
        setIsSendingTransaction(true);
        try {
          const amount = solStringToLamports(solQuantityString);
          if (!recipientAccount) {
            throw new Error("The address of the recipient could not be found");
          }

          const sendSolInstruction = getTransferSolInstruction({
            amount,
            destination: address(recipientAccount.address),
            source: transactionSendingSigner,
          });

          const signatureBase58 = await connection.sendTransactionFromInstructionsWithWalletApp({
            instructions: [sendSolInstruction],
            feePayer: transactionSendingSigner,
          });

          // TODO: Normally we would consider 'signature' to be base58, this existing app uses 
          // bytes, we should probably just fix this app.
          const signature = connection.signatureBase58StringToBytes(signatureBase58);

          void mutate({ address: transactionSendingSigner.address, chain: currentChain });
          void mutate({ address: recipientAccount.address, chain: currentChain });
          setLastSignature(signature);
          setSolQuantityString("");
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
        placeholder="Amount"
        onChange={(event: SyntheticEvent<HTMLInputElement>) => setSolQuantityString(event.currentTarget.value)}
        style={{ width: "auto" }}
        type="number"
        value={solQuantityString}
      >
        <TextField.Slot side="right">{"\u25ce"}</TextField.Slot>
      </TextField.Root>

      <Text as="label" color="gray" htmlFor={recipientSelectId} weight="medium">
        To Account
      </Text>

      <Select.Root
        disabled={isSendingTransaction}
        onValueChange={setRecipientAccountStorageKey}
        value={recipientAccount ? getUiWalletAccountStorageKey(recipientAccount) : undefined}
      >
        <Select.Trigger
          style={{ flexGrow: 1, flexShrink: 1, overflow: "hidden" }}
          placeholder="Select a Connected Account"
        />
        <Select.Content>
          {wallets.flatMap((wallet) =>
            wallet.accounts
              .filter(({ chains }) => chains.includes(currentChain))
              .map((account) => {
                const key = getUiWalletAccountStorageKey(account);
                return (
                  <Select.Item key={key} value={key}>
                    <WalletMenuItemContent wallet={wallet}>{account.address}</WalletMenuItemContent>
                  </Select.Item>
                );
              }),
          )}
        </Select.Content>
      </Select.Root>

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
            disabled={solQuantityString === "" || !recipientAccount}
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
            <Blockquote>{getBase58Decoder().decode(lastSignature)}</Blockquote>
            <Text>
              <Link
                href={`https://explorer.solana.com/tx/${getBase58Decoder().decode(
                  lastSignature,
                )}?cluster=${solanaExplorerClusterName}`}
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
