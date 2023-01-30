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
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "../../components/BootyComponent.sol";

// Types
import { Coord } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";

contract PlayerSpawnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  PlayerSpawnSystem playerSpawnSystem;
  NameComponent nameComponent;

  function testRevertTooLate() public prank(deployer) {
    setup();

    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    vm.warp(gameConfig.startTime + gameConfig.entryCutoff);

    vm.expectRevert(bytes("PlayerSpawnSystem: entry period has ended"));
    playerSpawnSystem.executeTyped("Jamaican me crazy", Coord(1, 1));
  }

  function testSpawn() public prank(deployer) {
    setup();
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    uint256 playerEntity = addressToEntity(deployer);

    playerSpawnSystem.executeTyped("Jamaican me crazy", Coord(1, 1));

    (uint256[] memory entities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    assertEq(entities.length, 2, "incorrect number of ships");

    bool hasName = nameComponent.has(playerEntity);
    for (uint256 i = 0; i < entities.length; i++) {
      uint256 shipBooty = bootyComponent.getValue(entities[i]);

      assertEq(shipBooty, gameConfig.buyin);
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
