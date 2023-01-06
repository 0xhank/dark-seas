// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import { Deploy } from "./Deploy.sol";
import { DarkSeasTest } from "./DarkSeasTest.t.sol";
import { console } from "forge-std/console.sol";

contract DeployTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  function testDeploy() public view {
    console.log("Deployer");
    console.log(deployer);
  }
}
