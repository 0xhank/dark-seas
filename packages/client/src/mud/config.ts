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

const dev = window.location.href.includes("localhost");
const spec = dev ? devChainSpec : chainSpec;
export const getChainSpec = (): ChainSpec => {
  return dev ? devChainSpec : chainSpec;
};

const chainId = getChainSpec().chainId;
const params = new URLSearchParams(window.location.search);

export const config = {
  clock: {
    period: 1000,
    initialTime: 0,
    syncInterval: 5000,
  },
  provider: {
    jsonRpcUrl: getChainSpec().rpc,
    wsRpcUrl: getChainSpec().wsRpc,
    chainId,
  },
  privateKey: params.get("privateKey") ?? getBurnerWallet().privateKey,
  chainId,
  snapshotServiceUrl: getChainSpec().snapshot,
  faucetServiceUrl: getChainSpec().faucet,
  initialBlockNumber: Number(params.get("block")) || 0,
  worldAddress: params.get("worldAddress") || "0x69",
  devMode: dev,
  encoders: true,
};

console.info(`Booting with network config:`);
console.info(config);
