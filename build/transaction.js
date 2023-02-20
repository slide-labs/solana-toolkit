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
const errors_1 = require("./errors");
const web3_js_1 = require("@solana/web3.js");
const sleep_1 = __importDefault(require("./utils/sleep"));
const spl_token_1 = __importDefault(require("./spl-token"));
const spl_token_2 = require("@solana/spl-token");
class Transaction {
    constructor(connection, identity) {
        this.transferToken = (payerWalletAddress, payment, mintAddress) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payerPublicKey = new web3_js_1.PublicKey(payerWalletAddress);
            const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
            const { getOrCreateSplTokenAccount } = new spl_token_1.default(this.connection, {
                wallet: this.wallet,
                keypair: this.keypair,
            });
            const { account } = yield getOrCreateSplTokenAccount(payment.payee, mintAddress);
            if (!account) {
                throw errors_1.AccountNotFoundError;
            }
            let instructions = [];
            instructions.push((0, spl_token_2.createTransferCheckedInstruction)(account.address, mintPublicKey, account.address, payerPublicKey, payment.amount, 9 // TODO: get decimals from mint
            ));
            const { blockhash } = yield this.connection.getLatestBlockhash();
            const messageV0 = new web3_js_1.TransactionMessage({
                payerKey: payerPublicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();
            const transaction = new web3_js_1.VersionedTransaction(messageV0);
            const signature = yield this.connection.sendTransaction(transaction, {
                maxRetries: 5,
            });
            const txn = yield this.getTxn(signature, {
                maxTries: 20,
                waitMS: 1000,
            });
            if ((_a = txn === null || txn === void 0 ? void 0 : txn.meta) === null || _a === void 0 ? void 0 : _a.err) {
                throw new Error(txn.meta.err.toString());
            }
            return { signature, txn };
        });
        this.connection = connection;
        if (identity.wallet) {
            this.wallet = identity.wallet;
        }
        if (identity.keypair && !identity.wallet) {
            this.keypair = identity.keypair;
        }
    }
    /**
     * Request SOL airdrop to a wallet address
     *  @param walletAddressPublicKey receive airdrop
     * `it's run only on devnet or testnet!`
     */
    solAirDrop(walletAddressPublicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.connection.requestAirdrop(walletAddressPublicKey, web3_js_1.LAMPORTS_PER_SOL);
                return response;
            }
            catch (_a) {
                throw errors_1.DefaultError;
            }
        });
    }
    asyncconfirmTransaction(signature, blockhash, lastValidBlockHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirmation = yield this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "finalized");
            return confirmation.value;
        });
    }
    getTxn(signature, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxTries = (config === null || config === void 0 ? void 0 : config.maxTries) || 1;
            const waitMS = (config === null || config === void 0 ? void 0 : config.waitMS) || 500;
            const txn = yield this.connection.getTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            });
            const remainingTries = maxTries - 1;
            if (txn || remainingTries === 0)
                return txn;
            yield (0, sleep_1.default)(waitMS);
            return this.getTxn(signature, { maxTries: remainingTries, waitMS });
        });
    }
}
exports.default = Transaction;
//# sourceMappingURL=transaction.js.map