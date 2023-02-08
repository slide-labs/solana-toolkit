import { CandyMachineV2Configs, Metaplex, MetaplexFileContent, MetaplexFileOptions, WalletAdapter } from "@metaplex-foundation/js";
import { Cluster, Connection, Keypair } from "@solana/web3.js";
export default class CandyMachine {
    connection: Connection;
    metaplex: Metaplex;
    cluster: Cluster;
    constructor(connection: Connection, identity: {
        wallet?: WalletAdapter;
        keypair?: Keypair;
    }, cluster?: Cluster);
    /**
     * Create a new Candy Machine
     *
     * Attention: You need add the files with the match by file name! `example: file = 0.png and json = 0.json`
     * Attention: Add the files for the collection! `example: file=collection.png and json = collection.json`
     * @param candyMachineConfig
     * @param files files to upload
     * @param metaData metadata to upload
     */
    createCandyMachine(candyMachineConfig: CandyMachineV2Configs, files: NftFile[], metaDatas: NftMetaData[]): Promise<{
        candyMachine: import("@metaplex-foundation/js").CandyMachineV2;
        itemsResponse: import("@metaplex-foundation/js").SendAndConfirmTransactionResponse;
        link: string;
    } | undefined>;
    /**
     * Get all candy machine
     * @param ownerWalletAddress wallet addres
     */
    getAllCandyMachine(ownerWalletAddress: string): Promise<import("@metaplex-foundation/js").CandyMachineV2[]>;
}
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
    attributes: {
        trait_type: string;
        value: string;
    }[];
    properties: {
        files: {
            uri: string;
            type: string;
        }[];
    };
}
//# sourceMappingURL=candy-machine.d.ts.map