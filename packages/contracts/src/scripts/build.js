"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAbi = exports.forgeBuild = void 0;
const execa_1 = require("execa");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const forgeConfig_1 = require("./forgeConfig");
async function forgeBuild(options) {
    if (options?.clear) {
        const out = await (0, forgeConfig_1.getOutDirectory)();
        console.log("Clearing forge build output directory", out);
        (0, fs_1.rmSync)(out, { recursive: true, force: true });
    }
    console.log("Running forge build");
    const child = (0, execa_1.execa)("forge", ["build"], {
        stdio: ["inherit", "pipe", "inherit"],
    });
    return (await child).stdout;
}
exports.forgeBuild = forgeBuild;
function getContractsInDirectory(dir, exclude) {
    return (0, fs_1.readdirSync)(dir)
        .filter((item) => item.includes(".sol"))
        .map((item) => item.replace(".sol", ""))
        .filter((item) => !exclude?.includes(item));
}
function copyAbi(inDir, outDir, contract) {
    try {
        return (0, fs_1.copyFileSync)(path_1.default.join(inDir, contract + ".sol", contract + ".json"), path_1.default.join(outDir, contract + ".json"));
    }
    catch (e) {
        console.log("Skipping", contract);
    }
}
function filterAbi(abiIn = "./out", abiOut = "./abi", exclude = ["Component", "IComponent"]) {
    // Clean our dir
    console.log(`Cleaning output directory (${abiOut}})`);
    (0, fs_1.rmSync)(abiOut, { recursive: true, force: true });
    (0, fs_1.mkdirSync)(abiOut);
    // Only include World, LibQuery, *Component, *System
    const include = ["Component", "System", "World", "LibQuery"];
    const contracts = getContractsInDirectory(abiIn, exclude).filter((item) => include.find((i) => item.includes(i)));
    console.log("Selected ABIs: ", contracts);
    // Move selected ABIs to ./abi
    for (const contract of contracts) {
        if (contract.includes(".t"))
            continue;
        copyAbi(abiIn, abiOut, contract);
    }
    console.log("Successfully moved selected ABIs to ./abi");
}
exports.filterAbi = filterAbi;
