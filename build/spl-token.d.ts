import { Connection, PublicKey, Signer } from "@solana/web3.js";
export default class SplToken {
    connection: Connection;
    constructor(connection: Connection);
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
    findAllSplTokensBalance(address: string): Promise<Record<string, bigint>>;
    getOrCreateSplTokenAccount(signer: Signer, mintAddress: string): Promise<import("@solana/spl-token").Account>;
    sendToken(): void;
}
//# sourceMappingURL=spl-token.d.ts.map