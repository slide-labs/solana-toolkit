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
        /**
         * Request SOL airdrop to a wallet address
         *  @param walletAddressPublicKey receive airdrop
         * `it's run only on devnet or testnet!`
         */
        this.solAirDrop = (walletAddressPublicKey) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.connection.requestAirdrop(walletAddressPublicKey, web3_js_1.LAMPORTS_PER_SOL);
                return response;
            }
            catch (_a) {
                throw errors_1.DefaultError;
            }
        });
        this.asyncConfirmTransaction = (signature, blockhash, lastValidBlockHeight) => __awaiter(this, void 0, void 0, function* () {
            const confirmation = yield this.connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "finalized");
            return confirmation.value;
        });
        this.getTxn = (signature, config) => __awaiter(this, void 0, void 0, function* () {
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
        this.transferToken = (payerWalletAddress, payment, mintAddress) => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            const payerPublicKey = new web3_js_1.PublicKey(payerWalletAddress);
            const mintPublicKey = new web3_js_1.PublicKey(mintAddress);
            const { getOrCreateSplTokenAccount } = new spl_token_1.default(this.connection, {
                wallet: this.wallet,
                keypair: this.keypair,
            });
            const account = yield getOrCreateSplTokenAccount(payment.payee, mintAddress);
            if (!account) {
                throw errors_1.AccountNotFoundError;
            }
            let instructions = [];
            instructions.push((0, spl_token_2.createTransferCheckedInstruction)(account.address, mintPublicKey, account.address, payerPublicKey, payment.amount, 9 // TODO: get decimals from mint
            ));
            const { blockhash, lastValidBlockHeight } = yield this.connection.getLatestBlockhash();
            const messageV0 = new web3_js_1.TransactionMessage({
                payerKey: payerPublicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();
            const transaction = new web3_js_1.VersionedTransaction(messageV0);
            if (this.keypair) {
                transaction.sign([this.keypair]);
            }
            if (this.wallet && ((_b = this.wallet) === null || _b === void 0 ? void 0 : _b.signTransaction)) {
                yield this.wallet.signTransaction(transaction);
            }
            const signature = yield this.connection.sendTransaction(transaction, {
                maxRetries: 5,
            });
            const txn = yield this.getTxn(signature, {
                maxTries: 20,
                waitMS: 1000,
            });
            if ((_c = txn === null || txn === void 0 ? void 0 : txn.meta) === null || _c === void 0 ? void 0 : _c.err) {
                throw new Error(txn.meta.err.toString());
            }
            yield this.asyncConfirmTransaction(signature, blockhash, lastValidBlockHeight);
            return { signature, txn };
        });
        this.createAccount = () => __awaiter(this, void 0, void 0, function* () {
            var _d, _e, _f;
            if (!this.keypair && !this.wallet) {
                throw new Error("Wallet is not connected, please provide a keypair");
            }
            const space = 0;
            const rentExemptionAmount = yield this.connection.getMinimumBalanceForRentExemption(space);
            const newAccountPubkey = web3_js_1.Keypair.generate();
            const createAccountParams = {
                fromPubkey: (((_d = this.wallet) === null || _d === void 0 ? void 0 : _d.publicKey) ||
                    ((_e = this.keypair) === null || _e === void 0 ? void 0 : _e.publicKey)),
                newAccountPubkey: newAccountPubkey.publicKey,
                lamports: rentExemptionAmount,
                space,
                programId: web3_js_1.SystemProgram.programId,
            };
            const createAccountTransaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.createAccount(createAccountParams));
            if (this.wallet && ((_f = this.wallet) === null || _f === void 0 ? void 0 : _f.signTransaction)) {
                yield this.wallet.signTransaction(createAccountTransaction);
            }
            if (this.keypair) {
                yield (0, web3_js_1.sendAndConfirmTransaction)(this.connection, createAccountTransaction, [this.keypair, newAccountPubkey]);
            }
            return newAccountPubkey;
        });
        this.connection = connection;
        if (identity === null || identity === void 0 ? void 0 : identity.wallet) {
            this.wallet = identity.wallet;
        }
        if ((identity === null || identity === void 0 ? void 0 : identity.keypair) && !identity.wallet) {
            this.keypair = identity.keypair;
        }
    }
}
exports.default = Transaction;
