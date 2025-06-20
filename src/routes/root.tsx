import { Box, Code, Container, Flex, Heading, Spinner, Text } from "@radix-ui/themes";
import { getUiWalletAccountStorageKey } from "@wallet-standard/react";
import { Suspense, useContext } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Balance } from "../components/Balance";
import { FeatureNotSupportedCallout } from "../components/FeatureNotSupportedCallout";
import { SignAndSendTransaction } from "../components/SignAndSendTransaction";
import { SignMessage } from "../components/SignMessage";
import { WalletAccountIcon } from "../components/WalletAccountIcon";
import { ChainContext } from "../context/ChainContext";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";

function Root() {
  const { chain } = useContext(ChainContext);
  const [selectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const errorBoundaryResetKeys = [
    chain,
    selectedWalletAccount && getUiWalletAccountStorageKey(selectedWalletAccount),
  ].filter(Boolean);
  return (
    <Container mx={{ initial: "3", xs: "6" }}>
      {selectedWalletAccount ? (
        <Flex gap="6" direction="column">
          <Flex gap="2">
            <Flex align="center" gap="3" flexGrow="1">
              <WalletAccountIcon account={selectedWalletAccount} height="48" width="48" />
              <Box>
                <Heading as="h4" size="3">
                  {selectedWalletAccount.label ?? "Unlabeled Account"}
                </Heading>
                <Code variant="outline" truncate size={{ initial: "1", xs: "2" }}>
                  {selectedWalletAccount.address}
                </Code>
              </Box>
            </Flex>
            <Flex direction="column" align="end">
              <Heading as="h4" size="3">
                Balance
              </Heading>
              <ErrorBoundary fallback={<Text>&ndash;</Text>} key={`${selectedWalletAccount.address}:${chain}`}>
                <Suspense fallback={<Spinner loading my="1" />}>
                  <Balance account={selectedWalletAccount} />
                </Suspense>
              </ErrorBoundary>
            </Flex>
          </Flex>

          <ErrorBoundary FallbackComponent={FeatureNotSupportedCallout} resetKeys={errorBoundaryResetKeys}>
            <SignAndSendTransaction account={selectedWalletAccount} />
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={FeatureNotSupportedCallout} resetKeys={errorBoundaryResetKeys}>
            <SignMessage account={selectedWalletAccount} />
          </ErrorBoundary>
        </Flex>
      ) : (
        <Text as="p">Click &ldquo;Connect Wallet&rdquo; to get started.</Text>
      )}
    </Container>
  );
}

export default Root;
