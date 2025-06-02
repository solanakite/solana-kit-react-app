import { Pencil1Icon } from "@radix-ui/react-icons";
import { Blockquote, Button, Code, DataList, Dialog, TextField } from "@radix-ui/themes";
import { useWalletAccountMessageSigner } from "@solana/react";
import type { UiWalletAccount } from "@wallet-standard/react";
import type { SyntheticEvent } from "react";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";

import { ErrorDialog } from "./ErrorDialog";

type Props = Readonly<{
  account: UiWalletAccount;
}>;

async function signMessage(
  message: string,
  messageSigner: ReturnType<typeof useWalletAccountMessageSigner>,
): Promise<string> {
  const encodedMessage = new TextEncoder().encode(message);
  const results = await messageSigner.modifyAndSignMessages([
    {
      content: encodedMessage as Uint8Array,
      signatures: {},
    },
  ]);
  const result = results[0];

  const signature = Object.values(result?.signatures)[0];
  if (!signature) {
    throw new Error('Could not find signature in the result');
  }
  return bs58.encode(signature as Uint8Array);
}

export function SolanaSignMessageFeaturePanel({ account }: Props) {
  const { current: NO_ERROR } = useRef(Symbol());
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [error, setError] = useState(NO_ERROR);
  const [lastSignature, setLastSignature] = useState<string | undefined>();
  const [text, setText] = useState<string>();
  const messageSigner = useWalletAccountMessageSigner(account);

  const handleSignMessage = useCallback(async (message: string) => {
    return signMessage(message, messageSigner);
  }, [messageSigner]);

  return (
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
        } catch (error) {
          setLastSignature(undefined);
          setError(error as unknown as symbol);
        } finally {
          setIsSigningMessage(false);
        }
      }}
    >
      <TextField.Root
        placeholder="Write a message to sign"
        onChange={(event: SyntheticEvent<HTMLInputElement>) => setText(event.currentTarget.value)}
        value={text}
      >
        <TextField.Slot>
          <Pencil1Icon />
        </TextField.Slot>
      </TextField.Root>
      <Dialog.Root
        open={Boolean(lastSignature)}
        onOpenChange={(open) => {
          if (!open) {
            setLastSignature(undefined);
          }
        }}
      >
        <Dialog.Trigger>
          <Button color={error ? undefined : "red"} disabled={!text} loading={isSigningMessage} type="submit">
            Sign Message
          </Button>
        </Dialog.Trigger>
        {lastSignature ? (
          <Dialog.Content
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <Dialog.Title>You Signed a Message!</Dialog.Title>
            <DataList.Root orientation={{ initial: "vertical", sm: "horizontal" }}>
              <DataList.Item>
                <DataList.Label minWidth="88px">Message</DataList.Label>
                <DataList.Value>
                  <Blockquote>{text}</Blockquote>
                </DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label minWidth="88px">Signature</DataList.Label>
                <DataList.Value>
                  <Code truncate>{lastSignature}</Code>
                </DataList.Value>
              </DataList.Item>
            </DataList.Root>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <Dialog.Close>
                <Button>Cool!</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        ) : null}
      </Dialog.Root>
      {error !== NO_ERROR ? (
        <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} title="Failed to sign message" />
      ) : null}
    </form>
  );
}
