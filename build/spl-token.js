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
const transaction_1 = __importDefault(require("./transaction"));
const errors_1 = require("./errors");
class SplToken {
    constructor(connection, identity) {
        this.connection = connection;
        this.metaplex = new js_1.Metaplex(connection);
        if (identity.wallet) {
            this.wallet = identity.wallet;
        }
        if (identity.keypair && !identity.wallet) {
            this.keypair = identity.keypair;
        }
    }
    /**
     * Create a new SPL token
     * @param payer payer wallet
     * @param mintAuthorityPublicKey mint authority public key
     * @param freezeAuthorityPublicKey freeze authority public key
     */
    createToken(payer, mintAuthorityPublicKey, freezeAuthorityPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mint = yield (0, spl_token_1.createMint)(this.connection, payer, mintAuthorityPublicKey, freezeAuthorityPublicKey, 9);
                return mint;
            }
            catch (_a) {
                throw errors_1.CreateTokenError;
            }
        });
    }
    /**
     * Find all SPL tokens by owner
     * @param address owner wallet address
     */
    findAllSplTokens(address) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
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
                catch (_b) { }
                if ((tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.model) === "nft")
                    continue;
                accounts[accountData.mint.toBase58()] = {
                    amount: accountData.amount,
                    name: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.name) || "Unknown",
                    address: tokenAccount.pubkey.toBase58(),
                    symbol: (tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.symbol) || "Unknown",
                    image: ((_a = tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.json) === null || _a === void 0 ? void 0 : _a.image) || null,
                };
            }
            return accounts;
        });
    }
    getOrCreateSplTokenAccount(walletAddres, mintAddress) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
            const payerPublicKey = new web3_js_1.PublicKey(walletAddres);
            try {
                const { account, associatedToken } = yield this.getSplTokenAccount(mintAddress, mintAddress);
                if (account) {
                    return { account };
                }
                const transaction = new web3_js_1.Transaction().add((0, spl_token_1.createAssociatedTokenAccountInstruction)(payerPublicKey, associatedToken, payerPublicKey, mintPublicKey));
                const { blockhash } = yield this.connection.getLatestBlockhash();
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = payerPublicKey;
                if ((_a = this.wallet) === null || _a === void 0 ? void 0 : _a.signTransaction) {
                    yield this.wallet.signTransaction(transaction);
                }
                if (this.keypair) {
                    transaction.sign(this.keypair);
                }
                const signature = yield this.connection.sendRawTransaction(transaction.serialize(), {
                    skipPreflight: true,
                    maxRetries: 5,
                });
                const { getTxn } = new transaction_1.default(this.connection, {
                    wallet: this.wallet,
                    keypair: this.keypair,
                });
                const txn = yield getTxn(signature);
                if ((_b = txn === null || txn === void 0 ? void 0 : txn.meta) === null || _b === void 0 ? void 0 : _b.err) {
                    throw new Error(txn.meta.err.toString());
                }
                const { account: acc } = yield this.getSplTokenAccount(mintAddress, mintAddress);
                return { signature, txn, account: acc };
            }
            catch (e) {
                throw e;
            }
        });
    }
    getSplTokenAccount(walletAddres, mintAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
            const payerPublicKey = new web3_js_1.PublicKey(walletAddres);
            const associatedToken = (0, spl_token_1.getAssociatedTokenAddressSync)(mintPublicKey, payerPublicKey);
            const account = yield (0, spl_token_1.getAccount)(this.connection, associatedToken);
            if (!account)
                return { account: null, associatedToken };
            return { account, associatedToken };
        });
    }
}
exports.default = SplToken;
//# sourceMappingURL=spl-token.js.map