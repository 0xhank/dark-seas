import { generateLibDeploy } from "@latticexyz/cli/dist/utils/deprecated/index.js";
import express from "express";
import { promises, readFileSync, rmSync } from "fs";
import path from "path";
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
    console.log("body:", req.body);
    const { dev, configData: data } = req.body;
    const start = Date.now();
    try {
        const dirName = await generateDeployJson(data);
        await generateLibDeploy(path.join(dirName, "deploy.json"), dirName);
        await promises.writeFile(path.join(dirName, "Deploy.sol"), deploysol);
        const deployResult = await deploy(dirName, dev ? devChainSpec.deployer : chainSpec.deployer, dev ? devChainSpec.rpc : chainSpec.rpc);
        rmSync(dirName, { recursive: true, force: true });
        const end = Date.now();
        console.log("time in seconds:", (end - start) / 1000);
        res.send(JSON.stringify({
            worldAddress: deployResult.deployedWorldAddress,
            blockNumber: deployResult.initialBlockNumber,
        }));
    }
    catch (e) {
        res.status(500).send(`Error: ${e}`);
        return;
    }
});
app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});
