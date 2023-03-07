import { generateLibDeploy } from "@latticexyz/cli/dist/utils/deprecated/index.js";
import express from "express";
import { readFileSync, rmSync, writeFile } from "fs";
import { generateDeployJson } from "../../build-deploy.js";
import devChainSpec from "../../chainSpec.dev.json" assert { type: "json" };
import chainSpec from "../../chainSpec.json" assert { type: "json" };
import { deploy } from "./deploy.js";
const app = express();
const port = 3001;
const deploysol = readFileSync("./Deploy.sol");
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});
app.use(express.json());
app.get("/", function (req, res) {
    res.send({ response: "Hello World!" });
});
app.post("/deploy", async function (req, res) {
    const data = req.body;
    console.log("in deploy");
    // 1. generate a deploy.json file based on the config provided with a unique identifier
    const fileName = await generateDeployJson(data);
    console.log("file name:", fileName);
    // 2. deploy a new world using the deploy.json file as the config
    const dev = true;
    try {
        const libDeployPath = await generateLibDeploy(`${fileName}/deploy.json`, fileName);
        writeFile(`${fileName}/Deploy.sol`, deploysol, function (err) {
            console.log("err:", err);
        });
        const deployResult = await deploy(fileName, dev ? undefined : "0x26e86e45f6fc45ec6e2ecd128cec80fa1d1505e5507dcd2ae58c3130a7a97b48", dev ? devChainSpec.rpc : chainSpec.rpc);
        rmSync(fileName, { recursive: true, force: true });
        res.send(JSON.stringify({
            worldAddress: deployResult.deployedWorldAddress,
            blockNumber: deployResult.initialBlockNumber,
        }));
    }
    catch (e) {
        console.log("error:", e);
    }
    // 3. return the corresponding world address and blocknumber resulting from deployment
});
app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});
