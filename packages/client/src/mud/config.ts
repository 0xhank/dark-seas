import devChainSpec from "../../../contracts/chainSpec.dev.json";
import chainSpec from "../../../contracts/chainSpec.json";
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
const chainId = Number(params.get("chainId")) || devChainSpec.chainId;

export const config = {
  clock: {
    period: 1000,
    initialTime: 0,
    syncInterval: 5000,
  },
  provider: {
    jsonRpcUrl: params.get("rpc") ?? devChainSpec.rpc,
    wsRpcUrl: params.get("wsRpc") ?? devChainSpec.wsRpc,
    chainId,
  },
  privateKey: params.get("privateKey") ?? getBurnerWallet().privateKey,
  chainId,
  snapshotServiceUrl: params.get("snapshot") || undefined,
  faucetServiceUrl: params.get("faucet") || undefined,
  initialBlockNumber: Number(params.get("initialBlockNumber")) || 0,
  worldAddress: params.get("worldAddress") || "0x69",
  devMode: params.get("dev") === "true",
};

console.info(`Booting with network config:`);
console.info(config);
