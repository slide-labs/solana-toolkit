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

  constructor(connection: Connection) {
    this.connection = connection;
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
  async findAllSplTokensBalance(address: string) {
    try {
      const account = new PublicKey(address);

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        account,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      const accounts: Record<string, bigint> = {};
      tokenAccounts.value.forEach(async (tokenAccount) => {
        const accountData = AccountLayout.decode(tokenAccount.account.data);
        accounts[accountData.mint.toBase58()] = accountData.amount;
      });

      return accounts;
    } catch (e) {
      throw e;
    }
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

  sendToken() {}
}
