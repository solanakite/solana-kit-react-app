# *Working* Solana Kit wallet connection example.

This is an example of how to use `@solana/kit` and `@solana/react` to build a React web application.

> [!NOTE]  
> This is forked from [Anza's Solana Kit React App](https://github.com/anza-xyz/kit/tree/main/examples/react-app), turned into a standalone example and with *all the bugs* fixed (see the GitHub changelog).

## Features

- Connects to browser wallets that support the Wallet Standard; one or more at a time
- Fetches and subscribes to the balance of the selected wallet
- Allows you to sign an arbitrary message using a wallet account
- Allows you to make a transfer from the selected wallet to any other wallet

## Developing

Start a server in development mode.

```shell
npm install
npm dev
```

Press <kbd>o</kbd> + <kbd>Enter</kbd> to open the app in a browser. Edits to the source code will automatically reload the app.

## Building for deployment

Build a static bundle and HTML for deployment to a webserver.

```shell
npm install
npm run build
```

The contents of the `dist/` directory can now be uploaded to a webserver.

## Enabling Mainnet-Beta

Access to this cluster is typically blocked by [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) rules, so it is disabled in the example app by default. To enable it, start the server or compile the application with the `REACT_EXAMPLE_APP_ENABLE_MAINNET` environment variable set to `"true"`.

```shell
REACT_EXAMPLE_APP_ENABLE_MAINNET=true npm dev
REACT_EXAMPLE_APP_ENABLE_MAINNET=true npm build
```
