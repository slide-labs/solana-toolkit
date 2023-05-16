/// <reference types="@metaplex-foundation/js/node_modules/@solana/web3.js" />
import { Connection, Keypair, PublicKey, VersionedTransactionResponse } from "@solana/web3.js";
import { WalletAdapter } from "@metaplex-foundation/js";
export default class Transaction {
    connection: Connection;
    wallet?: WalletAdapter;
    keypair?: Keypair;
    constructor(connection: Connection, identity?: {
        wallet?: WalletAdapter;
        keypair?: Keypair;
    });
    /**
     * Request SOL airdrop to a wallet address
     *  @param walletAddressPublicKey receive airdrop
     * `it's run only on devnet or testnet!`
     */
    solAirDrop: (walletAddressPublicKey: PublicKey) => Promise<string>;
    asyncConfirmTransaction: (signature: string, blockhash: string, lastValidBlockHeight: number) => Promise<import("@solana/web3.js").SignatureResult>;
    getTxn: (signature: string, config?: {
        maxTries?: number;
        waitMS?: number;
    }) => Promise<VersionedTransactionResponse | null>;
    transferToken: (payerWalletAddress: string, payment: {
        payee: string;
        amount: bigint | number;
        memo: string;
    }, mintAddress: string) => Promise<{
        signature: string;
        txn: VersionedTransactionResponse | null;
    }>;
    createAccount: () => Promise<Keypair>;
}
