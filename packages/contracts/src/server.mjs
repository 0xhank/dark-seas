import express from "express";
import json from "body-parser";
import { generateDeployJson } from "../build-deploy.mjs";
import { generateAndDeploy } from "./scripts/deploy.js";
import devChainSpec from "../chainSpec.dev.json" assert { type: "json" };
import chainSpec from "../chainSpec.json" assert { type: "json" };
const app = express();
const port = 3001;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(json());

app.get("/", function (req, res) {
  res.send({ response: "Hello World!" });
});

app.post("/deploy", async function (req, res) {
  const data = req.body;

  // 1. generate a deploy.json file based on the config provided with a unique identifier
  const fileName = generateDeployJson(data);
  console.log(fileName);
  const dev = req.url.includes("localhost");
  console.log("dev:", dev);
  // 2. deploy a new world using the deploy.json file as the config

  try {
    genDeployResult = await generateAndDeploy({
      config: fileName,
      rpc: dev ? devChainSpec.rpc : chainSpec.rpc,
      deployerPrivateKey: dev ? undefined : "0x26e86e45f6fc45ec6e2ecd128cec80fa1d1505e5507dcd2ae58c3130a7a97b48",
    });
  } catch (e) {
    console.log("error:", e);
  }
  // 3. return the corresponding world address and blocknumber resulting from deployment

  res.send(JSON.stringify({ worldAddress: 69, blockNumber: 420 }));
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
