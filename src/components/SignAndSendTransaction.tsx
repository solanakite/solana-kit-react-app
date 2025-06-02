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
import { SuccessDialog } from "./SuccessDialog";

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

export function SignAndSendTransaction({ account }: Props) {
  const { mutate } = useSWRConfig();
  const { current: NO_ERROR } = useRef(Symbol());
  const [error, setError] = useState(NO_ERROR);
  const [isSendingTransaction, setIsSendingTransaction] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | undefined>();
  const [lamportsString, setLamportsString] = useState(String(DEFAULT_LAMPORTS));
  const [recipientAddress, setRecipientAddress] = useState(DEFAULT_RECIPIENT_ADDRESS);
  const { chain: currentChain } = useContext(ChainContext);
  const { connection } = useContext(ConnectionContext);
  const transactionSendingSigner = useWalletAccountTransactionSendingSigner(account, currentChain);
  const lamportsInputId = useId();
  const recipientInputId = useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0 }}>Sign and Send Transaction</h3>
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
            setLamportsString("");
            setRecipientAddress("");
          } catch (error) {
            setLastSignature(undefined);
            setError(error as unknown as symbol);
          } finally {
            setIsSendingTransaction(false);
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            disabled={isSendingTransaction}
            id={lamportsInputId}
            placeholder="Amount in lamports"
            onChange={(event: SyntheticEvent<HTMLInputElement>) => setLamportsString(event.currentTarget.value)}
            type="number"
            value={lamportsString}
          />
          <span>lamports</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor={recipientInputId}>
            To Address
          </label>
          <input
            disabled={isSendingTransaction}
            id={recipientInputId}
            placeholder="Enter recipient's Solana address"
            onChange={(event: SyntheticEvent<HTMLInputElement>) => setRecipientAddress(event.currentTarget.value)}
            value={recipientAddress}
          />
        </div>

        <button
          disabled={lamportsString === "" || !recipientAddress || isSendingTransaction}
          type="submit"
        >
          {isSendingTransaction ? 'Transferring...' : 'Transfer'}
        </button>
      </form>

      {lastSignature ? (
        <SuccessDialog title="You transferred tokens!" onClose={() => setLastSignature(undefined)}>
          <p>Signature:</p>
          <blockquote>{lastSignature}</blockquote>
          <p>
            <a
              href={connection.getExplorerLink('transaction', lastSignature)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View this transaction
            </a>{" "}
            on Explorer
          </p>
        </SuccessDialog>
      ) : null}
      {error !== NO_ERROR ? (
        <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Transfer failed" />
      ) : null}
    </div>
  );
}
