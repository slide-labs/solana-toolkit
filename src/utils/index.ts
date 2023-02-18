import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

export const convertSecretKeyToKeypair = (key: string) => {
  const secretKey = bs58.decode(key);

  return Keypair.fromSecretKey(secretKey);
};
