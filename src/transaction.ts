import { DefaultError } from "./errors";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export default class Transaction {
  connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Request SOL airdrop to a wallet address
   *  @param walletAddressPublicKey receive airdrop
   * `it's run only on devnet or testnet!`
   */
  async solAirDrop(walletAddressPublicKey: PublicKey) {
    try {
      const response = await this.connection.requestAirdrop(
        walletAddressPublicKey,
        LAMPORTS_PER_SOL
      );
      return response;
    } catch {
      throw DefaultError;
    }
  }
}
