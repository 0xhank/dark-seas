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
import { Coord, Phase, CannonPrototype } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";
import "../../libraries/LibCreateShip.sol";

contract PlayerSpawnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  PlayerSpawnSystem playerSpawnSystem;
  NameComponent nameComponent;

  uint256[] shipPrototypes;

  function testRevertTooLate() public prank(deployer) {
    setup();

    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    vm.warp(LibTurn.getTurnAndPhaseTime(components, gameConfig.entryCutoffTurns + 1, Phase.Commit));

    vm.expectRevert(bytes("PlayerSpawnSystem: entry period has ended"));
    playerSpawnSystem.executeTyped("Jamaican me crazy", shipPrototypes);
  }

  function testRevertTooExpensive() public prank(deployer) {
    setup();
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    uint32 budget = gameConfig.budget;
    uint256 encodedShip = createShipPrototype(budget + 1);

    shipPrototypes.push(encodedShip);

    vm.expectRevert(bytes("LibSpawn: ships too expensive"));
    playerSpawnSystem.executeTyped("Jamaican me crazy", shipPrototypes);

    delete shipPrototypes;

    encodedShip = createShipPrototype(budget / 2);

    shipPrototypes.push(encodedShip);
    shipPrototypes.push(encodedShip);
    shipPrototypes.push(encodedShip);
    vm.expectRevert(bytes("LibSpawn: ships too expensive"));
    playerSpawnSystem.executeTyped("Jamaican me crazy", shipPrototypes);
  }

  function testSpawn() public prank(deployer) {
    setup();

    console.log("msg.sender: ", msg.sender);
    console.log("deployer: ", deployer);
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    uint256 playerEntity = addressToEntity(deployer);

    uint256 encodedShip = createShipPrototype(1);

    shipPrototypes.push(encodedShip);
    playerSpawnSystem.executeTyped("Jamaican me crazy", shipPrototypes);

    (uint256[] memory entities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    assertEq(entities.length, shipPrototypes.length, "incorrect number of ships");

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
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));
    GameConfig memory gameConfig = gameConfigComponent.getValue(GodID);
    gameConfig.respawnAllowed = true;

    gameConfigComponent.set(GodID, gameConfig);
    delete shipPrototypes;
  }
}
