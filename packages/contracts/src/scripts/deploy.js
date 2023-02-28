"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndDeploy = exports.deploy = void 0;
const ethers_1 = require("ethers");
const codegen_1 = require("./codegen");
const findLog_1 = require("./findLog");
const types_1 = require("./types");
const execa_1 = require("execa");
const providers_1 = require("@ethersproject/providers");
const contractsDir = __dirname + "/../../src/contracts";
/**
 * Deploy world, components and systems from deploy.json
 * @param deployerPrivateKey private key of deployer
 * @param rpc rpc url
 * @param worldAddress optional, address of existing world
 * @param reuseComponents optional, reuse existing components
 * @returns address of deployed world
 */
async function deploy(deployerPrivateKey, rpc = "http://localhost:8545", worldAddress, reuseComponents, gasPrice) {
    const address = deployerPrivateKey ? new ethers_1.Wallet(deployerPrivateKey).address : ethers_1.constants.AddressZero;
    if (gasPrice == null) {
        try {
            console.log("Fetching gas price...");
            const provider = new providers_1.StaticJsonRpcProvider(rpc, { name: "AnyNetwork", chainId: 1234 });
            gasPrice = (await provider.getGasPrice()).toNumber() * 1.3; // 30% multiplier for faster inclusion
            console.log("Gas price:", gasPrice);
        }
        catch (e) {
            console.log("Could not fetch gas price");
        }
    }
    const child = (0, execa_1.execa)("forge", [
        "script",
        contractsDir + "/Deploy.sol",
        "--target-contract",
        "Deploy",
        "-vvv",
        ...(!deployerPrivateKey ? [] : ["--broadcast", "--private-keys", deployerPrivateKey]),
        "--sig",
        "broadcastDeploy(address,address,bool)",
        address,
        worldAddress || ethers_1.constants.AddressZero,
        reuseComponents ? "true" : "false",
        "--fork-url",
        rpc,
        ...(gasPrice != null ? ["--with-gas-price", String(Math.round(gasPrice))] : []),
    ], { stdio: ["inherit", "pipe", "pipe"] });
    child.stderr?.on("data", (data) => console.log("stderr:", data.toString()));
    child.stdout?.on("data", (data) => console.log(data.toString()));
    // Extract world address from deploy script
    const lines = (await child).stdout?.split("\n");
    const deployedWorldAddress = (0, findLog_1.findLog)(lines, "world: address");
    const initialBlockNumber = (0, findLog_1.findLog)(lines, "initialBlockNumber: uint256");
    return { child: await child, deployedWorldAddress, initialBlockNumber };
}
exports.deploy = deploy;
async function generateAndDeploy(args) {
    let libDeployPath;
    let deployedWorldAddress;
    let initialBlockNumber;
    try {
        // Generate LibDeploy
        libDeployPath = await (0, codegen_1.generateLibDeploy)(args.config, contractsDir, args.systems);
        // Build and generate fresh types
        await (0, types_1.generateTypes)(undefined, "./types", { clear: args.clear });
        // Call deploy script
        const result = await deploy(args.deployerPrivateKey, args.rpc, args.worldAddress, Boolean(args.reuseComponents), args.gasPrice);
        deployedWorldAddress = result.deployedWorldAddress;
        initialBlockNumber = result.initialBlockNumber;
    }
    finally {
        // Remove generated LibDeploy
        console.log("Cleaning up deployment script");
        if (libDeployPath)
            await (0, codegen_1.resetLibDeploy)(contractsDir);
    }
    return { deployedWorldAddress, initialBlockNumber };
}
exports.generateAndDeploy = generateAndDeploy;
