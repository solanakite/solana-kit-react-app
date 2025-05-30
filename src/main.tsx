import "./index.css";
import "@radix-ui/themes/styles.css";

import { Flex, Section, Theme } from "@radix-ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Nav } from "./components/Nav.tsx";
import { ChainContextProvider } from "./context/ChainContextProvider.tsx";
import { ConnectionContextProvider } from "./context/ConnectionContextProvider.tsx";
import { SelectedWalletAccountContextProvider } from "./context/SelectedWalletAccountContextProvider.tsx";
import Root from "./routes/root.tsx";

const rootNode = document.getElementById("root")!;
const root = createRoot(rootNode);
root.render(
  <StrictMode>
    <Theme>
      <ChainContextProvider>
        <SelectedWalletAccountContextProvider>
          <ConnectionContextProvider>
            <Flex direction="column">
              <Nav />
              <Section>
                <Root />
              </Section>
            </Flex>
          </ConnectionContextProvider>
        </SelectedWalletAccountContextProvider>
      </ChainContextProvider>
    </Theme>
  </StrictMode>,
);
