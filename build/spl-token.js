"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = require("@metaplex-foundation/js");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const errors_1 = require("./errors");
const axios_1 = __importDefault(require("axios"));
class SplToken {
    constructor(connection, identity) {
        /**
         * Create a new SPL token
         * @param payer payer wallet
         * @param mintAuthorityPublicKey mint authority public key
         * @param freezeAuthorityPublicKey freeze authority public key
         */
        this.createToken = (payer, mintAuthorityPublicKey, freezeAuthorityPublicKey) => __awaiter(this, void 0, void 0, function* () {
            try {
                const mint = yield (0, spl_token_1.createMint)(this.connection, payer, mintAuthorityPublicKey, freezeAuthorityPublicKey, 9);
                return mint;
            }
            catch (_a) {
                throw errors_1.CreateTokenError;
            }
        });
        /**
         * Find all SPL tokens by owner
         * @param address owner wallet address
         */
        this.findAllSplTokens = (address) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            const account = new web3_js_1.PublicKey(address);
            const tokenAccounts = yield this.connection.getTokenAccountsByOwner(account, {
                programId: spl_token_1.TOKEN_PROGRAM_ID,
            });
            const accounts = {};
            for (let i = 0; i < tokenAccounts.value.length; i++) {
                const tokenAccount = tokenAccounts.value[i];
                const accountData = spl_token_1.AccountLayout.decode(tokenAccount.account.data);
                let tokenMetadata = null;
                try {
                    tokenMetadata = yield this.metaplex.nfts().findByMint({
                        mintAddress: new web3_js_1.PublicKey(accountData.mint),
                    });
                }
                catch (_c) { }
                if ((tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.model) === "nft")
                    continue;
                let downloadMetadata;
                if (tokenMetadata && tokenMetadata.uri) {
                    downloadMetadata = yield (0, axios_1.default)(tokenMetadata.uri).then((res) => res);
                }
                accounts[accountData.mint.toBase58()] = {
                    amount: accountData.amount,
                    name: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.name) || "Unknown",
                    address: tokenAccount.pubkey.toBase58(),
                    symbol: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.symbol) || "Unknown",
                    image: ((_b = tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.json) === null || _b === void 0 ? void 0 : _b.image) || null,
                    uri: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.uri) || null,
                    downloadMetadata: (downloadMetadata === null || downloadMetadata === void 0 ? void 0 : downloadMetadata.data) || null,
                };
            }
            return accounts;
        });
        this.getOrCreateSplTokenAccount = (walletAddres, mintAddress) => __awaiter(this, void 0, void 0, function* () {
            const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
            const payerPublicKey = new web3_js_1.PublicKey(walletAddres);
            if (!this.keypair)
                throw new Error("Keypair is not defined");
            const response = (0, spl_token_1.getOrCreateAssociatedTokenAccount)(this.connection, this.keypair, mintPublicKey, payerPublicKey);
            return response;
        });
        this.connection = connection;
        this.metaplex = new js_1.Metaplex(connection);
        if (identity === null || identity === void 0 ? void 0 : identity.wallet) {
            this.wallet = identity.wallet;
        }
        if ((identity === null || identity === void 0 ? void 0 : identity.keypair) && !(identity === null || identity === void 0 ? void 0 : identity.wallet)) {
            this.keypair = identity.keypair;
        }
    }
}
exports.default = SplToken;
