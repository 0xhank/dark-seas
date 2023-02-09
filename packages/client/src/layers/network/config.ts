import devChainSpec from "../../../../contracts/chainSpec.dev.json";
import chainSpec from "../../../../contracts/chainSpec.json";
import { getBurnerWallet } from "./getBurnerWallet";

export type ChainSpec = {
  dev: boolean;

  rpc: string;
  wsRpc: string;

  chainBlockTime: number;
  chainGasLimit: number;
  chainId: number;

  faucet?: string;
  snapshot?: string;
  stream?: string;
};

export const getChainSpec = (): ChainSpec => {
  return params.get("dev") === "true" ? devChainSpec : chainSpec;
};

const params = new URLSearchParams(window.location.search);
const chainId = Number(params.get("chainId")) || chainSpec.chainId;

export const config = {
  clock: {
    period: 1000,
    initialTime: 0,
    syncInterval: 5000,
  },
  provider: {
    jsonRpcUrl: params.get("rpc") ?? chainSpec.rpc,
    wsRpcUrl: params.get("wsRpc") ?? chainSpec.wsRpc,
    chainId,
  },
  privateKey: params.get("privateKey") ?? getBurnerWallet().privateKey,
  chainId,
  snapshotServiceUrl: params.get("snapshot") ?? chainSpec.snapshot,
  faucetServiceUrl: params.get("faucet") ?? chainSpec.faucet,
  initialBlockNumber: Number(params.get("initialBlockNumber")) ?? 12193,
  worldAddress: params.get("worldAddress") ?? "0x4A4D6B2425433Da5a2f7AD75f0a91500420b9D5B",
  devMode: params.get("dev") === "true",
  gameHostname: chainId === 31337 ? "http://localhost:3000" : "https://skystrife.xyz",
};

console.info(`Booting with network config:`);
console.info(config);
