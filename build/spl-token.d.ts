import { Metaplex, WalletAdapter } from "@metaplex-foundation/js";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
export default class SplToken {
    connection: Connection;
    metaplex: Metaplex;
    wallet?: WalletAdapter;
    keypair?: Keypair;
    constructor(connection: Connection, identity: {
        wallet?: WalletAdapter;
        keypair?: Keypair;
    });
    /**
     * Create a new SPL token
     * @param payer payer wallet
     * @param mintAuthorityPublicKey mint authority public key
     * @param freezeAuthorityPublicKey freeze authority public key
     */
    createToken(payer: Signer, mintAuthorityPublicKey: PublicKey, freezeAuthorityPublicKey: PublicKey): Promise<PublicKey>;
    /**
     * Find all SPL tokens by owner
     * @param address owner wallet address
     */
    findAllSplTokens(address: string): Promise<Record<string, {
        amount: bigint;
        name: string;
        address: string;
        symbol: string;
        image?: string | null | undefined;
    }>>;
    getOrCreateSplTokenAccount(walletAddres: string, mintAddress: string): Promise<{
        account: import("@solana/spl-token").Account;
        signature?: undefined;
        txn?: undefined;
    } | {
        signature: string;
        txn: import("@solana/web3.js").VersionedTransactionResponse | null;
        account: import("@solana/spl-token").Account | null;
    }>;
    getSplTokenAccount(walletAddres: string, mintAddress: string): Promise<{
        account: null;
        associatedToken: PublicKey;
    } | {
        account: import("@solana/spl-token").Account;
        associatedToken: PublicKey;
    }>;
}
//# sourceMappingURL=spl-token.d.ts.map