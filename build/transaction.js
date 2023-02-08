"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("./errors");
const web3_js_1 = require("@solana/web3.js");
class Transaction {
    constructor(connection) {
        this.connection = connection;
    }
    /**
     * Request SOL airdrop to a wallet address
     *  @param walletAddressPublicKey receive airdrop
     * `it's run only on devnet or testnet!`
     */
    async solAirDrop(walletAddressPublicKey) {
        try {
            const response = await this.connection.requestAirdrop(walletAddressPublicKey, web3_js_1.LAMPORTS_PER_SOL);
            return response;
        }
        catch (_a) {
            throw errors_1.DefaultError;
        }
    }
}
exports.default = Transaction;
//# sourceMappingURL=transaction.js.map