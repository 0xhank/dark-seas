// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Systems
import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "../../systems/PlayerSpawnSystem.sol";

// Components
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";

// Types
import { Coord } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";

contract PlayerSpawnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  PlayerSpawnSystem playerSpawnSystem;
  NameComponent nameComponent;

  function testSpawn() public prank(deployer) {
    setup();

    uint256 playerEntity = addressToEntity(deployer);

    console.log("player entity in spawn test:", playerEntity);
    console.log("msg sender in spawn test:", msg.sender);
    console.log("deployer in spawn test:", deployer);
    playerSpawnSystem.executeTyped("Jamaican me crazy", Coord(1, 1));

    (uint256[] memory entities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    assertEq(entities.length, 2, "incorrect number of ships");

    bool hasName = nameComponent.has(playerEntity);

    (entities, ) = LibUtils.getEntityWith(components, NameComponentID);
    for (uint256 i = 0; i < entities.length; i++) {
      console.log("i:", entities[i]);
    }

    assertTrue(hasName, "player name not stored");
    if (hasName) {
      string memory playerName = nameComponent.getValue(playerEntity);
      assertEq(playerName, "Jamaican me crazy");
    }
  }

  /**
   * Helpers
   */

  function setup() internal {
    playerSpawnSystem = PlayerSpawnSystem(system(PlayerSpawnSystemID));
    nameComponent = NameComponent(getAddressById(components, NameComponentID));
  }
}
