"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = require("@metaplex-foundation/js");
const web3_js_1 = require("@solana/web3.js");
const errors_1 = require("./errors");
class CandyMachine {
    constructor(connection, identity, cluster) {
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
    /**
     * Create a new Candy Machine
     *
     * Attention: You need add the files with the match by file name! `example: file = 0.png and json = 0.json`
     * Attention: Add the files for the collection! `example: file=collection.png and json = collection.json`
     * @param candyMachineConfig
     * @param files files to upload
     * @param metaData metadata to upload
     */
    async createCandyMachine(candyMachineConfig, files, metaDatas) {
        const candyMachine = await this.metaplex
            .candyMachinesV2()
            .create(candyMachineConfig)
            .then((candyMachine) => candyMachine.candyMachine)
            .catch(() => { });
        if (!(candyMachine === null || candyMachine === void 0 ? void 0 : candyMachine.address)) {
            return;
        }
        try {
            if (!candyMachine) {
                throw errors_1.CreateCandyMachineError;
            }
            const metaplexImageFiles = files.map((file) => (0, js_1.toMetaplexFile)(file.image, file.fileName, file.options));
            const uriImageFiles = await this.metaplex
                .storage()
                .uploadAll(metaplexImageFiles);
            const metaplexJsonFiles = metaDatas.map((metaData, index) => (0, js_1.toMetaplexFileFromJson)(Object.assign(Object.assign({}, metaData.json), { image: uriImageFiles[index], properties: Object.assign(Object.assign({}, metaData.json.properties), { files: [{ uri: uriImageFiles[index], type: "image/png" }] }) }), metaData.fileName));
            const uriJsonFiles = await this.metaplex
                .storage()
                .uploadAll(metaplexJsonFiles);
            const items = await Promise.all(uriJsonFiles.map((uri) => fetch(uri)
                .then((res) => res.json())
                .then((json) => json)));
            const insertItemsToCandyMachineV2Operation = await this.metaplex
                .candyMachinesV2()
                .insertItems({
                candyMachine,
                items: items.map((item, index) => ({
                    name: item.name,
                    uri: uriJsonFiles[index],
                })),
            });
            return {
                candyMachine,
                itemsResponse: insertItemsToCandyMachineV2Operation.response,
                link: `https://www.solaneyes.com/address/G5JqWc5eJogfKSb7Moegc64Ms2zx4UF5aBKVHgpWbuqN?cluster=${this.cluster}`,
            };
        }
        catch (e) {
            throw e;
        }
    }
    /**
     * Get all candy machine
     * @param ownerWalletAddress wallet addres
     */
    async getAllCandyMachine(ownerWalletAddress) {
        try {
            const candyMachines = await this.metaplex.candyMachinesV2().findAllBy({
                publicKey: new web3_js_1.PublicKey(ownerWalletAddress),
                type: "wallet",
            });
            return candyMachines;
        }
        catch (e) {
            throw e;
        }
    }
}
exports.default = CandyMachine;
//# sourceMappingURL=candy-machine.js.map