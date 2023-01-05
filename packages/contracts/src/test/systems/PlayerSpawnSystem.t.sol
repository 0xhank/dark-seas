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

  function testSpawn() public {
    setup();
    NameComponent nameComponent = NameComponent(getAddressById(components, NameComponentID));

    playerSpawnSystem.executeTyped("Jamaican me crazy", Coord(1, 1));

    (uint256[] memory entities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    assertEq(entities.length, 3);

    uint256 playerEntity = addressToEntity(deployer);

    assertTrue(nameComponent.has(playerEntity));
    string memory playerName = nameComponent.getValue(playerEntity);
    assertEq(playerName, "Jamaican me crazy");
  }

  /**
   * Helpers
   */

  function setup() internal {
    playerSpawnSystem = PlayerSpawnSystem(system(PlayerSpawnSystemID));
  }
}
