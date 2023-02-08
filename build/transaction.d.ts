import { Connection, PublicKey } from "@solana/web3.js";
export default class Transaction {
    connection: Connection;
    constructor(connection: Connection);
    /**
     * Request SOL airdrop to a wallet address
     *  @param walletAddressPublicKey receive airdrop
     * `it's run only on devnet or testnet!`
     */
    solAirDrop(walletAddressPublicKey: PublicKey): Promise<string>;
}
//# sourceMappingURL=transaction.d.ts.map