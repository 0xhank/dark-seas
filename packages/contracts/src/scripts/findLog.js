"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLog = void 0;
function findLog(deployLogLines, log) {
    for (const logLine of deployLogLines) {
        if (logLine.includes(log)) {
            return logLine.split(log)[1].trim();
        }
    }
    throw new Error("Can not find log");
}
exports.findLog = findLog;
