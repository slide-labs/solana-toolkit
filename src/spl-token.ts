import {
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
  WalletAdapter,
} from "@metaplex-foundation/js";
import {
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction as SolanaTransaction,
} from "@solana/web3.js";
import Transaction from "./transaction";
import { CreateTokenError } from "./errors";
import axios from "axios";

export default class SplToken {
  connection: Connection;
  metaplex: Metaplex;
  wallet?: WalletAdapter;
  keypair?: Keypair;

  constructor(
    connection: Connection,
    identity?: {
      wallet?: WalletAdapter;
      keypair?: Keypair;
    }
  ) {
    this.connection = connection;
    this.metaplex = new Metaplex(connection);

    if (identity?.wallet) {
      this.wallet = identity.wallet;
    }

    if (identity?.keypair && !identity?.wallet) {
      this.keypair = identity.keypair;
    }
  }

  /**
   * Create a new SPL token
   * @param payer payer wallet
   * @param mintAuthorityPublicKey mint authority public key
   * @param freezeAuthorityPublicKey freeze authority public key
   */
  createToken = async (
    payer: Signer,
    mintAuthorityPublicKey: PublicKey,
    freezeAuthorityPublicKey: PublicKey
  ) => {
    try {
      const mint = await createMint(
        this.connection,
        payer,
        mintAuthorityPublicKey,
        freezeAuthorityPublicKey,
        9
      );
      return mint;
    } catch {
      throw CreateTokenError;
    }
  };

  /**
   * Find all SPL tokens by owner
   * @param address owner wallet address
   */
  findAllSplTokens = async (address: string) => {
    const account = new PublicKey(address);

    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      account,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    const accounts: Record<
      string,
      {
        amount: bigint;
        name: string;
        address: string;
        symbol: string;
        image?: string | null;
        uri?: string | null;
        downloadMetadata?: object;
      }
    > = {};

    for (let i = 0; i < tokenAccounts.value.length; i++) {
      const tokenAccount = tokenAccounts.value[i];

      const accountData = AccountLayout.decode(tokenAccount.account.data);
      let tokenMetadata: Sft | SftWithToken | Nft | NftWithToken | null = null;

      try {
        tokenMetadata = await this.metaplex.nfts().findByMint({
          mintAddress: new PublicKey(accountData.mint),
        });
      } catch {}

      if (tokenMetadata?.model === "nft") continue;

      let downloadMetadata;
      if (tokenMetadata && tokenMetadata.uri) {
        downloadMetadata = await axios(tokenMetadata.uri).then((res) => res);
      }

      accounts[accountData.mint.toBase58()] = {
        amount: accountData.amount,
        name: tokenMetadata?.name || "Unknown",
        address: tokenAccount.pubkey.toBase58(),
        symbol: tokenMetadata?.symbol || "Unknown",
        image: tokenMetadata?.json?.image || null,
        uri: tokenMetadata?.uri || null,
        downloadMetadata: downloadMetadata?.data || null,
      };
    }

    return accounts;
  };

  getOrCreateSplTokenAccount = async (
    walletAddres: string,
    mintAddress: string
  ) => {
    const mintPublicKey = new PublicKey(mintAddress);
    const payerPublicKey = new PublicKey(walletAddres);

    try {
      const { account, associatedToken } = await this.getSplTokenAccount(
        mintAddress,
        mintAddress
      );

      if (account) {
        return { account };
      }

      const transaction = new SolanaTransaction().add(
        createAssociatedTokenAccountInstruction(
          payerPublicKey,
          associatedToken,
          payerPublicKey,
          mintPublicKey
        )
      );

      const { blockhash } = await this.connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = payerPublicKey;

      if (this.wallet?.signTransaction) {
        await this.wallet.signTransaction(transaction);
      }

      if (this.keypair) {
        transaction.sign(this.keypair);
      }

      const signature = await this.connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: true,
          maxRetries: 5,
        }
      );

      const { getTxn } = new Transaction(this.connection, {
        wallet: this.wallet,
        keypair: this.keypair,
      });

      const txn = await getTxn(signature);

      if (txn?.meta?.err) {
        throw new Error(txn.meta.err.toString());
      }

      const { account: acc } = await this.getSplTokenAccount(
        mintAddress,
        mintAddress
      );

      return { signature, txn, account: acc };
    } catch (e) {
      throw e;
    }
  };

  getSplTokenAccount = async (walletAddres: string, mintAddress: string) => {
    const mintPublicKey = new PublicKey(mintAddress);
    const payerPublicKey = new PublicKey(walletAddres);

    const associatedToken = getAssociatedTokenAddressSync(
      mintPublicKey,
      payerPublicKey
    );

    const account = await getAccount(this.connection, associatedToken);

    if (!account) return { account: null, associatedToken };

    return { account, associatedToken };
  };
}
