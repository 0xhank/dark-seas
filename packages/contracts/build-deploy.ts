import { program } from "commander";
import { promises, readFileSync } from "fs";
import path from "path";
import deployData from "./deploy.json" assert { type: "json" };
export type Config = {
  commitPhaseLength: number;
  revealPhaseLength: number;
  actionPhaseLength: number;
  worldSize: number;
  perlinSeed: number;
  entryCutoffTurns: number;
  buyin: number;
  respawnAllowed: boolean;
  shrinkRate: number;
  budget: number;
  islandThreshold: number;
};
program.option("-c, --config <config>", "path to config file");

program.parse(process.argv);

const options = program.opts();
const inputConfig: Config | undefined = options.config
  ? JSON.parse(readFileSync(options.config).toString())
  : undefined;
const config = inputConfig || {
  commitPhaseLength: 25,
  revealPhaseLength: 9,
  actionPhaseLength: 25,
  worldSize: 120,
  perlinSeed: 69,
  entryCutoffTurns: 9,
  buyin: 0,
  respawnAllowed: false,
  shrinkRate: 0,
  budget: 5,
  islandThreshold: 33,
};
console.log("config: ", config);
await generateDeployJson(config, true);

export async function generateDeployJson(config: Config, toMain = false) {
  const initializerParam = `abi.encode(block.timestamp, ${config.commitPhaseLength}, ${config.revealPhaseLength}, ${config.actionPhaseLength}, ${config.worldSize}, ${config.perlinSeed}, ${config.entryCutoffTurns}, ${config.buyin}, ${config.respawnAllowed}, ${config.shrinkRate}, ${config.budget}, ${config.islandThreshold})`;

  const data = deployData.systems.find((system) => system.name == "InitSystem");
  if (data) data.initialize = initializerParam;
  const json = JSON.stringify(deployData, null, 2); // the second argument is a replacer function, the third argument is the number of spaces to use for indentation (optional)

  const fileName = toMain ? "." : path.join(`deployments`, Date.now().toString());
  await promises.mkdir(fileName, { recursive: true });

  await promises.writeFile(path.join(fileName, "deploy.json"), json);
  return fileName;
}
