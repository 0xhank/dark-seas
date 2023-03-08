import { program } from "commander";
import { promises, readFileSync } from "fs";
import path from "path";
import deployData from "./deploy.json" assert { type: "json" };
program.option("-c, --config <config>", "path to config file");
program.parse(process.argv);
const options = program.opts();
const inputConfig = options.config
    ? JSON.parse(readFileSync(options.config).toString())
    : undefined;
const config = {
    commitPhaseLength: inputConfig?.commitPhaseLength || 25,
    revealPhaseLength: inputConfig?.revealPhaseLength || 9,
    actionPhaseLength: inputConfig?.actionPhaseLength || 9,
    worldSize: inputConfig?.worldSize || 9,
    perlinSeed: inputConfig?.perlinSeed || 9,
    entryCutoffTurns: inputConfig?.entryCutoffTurns || 9,
    buyin: inputConfig?.buyin || 9,
    respawnAllowed: inputConfig?.respawnAllowed || false,
    shrinkRate: inputConfig?.shrinkRate || 9,
    budget: inputConfig?.budget || 9,
};
console.log("config: ", config);
await generateDeployJson(config, true);
export async function generateDeployJson(config, toMain = false) {
    const initializerParam = `abi.encode(block.timestamp, ${config.commitPhaseLength}, ${config.revealPhaseLength}, ${config.actionPhaseLength}, ${config.worldSize}, ${config.perlinSeed}, ${config.entryCutoffTurns}, ${config.buyin}, ${config.respawnAllowed}, ${config.shrinkRate}, ${config.budget})`;
    const data = deployData.systems.find((system) => system.name == "InitSystem");
    if (data)
        data.initialize = initializerParam;
    const json = JSON.stringify(deployData, null, 2); // the second argument is a replacer function, the third argument is the number of spaces to use for indentation (optional)
    const fileName = toMain ? "." : path.join(`deployments`, Date.now().toString());
    await promises.mkdir(fileName, { recursive: true });
    await promises.writeFile(path.join(fileName, "deploy.json"), json);
    return fileName;
}
