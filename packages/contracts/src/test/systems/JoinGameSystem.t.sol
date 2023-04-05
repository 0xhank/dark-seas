// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Systems
import { JoinGameSystem, ID as JoinGameSystemID } from "../../systems/JoinGameSystem.sol";

// Components
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Types
import { Coord, Phase, CannonPrototype } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";
import "../../libraries/LibCreateShip.sol";

contract JoinGameTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  JoinGameSystem joinGameSystem;
  NameComponent nameComponent;

  uint256[] shipPrototypes;

  function testRevertTooLate() public prank(deployer) {
    uint256 gameId = setup();

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    vm.warp(getTurnAndPhaseTime(world, gameId, gameConfig.entryCutoffTurns + 1, Phase.Commit));

    vm.expectRevert(bytes("JoinGameSystem: entry period has ended"));
    joinGameSystem.executeTyped(gameId, "Jamaican me crazy", shipPrototypes);
  }

  function testRevertTooExpensive() public prank(deployer) {
    uint256 gameId = setup();
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    uint32 budget = gameConfig.budget;
    uint256 encodedShip = createShipPrototype(budget + 1);

    shipPrototypes.push(encodedShip);

    vm.expectRevert(bytes("LibSpawn: ships too expensive"));
    joinGameSystem.executeTyped(gameId, "Jamaican me crazy", shipPrototypes);

    delete shipPrototypes;

    encodedShip = createShipPrototype(budget / 2);

    shipPrototypes.push(encodedShip);
    shipPrototypes.push(encodedShip);
    shipPrototypes.push(encodedShip);
    // vm.expectRevert(bytes("LibSpawn: ships too expensive"));
    // joinGameSystem.executeTyped(gameId, "Jamaican me crazy", shipPrototypes);
  }

  function testSpawn() public prank(deployer) {
    uint256 gameId = setup();

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );
    uint256 playerEntity = addressToEntity(deployer);

    uint256 encodedShip = createShipPrototype(1);

    shipPrototypes.push(encodedShip);
    joinGameSystem.executeTyped(gameId, "Jamaican me crazy", shipPrototypes);

    (uint256[] memory entities, ) = LibUtils.getEntityWith(world, ShipComponentID);

    assertEq(entities.length, shipPrototypes.length, "incorrect number of ships");

    bool hasName = nameComponent.has(playerEntity);

    assertTrue(hasName, "player name not stored");
    if (hasName) {
      string memory playerName = nameComponent.getValue(playerEntity);
      assertEq(playerName, "Jamaican me crazy");
    }
  }

  /**
   * Helpers
   */

  function setup() internal returns (uint256 gameId) {
    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    joinGameSystem = JoinGameSystem(system(JoinGameSystemID));
    nameComponent = NameComponent(LibUtils.addressById(world, NameComponentID));
    delete shipPrototypes;
  }
}
