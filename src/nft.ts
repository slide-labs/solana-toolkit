import { Metaplex, Nft, Sft, WalletAdapter } from "@metaplex-foundation/js";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import axios from "axios";

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

    if (identity?.keypair) {
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

    const nfts: Record<string, NftToken> = {};

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

      const downloadMetadata = await axios(tokenMetadata.uri).then(
        (res) => res
      );

      nfts[accountData.mint.toBase58()] = {
        ...tokenMetadata,
        metadata: downloadMetadata ? { ...downloadMetadata.data } : null,
      };
    }

    return nfts;
  };
}

//
// Utils
//

interface NftToken extends Nft {
  metadata: object | null;
}
