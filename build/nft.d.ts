import { Metaplex, Nft, WalletAdapter } from "@metaplex-foundation/js";
import { Connection, Keypair } from "@solana/web3.js";
export default class NFT {
    connection: Connection;
    metaplex: Metaplex;
    wallet?: WalletAdapter;
    keypair?: Keypair;
    constructor(connection: Connection, identity?: {
        wallet?: WalletAdapter;
        keypair?: Keypair;
    });
    /**
     * Find all NFT's
     * @param address owner wallet address
     */
    findAllNfts: (address: string) => Promise<Record<string, NftToken>>;
}
interface NftToken extends Nft {
    metadata: object | null;
}
export {};
