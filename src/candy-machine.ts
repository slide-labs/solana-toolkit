import {
  CandyMachineV2Configs,
  keypairIdentity,
  Metaplex,
  MetaplexFileContent,
  MetaplexFileOptions,
  toMetaplexFile,
  toMetaplexFileFromJson,
  WalletAdapter,
  walletAdapterIdentity,
  bundlrStorage,
} from "@metaplex-foundation/js";
import { Cluster, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { CreateCandyMachineError } from "./errors";

export default class CandyMachine {
  connection: Connection;
  metaplex: Metaplex;
  cluster: Cluster;

  constructor(
    connection: Connection,
    identity: {
      wallet?: WalletAdapter;
      keypair?: Keypair;
    },
    cluster?: Cluster
  ) {
    this.connection = connection;
    this.metaplex = new Metaplex(connection);
    this.cluster = cluster || "mainnet-beta";

    if (cluster === "devnet") {
      this.metaplex.use(
        bundlrStorage({
          address: "https://devnet.bundlr.network",
          providerUrl: "https://api.devnet.solana.com",
          timeout: 60000,
        })
      );
    }

    if (identity.wallet) {
      this.metaplex.use(walletAdapterIdentity(identity.wallet));
    }

    if (identity.keypair && !identity.wallet) {
      this.metaplex.use(keypairIdentity(identity.keypair));
    }
  }

  /**
   * Create a new Candy Machine
   *
   * Attention: You need add the files with the match by file name! `example: file = 0.png and json = 0.json`
   * Attention: Add the files for the collection! `example: file=collection.png and json = collection.json`
   * @param candyMachineConfig
   * @param files files to upload
   * @param metaData metadata to upload
   */
  async createCandyMachine(
    candyMachineConfig: CandyMachineV2Configs,
    files: NftFile[],
    metaDatas: NftMetaData[]
  ) {
    const candyMachine = await this.metaplex
      .candyMachinesV2()
      .create(candyMachineConfig)
      .then((candyMachine) => candyMachine.candyMachine)
      .catch(() => {});

    if (!candyMachine?.address) {
      return;
    }

    try {
      if (!candyMachine) {
        throw CreateCandyMachineError;
      }

      const metaplexImageFiles = files.map((file) =>
        toMetaplexFile(file.image, file.fileName, file.options)
      );

      const uriImageFiles = await this.metaplex
        .storage()
        .uploadAll(metaplexImageFiles);

      const metaplexJsonFiles = metaDatas.map((metaData, index) =>
        toMetaplexFileFromJson(
          {
            ...metaData.json,
            image: uriImageFiles[index],
            properties: {
              ...metaData.json.properties,
              files: [{ uri: uriImageFiles[index], type: "image/png" }],
            },
          },
          metaData.fileName
        )
      );

      const uriJsonFiles = await this.metaplex
        .storage()
        .uploadAll(metaplexJsonFiles);

      const items = await Promise.all(
        uriJsonFiles.map((uri) =>
          fetch(uri)
            .then((res) => res.json())
            .then((json) => json)
        )
      );

      const insertItemsToCandyMachineV2Operation = await this.metaplex
        .candyMachinesV2()
        .insertItems({
          candyMachine,
          items: items.map((item, index) => ({
            name: item.name,
            uri: uriJsonFiles[index],
          })),
        });

      return {
        candyMachine,
        itemsResponse: insertItemsToCandyMachineV2Operation.response,
        link: `https://www.solaneyes.com/address/G5JqWc5eJogfKSb7Moegc64Ms2zx4UF5aBKVHgpWbuqN?cluster=${this.cluster}`,
      };
    } catch (e) {
      throw e;
    }
  }

  /**
   * Get all candy machine
   * @param ownerWalletAddress wallet addres
   */
  async getAllCandyMachine(ownerWalletAddress: string) {
    try {
      const candyMachines = await this.metaplex.candyMachinesV2().findAllBy({
        publicKey: new PublicKey(ownerWalletAddress),
        type: "wallet",
      });

      return candyMachines;
    } catch (e) {
      throw e;
    }
  }
}

//
// Utils
//

export interface NftFile {
  image: MetaplexFileContent;
  fileName: string;
  nftName: string;
  options: MetaplexFileOptions;
}

export interface NftMetaData {
  json: MetaData;
  fileName: string;
}

export interface MetaData {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  properties: { files: { uri: string; type: string }[] };
}
