import { createMint } from "@solana/spl-token";
import { Connection, PublicKey, Signer } from "@solana/web3.js";
import { CreateTokenError } from "./errors";

export default class SplToken {
  connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Create a new SPL token
   * 
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
      return CreateTokenError;
    }
  }

  sendToken() {}
}
