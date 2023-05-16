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
  createMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
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

    if (identity?.keypair) {
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

    if (!this.keypair) throw new Error("Keypair is not defined");

    const response = getOrCreateAssociatedTokenAccount(
      this.connection,
      this.keypair,
      mintPublicKey,
      payerPublicKey
    );

    return response;
  };
}
