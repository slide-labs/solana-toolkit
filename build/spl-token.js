"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const errors_1 = require("./errors");
class SplToken {
    constructor(connection) {
        this.connection = connection;
    }
    /**
     * Create a new SPL token
     * @param payer payer wallet
     * @param mintAuthorityPublicKey mint authority public key
     * @param freezeAuthorityPublicKey freeze authority public key
     */
    async createToken(payer, mintAuthorityPublicKey, freezeAuthorityPublicKey) {
        try {
            const mint = await (0, spl_token_1.createMint)(this.connection, payer, mintAuthorityPublicKey, freezeAuthorityPublicKey, 9);
            return mint;
        }
        catch (_a) {
            throw errors_1.CreateTokenError;
        }
    }
    /**
     * Find all SPL tokens by owner
     * @param address owner wallet address
     */
    async findAllSplTokensBalance(address) {
        try {
            const account = new web3_js_1.PublicKey(address);
            const tokenAccounts = await this.connection.getTokenAccountsByOwner(account, {
                programId: spl_token_1.TOKEN_PROGRAM_ID,
            });
            const accounts = {};
            tokenAccounts.value.forEach(async (tokenAccount) => {
                const accountData = spl_token_1.AccountLayout.decode(tokenAccount.account.data);
                accounts[accountData.mint.toBase58()] = accountData.amount;
            });
            return accounts;
        }
        catch (e) {
            throw e;
        }
    }
    async getOrCreateSplTokenAccount(signer, mintAddress) {
        const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
        const payerPublicKey = signer.publicKey;
        try {
            const response = await (0, spl_token_1.getOrCreateAssociatedTokenAccount)(this.connection, signer, mintPublicKey, payerPublicKey);
            return response;
        }
        catch (e) {
            throw e;
        }
    }
    sendToken() { }
}
exports.default = SplToken;
//# sourceMappingURL=spl-token.js.map