import { readFileSync, writeFile } from "fs";
import { program } from "commander";
import deployData from "./deploy.json" assert { type: "json" };

program
  .option("-c, --config <config>", "path to config file")
  .option("-cm, --commit <commitPhaseLength>", "commit phase length (seconds)")
  .option("-r, --reveal <revealPhaseLength>", "reveal phase length (seconds)")
  .option("-a, --action <actionPhaseLength>", "action phase length (seconds)")
  .option("-w, --worldsize <worldSize>", "action phase length (seconds)")
  .option("-p, --perlin <perlinSeed>", "perlin offset")
  .option(
    "-e, --entryCutoff <entryCutoffTurns>",
    "number of turns before entry is cut off and the world starts shrinking"
  )
  .option("-b, --buyin <buyin>", "buyin (currently not used)")
  .option("-rs, --respawn <respawnAllowed>", "respawn")
  .option(
    "-sh, --shrink <shrinkRate>",
    "after entry cuts off, the world will shrink at rate / 100 coordinates per second"
  )
  .option("-b, --budget <budget>", "amount of points players can spend on ships");

program.parse(process.argv);

const options = program.opts();
let config;

if (options.config) {
  const configStr = readFileSync(options.config);
  config = JSON.parse(configStr);
} else {
  config = {
    commitPhaseLength: options.commitPhaseLength || 25,
    revealPhaseLength: options.revealPhaseLength || 9,
    actionPhaseLength: options.actionPhaseLength || 9,
    worldSize: options.worldSize || 9,
    perlinSeed: options.perlinSeed || 9,
    entryCutoffTurns: options.entryCutoffTurns || 9,
    buyin: options.buyin || 9,
    respawnAllowed: options.respawnAllowed || 9,
    shrinkRate: options.shrink || 9,
    budget: options.budget || 9,
  };
}
const fileName = generateDeployJson(config);
console.log("new deployment script generated at ", fileName);

export function generateDeployJson(config) {
  const initializerParam = `abi.encode(block.timestamp, ${config.commitPhaseLength}, ${config.revealPhaseLength}, ${config.actionPhaseLength}, ${config.worldSize}, ${config.perlinSeed}, ${config.entryCutoffTurns}, ${config.buyin}, ${config.respawnAllowed}, ${config.shrinkRate}, ${config.budget})`;

  const data = deployData.systems.find((system) => system.name == "InitSystem");
  if (data) data.initialize = initializerParam;
  const json = JSON.stringify(deployData, null, 2); // the second argument is a replacer function, the third argument is the number of spaces to use for indentation (optional)

  const fileName = `deployments/deploy-${Date.now()}.json`;
  writeFile(fileName, json, (err) => {
    if (err) throw err;
    console.log("Data saved to file");
  });
  return fileName;
}
