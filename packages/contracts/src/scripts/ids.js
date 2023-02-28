"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keccak256 = exports.extractIdFromFile = exports.IDregex = void 0;
const utils_1 = require("ethers/lib/utils");
const fs_1 = require("fs");
exports.IDregex = new RegExp(/(?<=uint256 constant ID = uint256\(keccak256\(")(.*)(?="\))/);
function extractIdFromFile(path) {
    const content = (0, fs_1.readFileSync)(path).toString();
    const regexResult = exports.IDregex.exec(content);
    return regexResult && regexResult[0];
}
exports.extractIdFromFile = extractIdFromFile;
function keccak256(data) {
    return (0, utils_1.keccak256)((0, utils_1.toUtf8Bytes)(data));
}
exports.keccak256 = keccak256;
