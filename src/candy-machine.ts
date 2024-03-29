import {
  keypairIdentity,
  Metaplex,
  toMetaplexFile,
  toMetaplexFileFromJson,
  WalletAdapter,
  walletAdapterIdentity,
  bundlrStorage,
  CandyMachineV2Configs,
  sol,
  toBigNumber,
} from "@metaplex-foundation/js";
import { Cluster, Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  CandyMachineDontCreatedError,
  CandyMachineDontFoundError,
  CreateCandyMachineError,
  UploadFilesError,
} from "./errors";
import {
  CandyMachineV2Config,
  NftFile,
  NftMetaData,
} from "./types/candy-machine";

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
          address: DEVNET_STORAGE,
          providerUrl: DEVNET_PROVIDER_URL,
          timeout: 60000,
        })
      );
    }

    if (identity.wallet) {
      this.metaplex.use(walletAdapterIdentity(identity.wallet));
    }

    if (identity.keypair) {
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
  createCandyMachine = async (
    candyMachineConfig: CandyMachineV2Config,
    files?: NftFile[],
    metaDatas?: NftMetaData[]
  ) => {
    const normalizedConfig: CandyMachineV2Configs = {
      ...candyMachineConfig,
      price: sol(candyMachineConfig.price),
      itemsAvailable: toBigNumber(candyMachineConfig.itemsAvailable),
      maxEditionSupply: toBigNumber(candyMachineConfig.maxEditionSupply),
      goLiveDate: candyMachineConfig.goLiveDate || null,
      endSettings: candyMachineConfig.endSettings || null,
      hiddenSettings: candyMachineConfig.hiddenSettings || null,
      whitelistMintSettings: candyMachineConfig.whitelistMintSettings || null,
      gatekeeper: candyMachineConfig.gatekeeper || null,
      creators: candyMachineConfig.creators || [],
    };

    const candyMachine = await this.metaplex
      .candyMachinesV2()
      .create(normalizedConfig)
      .then((candyMachine) => candyMachine.candyMachine)
      .catch(() => {});

    if (!candyMachine?.address) {
      return CandyMachineDontCreatedError;
    }

    if (!candyMachine) {
      throw CreateCandyMachineError;
    }

    try {
      const link = `https://www.solaneyes.com/address/${candyMachine.address}?cluster=${this.cluster}`;

      if (!files || !metaDatas) {
        return {
          candyMachine,
          link,
        };
      }

      const insertItemsToCandyMachineV2Operation =
        await this.addItemsToCandyMachine(
          candyMachine.address.toString(),
          files,
          metaDatas
        );

      if (!insertItemsToCandyMachineV2Operation) {
        throw UploadFilesError;
      }

      return {
        candyMachine,
        itemsResponse: insertItemsToCandyMachineV2Operation,
        link,
      };
    } catch (e) {
      throw e;
    }
  };

  /**
   * Add NFTs to Candy Machine
   *
   * @param candyMachineAddress Candy Machine Address
   * @param files files to upload
   * @param metaData metadata to upload
   */
  addItemsToCandyMachine = async (
    candyMachineAddress: string,
    files: NftFile[],
    metaDatas: NftMetaData[]
  ) => {
    try {
      const candyMachine = await this.metaplex
        .candyMachinesV2()
        .findByAddress({ address: new PublicKey(candyMachineAddress) });

      if (!candyMachine) {
        throw CandyMachineDontFoundError;
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

      return insertItemsToCandyMachineV2Operation.response;
    } catch (e) {
      throw e;
    }
  };

  /**
   * Get all candy machine
   * @param ownerWalletAddress wallet addres
   */
  getAllCandyMachine = async (ownerWalletAddress: string) => {
    try {
      const candyMachines = await this.metaplex.candyMachinesV2().findAllBy({
        publicKey: new PublicKey(ownerWalletAddress),
        type: "wallet",
      });

      return candyMachines;
    } catch (e) {
      throw e;
    }
  };
}

//
// Utils
//

const DEVNET_STORAGE = "https://devnet.bundlr.networ"
const DEVNET_PROVIDER_URL = "https://api.devnet.solana.com"