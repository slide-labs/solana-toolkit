import {
  Option,
  MetaplexFileContent,
  MetaplexFileOptions,
  DateTime,
  CandyMachineV2EndSettings,
  CandyMachineV2HiddenSettings,
  CandyMachineV2WhitelistMintSettings,
  CandyMachineV2Gatekeeper,
  Creator,
  PublicKey,
} from "@metaplex-foundation/js";

export type NftFile = {
  image: MetaplexFileContent;
  fileName: string;
  nftName: string;
  options: MetaplexFileOptions;
};

export type NftMetaData = {
  json: MetaData;
  fileName: string;
};

export type MetaData = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  properties: { files: { uri: string; type: string }[] };
};

export type CandyMachineV2Config = {
  wallet: PublicKey;
  price: number;
  itemsAvailable: number;
  maxEditionSupply: number;
  tokenMint: Option<PublicKey>;
  sellerFeeBasisPoints: number;
  symbol: string;
  isMutable: boolean;
  retainAuthority: boolean;
  goLiveDate?: Option<DateTime>;
  endSettings?: Option<CandyMachineV2EndSettings>;
  hiddenSettings?: Option<CandyMachineV2HiddenSettings>;
  whitelistMintSettings?: Option<CandyMachineV2WhitelistMintSettings>;
  gatekeeper?: Option<CandyMachineV2Gatekeeper>;
  creators?: Creator[];
};
