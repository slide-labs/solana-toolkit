import {
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  WalletAdapter,
} from "@metaplex-foundation/js";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

export default class NFT {
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
   * Find all NFT's
   * @param address owner wallet address
   */
  findAllNfts = async (address: string) => {
    const account = new PublicKey(address);

    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      account,
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );

    const nfts: Record<string, Nft | NftWithToken> = {};

    for (let i = 0; i < tokenAccounts.value.length; i++) {
      const tokenAccount = tokenAccounts.value[i];

      const accountData = AccountLayout.decode(tokenAccount.account.data);
      let tokenMetadata: Sft | Nft | null = null;

      try {
        tokenMetadata = await this.metaplex.nfts().findByMint({
          mintAddress: new PublicKey(accountData.mint),
        });
      } catch {}

      if (tokenMetadata?.model === "sft" || !tokenMetadata) continue;

      nfts[accountData.mint.toBase58()] = tokenMetadata;
    }

    return nfts;
  };
}
