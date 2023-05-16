# `@slidelabs/solana-toolkit`


<a href="https://docs.slidelabs.xyz/"><img alt="Docs" src="https://img.shields.io/badge/docs-typedoc-blueviolet" /></a>
![npm](https://img.shields.io/npm/v/@slidelabs/solana-toolkit)
![npm](https://img.shields.io/npm/dm/@slidelabs/solana-toolkit)
![npm](https://img.shields.io/npm/l/@slidelabs/solana-toolkit)

Quickly use the main methods present in Solana, all in one toolkit. SPL tokens, transactions, mints.

## Installation

```shell
$ yarn add @slidelabs/solana-toolkit
# or
$ npm install @slidelabs/solana-toolkit
```

### Request SOL AirDrop

```typescript
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { Transaction } from "@slidelabs/solana-toolkit";

const connection = new Connection(clusterApiUrl("devnet"));
const transaction = new Transaction(connection);

const publicKey = new PublicKey("HjJQdfTHgC3EBX3471w4st8BXbBmtbaMyCAXNgcUb7dq");

transaction.solAirDrop(publicKey);
```

### Create a Candy Machine

```typescript
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { CandyMachine } from "@slidelabs/solana-toolkit";

const connection = new Connection(clusterApiUrl("devnet"));
const candyMachine = new CandyMachine(connection, { wallet }, "devnet");

const JSON_METADATA = {
  name: "Glorious Arctic Halibut",
  symbol: "SR",
  description: "SR Desc",
  image: "0.png",
  attributes: [{ trait_type: "Location", value: "Strasbourg - France" }],
  properties: { files: [{ uri: "0.png", type: "image/png" }] },
};

candyMachine.createCandyMachine(
  {
    wallet: new PublicKey("4x4UVonAFWUJ2MPNh8dVAPBBxkqxB82peiuD5rQQM1YV"),
    tokenMint: null,
    price: sol(0.1),
    sellerFeeBasisPoints: 250,
    itemsAvailable: toBigNumber(1000),
    symbol: "Test",
    maxEditionSupply: toBigNumber(0),
    isMutable: true,
    retainAuthority: false,
    goLiveDate: null,
    endSettings: null,
    hiddenSettings: null,
    whitelistMintSettings: null,
    gatekeeper: null,
    creators: [
      {
        address: new PublicKey("4x4UVonAFWUJ2MPNh8dVAPBBxkqxB82peiuD5rQQM1YV"),
        share: 100,
        verified: true,
      },
    ],
  },
  [
    {
      fileName: "0",
      image: "0.png",
      nftName: "Glorious Arctic Halibut",
      options: {},
    },
  ],
  [{ json: JSON_METADATA, fileName: "0.json" }]
);
```
Latest update: May 16th, 2023
