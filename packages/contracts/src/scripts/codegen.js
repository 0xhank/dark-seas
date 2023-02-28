"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetLibDeploy = exports.generateLibDeploy = void 0;
const ejs_1 = __importDefault(require("ejs"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const contractsDir = path_1.default.join(__dirname, "");
const stubLibDeploy = (0, promises_1.readFile)(path_1.default.join(contractsDir, "LibDeployStub.sol"));
/**
 * Generate LibDeploy.sol from deploy.json
 * @param configPath path to deploy.json
 * @param out output directory for LibDeploy.sol
 * @param systems optional, only generate deploy code for the given systems
 * @returns path to generated LibDeploy.sol
 */
async function generateLibDeploy(configPath, out, systems) {
    // Parse config
    const config = JSON.parse(await (0, promises_1.readFile)(configPath, { encoding: "utf8" }));
    // Initializers are optional
    config.initializers ?? (config.initializers = []);
    // Filter systems
    if (systems) {
        const systemsArray = Array.isArray(systems) ? systems : [systems];
        config.systems = config.systems.filter((system) => systemsArray.includes(system.name));
    }
    console.log(`Deploy config: \n`, JSON.stringify(config, null, 2));
    // Generate LibDeploy
    console.log("Generating deployment script");
    const LibDeploy = await ejs_1.default.renderFile(path_1.default.join(contractsDir, "LibDeploy.ejs"), config, { async: true });
    const libDeployPath = path_1.default.join(out, "LibDeploy.sol");
    await (0, promises_1.writeFile)(libDeployPath, LibDeploy);
    return libDeployPath;
}
exports.generateLibDeploy = generateLibDeploy;
async function resetLibDeploy(out) {
    await (0, promises_1.writeFile)(path_1.default.join(out, "LibDeploy.sol"), await stubLibDeploy);
}
exports.resetLibDeploy = resetLibDeploy;
