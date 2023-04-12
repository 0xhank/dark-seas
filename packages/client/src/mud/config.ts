import devChainSpec from "../../../contracts/chainSpec.dev.json";
import chainSpec from "../../../contracts/chainSpec.json";
import { getBurnerWallet } from "./utils/getBurnerWallet";

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
// const dev = false;
export const getChainSpec = (): ChainSpec => {
  return dev ? devChainSpec : chainSpec;
};

const chainId = getChainSpec().chainId;

export const getNetworkConfig = ({ worldAddress, block }: { worldAddress?: string; block?: number }) => ({
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
  privateKey: getBurnerWallet().privateKey,
  chainId,
  snapshotServiceUrl: getChainSpec().snapshot,
  faucetServiceUrl: getChainSpec().faucet,
  initialBlockNumber: block || Number(import.meta.env.VITE_STARTING_BLOCK) || 0,
  worldAddress: worldAddress || (import.meta.env.VITE_WORLD_ADDRESS as string) || "0x69",
  devMode: dev,
  encoders: true,
});
