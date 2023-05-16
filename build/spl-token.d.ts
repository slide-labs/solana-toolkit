import { Metaplex, WalletAdapter } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
export default class SplToken {
    connection: Connection;
    metaplex: Metaplex;
    wallet?: WalletAdapter;
    keypair?: Keypair;
    constructor(connection: Connection, identity?: {
        wallet?: WalletAdapter;
        keypair?: Keypair;
    });
    /**
     * Create a new SPL token
     * @param payer payer wallet
     * @param mintAuthorityPublicKey mint authority public key
     * @param freezeAuthorityPublicKey freeze authority public key
     */
    createToken: (payer: Signer, mintAuthorityPublicKey: PublicKey, freezeAuthorityPublicKey: PublicKey) => Promise<PublicKey>;
    /**
     * Find all SPL tokens by owner
     * @param address owner wallet address
     */
    findAllSplTokens: (address: string) => Promise<Record<string, {
        amount: bigint;
        name: string;
        address: string;
        symbol: string;
        image?: string | null | undefined;
        uri?: string | null | undefined;
        downloadMetadata?: object | undefined;
    }>>;
    getOrCreateSplTokenAccount: (walletAddres: string, mintAddress: string) => Promise<import("@solana/spl-token").Account>;
}
