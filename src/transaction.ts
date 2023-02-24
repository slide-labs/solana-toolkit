import { AccountNotFoundError, DefaultError } from "./errors";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import sleep from "./utils/sleep";
import SplToken from "./spl-token";
import { WalletAdapter } from "@metaplex-foundation/js";
import { createTransferCheckedInstruction } from "@solana/spl-token";

export default class Transaction {
  connection: Connection;
  wallet?: WalletAdapter;
  keypair?: Keypair;

  constructor(
    connection: Connection,
    identity: {
      wallet?: WalletAdapter;
      keypair?: Keypair;
    }
  ) {
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
  solAirDrop = async (walletAddressPublicKey: PublicKey) => {
    try {
      const response = await this.connection.requestAirdrop(
        walletAddressPublicKey,
        LAMPORTS_PER_SOL
      );
      return response;
    } catch {
      throw DefaultError;
    }
  };

  asyncconfirmTransaction = async (
    signature: string,
    blockhash: string,
    lastValidBlockHeight: number
  ) => {
    const confirmation = await this.connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "finalized"
    );
    return confirmation.value;
  };

  getTxn = async (
    signature: string,
    config?: { maxTries?: number; waitMS?: number }
  ): Promise<VersionedTransactionResponse | null> => {
    const maxTries = config?.maxTries || 1;
    const waitMS = config?.waitMS || 500;

    const txn = await this.connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    const remainingTries = maxTries - 1;
    if (txn || remainingTries === 0) return txn;

    await sleep(waitMS);

    return this.getTxn(signature, { maxTries: remainingTries, waitMS });
  };

  transferToken = async (
    payerWalletAddress: string,
    payment: {
      payee: string;
      amount: bigint | number;
      memo: string;
    },
    mintAddress: string
  ) => {
    const payerPublicKey = new PublicKey(payerWalletAddress);
    const mintPublicKey = new PublicKey(mintAddress);

    const { getOrCreateSplTokenAccount } = new SplToken(this.connection, {
      wallet: this.wallet,
      keypair: this.keypair,
    });

    const { account } = await getOrCreateSplTokenAccount(
      payment.payee,
      mintAddress
    );

    if (!account) {
      throw AccountNotFoundError;
    }

    let instructions: TransactionInstruction[] = [];
    instructions.push(
      createTransferCheckedInstruction(
        account.address,
        mintPublicKey,
        account.address,
        payerPublicKey,
        payment.amount,
        9 // TODO: get decimals from mint
      )
    );

    const { blockhash } = await this.connection.getLatestBlockhash();

    const messageV0 = new TransactionMessage({
      payerKey: payerPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    const signature = await this.connection.sendTransaction(transaction, {
      maxRetries: 5,
    });

    const txn = await this.getTxn(signature, {
      maxTries: 20,
      waitMS: 1000,
    });

    if (txn?.meta?.err) {
      throw new Error(txn.meta.err.toString());
    }

    return { signature, txn };
  };
}
