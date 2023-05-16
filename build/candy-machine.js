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
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = require("@metaplex-foundation/js");
const web3_js_1 = require("@solana/web3.js");
const errors_1 = require("./errors");
class CandyMachine {
    constructor(connection, identity, cluster) {
        /**
         * Create a new Candy Machine
         *
         * Attention: You need add the files with the match by file name! `example: file = 0.png and json = 0.json`
         * Attention: Add the files for the collection! `example: file=collection.png and json = collection.json`
         * @param candyMachineConfig
         * @param files files to upload
         * @param metaData metadata to upload
         */
        this.createCandyMachine = (candyMachineConfig, files, metaDatas) => __awaiter(this, void 0, void 0, function* () {
            const normalizedConfig = Object.assign(Object.assign({}, candyMachineConfig), { price: (0, js_1.sol)(candyMachineConfig.price), itemsAvailable: (0, js_1.toBigNumber)(candyMachineConfig.itemsAvailable), maxEditionSupply: (0, js_1.toBigNumber)(candyMachineConfig.maxEditionSupply), goLiveDate: candyMachineConfig.goLiveDate || null, endSettings: candyMachineConfig.endSettings || null, hiddenSettings: candyMachineConfig.hiddenSettings || null, whitelistMintSettings: candyMachineConfig.whitelistMintSettings || null, gatekeeper: candyMachineConfig.gatekeeper || null, creators: candyMachineConfig.creators || [] });
            const candyMachine = yield this.metaplex
                .candyMachinesV2()
                .create(normalizedConfig)
                .then((candyMachine) => candyMachine.candyMachine)
                .catch(() => { });
            if (!(candyMachine === null || candyMachine === void 0 ? void 0 : candyMachine.address)) {
                return errors_1.CandyMachineDontCreatedError;
            }
            if (!candyMachine) {
                throw errors_1.CreateCandyMachineError;
            }
            try {
                const link = `https://www.solaneyes.com/address/${candyMachine.address}?cluster=${this.cluster}`;
                if (!files || !metaDatas) {
                    return {
                        candyMachine,
                        link,
                    };
                }
                const insertItemsToCandyMachineV2Operation = yield this.addItemsToCandyMachine(candyMachine.address.toString(), files, metaDatas);
                if (!insertItemsToCandyMachineV2Operation) {
                    throw errors_1.UploadFilesError;
                }
                return {
                    candyMachine,
                    itemsResponse: insertItemsToCandyMachineV2Operation,
                    link,
                };
            }
            catch (e) {
                throw e;
            }
        });
        /**
         * Add NFTs to Candy Machine
         *
         * @param candyMachineAddress Candy Machine Address
         * @param files files to upload
         * @param metaData metadata to upload
         */
        this.addItemsToCandyMachine = (candyMachineAddress, files, metaDatas) => __awaiter(this, void 0, void 0, function* () {
            try {
                const candyMachine = yield this.metaplex
                    .candyMachinesV2()
                    .findByAddress({ address: new web3_js_1.PublicKey(candyMachineAddress) });
                if (!candyMachine) {
                    throw errors_1.CandyMachineDontFoundError;
                }
                const metaplexImageFiles = files.map((file) => (0, js_1.toMetaplexFile)(file.image, file.fileName, file.options));
                const uriImageFiles = yield this.metaplex
                    .storage()
                    .uploadAll(metaplexImageFiles);
                const metaplexJsonFiles = metaDatas.map((metaData, index) => (0, js_1.toMetaplexFileFromJson)(Object.assign(Object.assign({}, metaData.json), { image: uriImageFiles[index], properties: Object.assign(Object.assign({}, metaData.json.properties), { files: [{ uri: uriImageFiles[index], type: "image/png" }] }) }), metaData.fileName));
                const uriJsonFiles = yield this.metaplex
                    .storage()
                    .uploadAll(metaplexJsonFiles);
                const items = yield Promise.all(uriJsonFiles.map((uri) => fetch(uri)
                    .then((res) => res.json())
                    .then((json) => json)));
                const insertItemsToCandyMachineV2Operation = yield this.metaplex
                    .candyMachinesV2()
                    .insertItems({
                    candyMachine,
                    items: items.map((item, index) => ({
                        name: item.name,
                        uri: uriJsonFiles[index],
                    })),
                });
                return insertItemsToCandyMachineV2Operation.response;
            }
            catch (e) {
                throw e;
            }
        });
        /**
         * Get all candy machine
         * @param ownerWalletAddress wallet addres
         */
        this.getAllCandyMachine = (ownerWalletAddress) => __awaiter(this, void 0, void 0, function* () {
            try {
                const candyMachines = yield this.metaplex.candyMachinesV2().findAllBy({
                    publicKey: new web3_js_1.PublicKey(ownerWalletAddress),
                    type: "wallet",
                });
                return candyMachines;
            }
            catch (e) {
                throw e;
            }
        });
        this.connection = connection;
        this.metaplex = new js_1.Metaplex(connection);
        this.cluster = cluster || "mainnet-beta";
        if (cluster === "devnet") {
            this.metaplex.use((0, js_1.bundlrStorage)({
                address: "https://devnet.bundlr.network",
                providerUrl: "https://api.devnet.solana.com",
                timeout: 60000,
            }));
        }
        if (identity.wallet) {
            this.metaplex.use((0, js_1.walletAdapterIdentity)(identity.wallet));
        }
        if (identity.keypair && !identity.wallet) {
            this.metaplex.use((0, js_1.keypairIdentity)(identity.keypair));
        }
    }
}
exports.default = CandyMachine;
