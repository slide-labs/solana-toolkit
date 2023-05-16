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
const axios_1 = __importDefault(require("axios"));
class NFT {
    constructor(connection, identity) {
        /**
         * Find all NFT's
         * @param address owner wallet address
         */
        this.findAllNfts = (address) => __awaiter(this, void 0, void 0, function* () {
            const account = new web3_js_1.PublicKey(address);
            const tokenAccounts = yield this.connection.getTokenAccountsByOwner(account, {
                programId: spl_token_1.TOKEN_PROGRAM_ID,
            });
            const nfts = {};
            for (let i = 0; i < tokenAccounts.value.length; i++) {
                const tokenAccount = tokenAccounts.value[i];
                const accountData = spl_token_1.AccountLayout.decode(tokenAccount.account.data);
                let tokenMetadata = null;
                try {
                    tokenMetadata = yield this.metaplex.nfts().findByMint({
                        mintAddress: new web3_js_1.PublicKey(accountData.mint),
                    });
                }
                catch (_a) { }
                if ((tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.model) === "sft" || !tokenMetadata)
                    continue;
                const downloadMetadata = yield (0, axios_1.default)(tokenMetadata.uri).then((res) => res);
                nfts[accountData.mint.toBase58()] = Object.assign(Object.assign({}, tokenMetadata), { metadata: downloadMetadata ? Object.assign({}, downloadMetadata.data) : null });
            }
            return nfts;
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
exports.default = NFT;
