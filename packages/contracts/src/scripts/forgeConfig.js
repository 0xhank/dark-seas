"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutDirectory = exports.getTestDirectory = exports.getSrcDirectory = exports.getForgeConfig = void 0;
const execa_1 = require("execa");
/**
 * Get forge config as a parsed json object.
 */
async function getForgeConfig() {
    const { stdout } = await (0, execa_1.execa)("forge", ["config", "--json"], { stdio: ["inherit", "pipe", "pipe"] });
    return JSON.parse(stdout);
}
exports.getForgeConfig = getForgeConfig;
/**
 * Get the value of "src" from forge config.
 * The path to the contract sources relative to the root of the project.
 */
async function getSrcDirectory() {
    return (await getForgeConfig()).src;
}
exports.getSrcDirectory = getSrcDirectory;
/**
 * Get the value of "test" from forge config.
 * The path to the test contract sources relative to the root of the project.
 */
async function getTestDirectory() {
    return (await getForgeConfig()).test;
}
exports.getTestDirectory = getTestDirectory;
/**
 * Get the value of "out" from forge config.
 * The path to put contract artifacts in, relative to the root of the project.
 */
async function getOutDirectory() {
    return (await getForgeConfig()).out;
}
exports.getOutDirectory = getOutDirectory;
