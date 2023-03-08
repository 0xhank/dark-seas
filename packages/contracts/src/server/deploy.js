import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { findLog } from "@latticexyz/cli/dist/utils/deprecated/index.js";
import { constants, Wallet } from "ethers";
import { execa } from "execa";
import path from "path";
/**
 * Deploy world, components and systems from deploy.json
 * @param deployerPrivateKey private key of deployer
 * @param rpc rpc url
 * @param worldAddress optional, address of existing world
 * @param reuseComponents optional, reuse existing components
 * @returns address of deployed world
 */
export async function deploy(dir, deployerPrivateKey, rpc = "http://localhost:8545", worldAddress, reuseComponents, gasPrice) {
    const address = deployerPrivateKey ? new Wallet(deployerPrivateKey).address : constants.AddressZero;
    if (gasPrice == null) {
        try {
            console.log("Fetching gas price...");
            const provider = new StaticJsonRpcProvider(rpc, { name: "AnyNetwork", chainId: 1234 });
            gasPrice = (await provider.getGasPrice()).toNumber() * 1.3; // 30% multiplier for faster inclusion
            console.log("Gas price:", gasPrice);
        }
        catch (e) {
            console.log("Could not fetch gas price");
        }
    }
    console.log("dir:", dir);
    const child = execa("forge", [
        "script",
        path.join(dir, "/Deploy.sol"),
        "--target-contract",
        "Deploy",
        "-vvv",
        ...(!deployerPrivateKey ? [] : ["--broadcast", "--private-keys", deployerPrivateKey]),
        "--sig",
        "broadcastDeploy(address,address,bool)",
        address,
        worldAddress || constants.AddressZero,
        reuseComponents ? "true" : "false",
        "--fork-url",
        rpc,
        ...(gasPrice != null ? ["--with-gas-price", String(Math.round(gasPrice))] : []),
    ], { stdio: ["inherit", "pipe", "pipe"] });
    child.stderr?.on("data", (data) => console.log("stderr:", data.toString()));
    child.stdout?.on("data", (data) => console.log(data.toString()));
    // Extract world address from deploy script
    const lines = (await child).stdout?.split("\n");
    const deployedWorldAddress = findLog(lines, "world: address");
    const initialBlockNumber = findLog(lines, "initialBlockNumber: uint256");
    return { child: await child, deployedWorldAddress, initialBlockNumber };
}
