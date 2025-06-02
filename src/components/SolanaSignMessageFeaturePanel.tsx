import { useWalletAccountMessageSigner } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import type { SyntheticEvent } from "react";
import { useCallback, useContext, useRef, useState } from "react";
import { ConnectionContext } from "../context/ConnectionContext";
import { ErrorDialog } from "./ErrorDialog";
import { SuccessDialog } from "./SuccessDialog";

type Props = Readonly<{
  account: UiWalletAccount;
}>;

export function SolanaSignMessageFeaturePanel({ account }: Props) {
  const { current: NO_ERROR } = useRef(Symbol());
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [error, setError] = useState(NO_ERROR);
  const [lastSignature, setLastSignature] = useState<string | undefined>();
  const [text, setText] = useState<string>();
  const messageSigner = useWalletAccountMessageSigner(account);
  const { connection } = useContext(ConnectionContext);

  const handleSignMessage = useCallback(async (message: string) => {
    return connection.signMessageFromWalletApp(message, messageSigner);
  }, [messageSigner]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ margin: 0 }}>Sign Message</h3>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError(NO_ERROR);
          setIsSigningMessage(true);
          try {
            if (!text) {
              throw new Error("Please enter a message to sign");
            }
            const signature = await handleSignMessage(text);
            setLastSignature(signature);
            setText(""); // Clear the input after successful signing
          } catch (error) {
            setLastSignature(undefined);
            setError(error as unknown as symbol);
          } finally {
            setIsSigningMessage(false);
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        <input
          type="text"
          placeholder="Write a message to sign"
          onChange={(event: SyntheticEvent<HTMLInputElement>) => setText(event.currentTarget.value)}
          value={text}
        />
        <button
          disabled={!text || isSigningMessage}
          type="submit"
        >
          {isSigningMessage ? 'Signing...' : 'Sign Message'}
        </button>
      </form>
      {lastSignature && (
        <SuccessDialog title="You Signed a Message!" onClose={() => setLastSignature(undefined)}>
          <p>Message</p>
          <blockquote>{text}</blockquote>
          <p>Signature</p>
          <code>{lastSignature}</code>
        </SuccessDialog>
      )}
      {error !== NO_ERROR ? (
        <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Failed to sign message" />
      ) : null}
    </div>
  );
}
