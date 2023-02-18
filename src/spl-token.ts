import {
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
} from "@metaplex-foundation/js";
import {
  AccountLayout,
  createMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey, Signer } from "@solana/web3.js";
import { CreateTokenError } from "./errors";

export default class SplToken {
  connection: Connection;
  metaplex: Metaplex;

  constructor(connection: Connection) {
    this.connection = connection;
    this.metaplex = new Metaplex(connection);
  }

  /**
   * Create a new SPL token
   * @param payer payer wallet
   * @param mintAuthorityPublicKey mint authority public key
   * @param freezeAuthorityPublicKey freeze authority public key
   */
  async createToken(
    payer: Signer,
    mintAuthorityPublicKey: PublicKey,
    freezeAuthorityPublicKey: PublicKey
  ) {
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
  }

  /**
   * Find all SPL tokens by owner
   * @param address owner wallet address
   */
  async findAllSplTokens(address: string) {
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

      console.log(tokenMetadata);

      accounts[accountData.mint.toBase58()] = {
        amount: accountData.amount,
        name: tokenMetadata?.name || "Unknown",
        address: tokenAccount.pubkey.toBase58(),
        symbol: tokenMetadata?.symbol || "Unknown",
        image: tokenMetadata?.json?.image || null,
      };
    }

    return accounts;
  }

  async getOrCreateSplTokenAccount(signer: Signer, mintAddress: string) {
    const mintPublicKey = new PublicKey(mintAddress);
    const payerPublicKey = signer.publicKey;

    try {
      const response = await getOrCreateAssociatedTokenAccount(
        this.connection,
        signer,
        mintPublicKey,
        payerPublicKey
      );

      return response;
    } catch (e) {
      throw e;
    }
  }
}
