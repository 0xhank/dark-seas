// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";

// Systems
import { JoinGameSystem, ID as JoinGameSystemID } from "../../systems/JoinGameSystem.sol";
import { SpawnPlayerSystem, ID as SpawnPlayerSystemID } from "../../systems/SpawnPlayerSystem.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { ID as ShipPrototypeComponentID } from "../../components/ShipPrototypeComponent.sol";
import { OwnerOfComponent, ID as OwnerOfComponentID } from "../../components/OwnerOfComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Types
import { Coord, Phase, CannonPrototype } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";
import "../../libraries/LibCreateShipPrototype.sol";

contract JoinGameTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  JoinGameSystem joinGameSystem;

  uint256[] shipPrototypes;

  function testRevertTooLate() public prank(deployer) {
    uint256 gameId = setup();
    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));
    spawnPlayerSystem.executeTyped("john cena");

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    vm.warp(getTurnAndPhaseTime(world, gameId, gameConfig.entryCutoffTurns + 1, Phase.Commit));

    vm.expectRevert(bytes("JoinGameSystem: entry period has ended"));
    joinGameSystem.executeTyped(gameId, shipPrototypes);
  }

  function testRevertTooExpensive() public prank(deployer) {
    console.log("sender address join game system", addressToEntity(deployer));
    uint256 gameId = setup();
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    OwnerOfComponent ownerOfComponent = OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID));

    uint32 budget = gameConfig.budget;
    uint256 encodedShip = createShipPrototype(budget + 1);

    shipPrototypes.push(encodedShip);
    uint256[] memory defaultShipEntities = new uint256[](1);
    defaultShipEntities[0] = encodedShip;
    ownerOfComponent.set(GodID, defaultShipEntities);

    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));
    spawnPlayerSystem.executeTyped("john cena");

    QueryFragment[] memory fragments = new QueryFragment[](1);

    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(LibUtils.addressById(world, OwnedByComponentID)),
      abi.encode(addressToEntity(deployer))
    );
    uint256[] memory playerShips = LibQuery.query(fragments);

    assertEq(playerShips.length, ownerOfComponent.getValue(GodID).length);

    vm.expectRevert(bytes("LibSpawn: ships too expensive"));
    joinGameSystem.executeTyped(gameId, playerShips);
  }

  function testSpawn() public prank(deployer) {
    uint256 gameId = setup();

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));
    spawnPlayerSystem.executeTyped("john cena");

    uint256 playerEntity = addressToEntity(deployer);

    QueryFragment[] memory fragments = new QueryFragment[](1);

    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(LibUtils.addressById(world, OwnedByComponentID)),
      abi.encode(addressToEntity(deployer))
    );
    uint256[] memory playerShips = LibQuery.query(fragments);

    console.log("player ships", playerShips.length);
    joinGameSystem.executeTyped(gameId, playerShips);

    uint256[] memory prototypeEntities = OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID)).getValue(
      GodID
    );
    console.log("prototype entities:", prototypeEntities.length);
    assertEq(prototypeEntities.length, playerShips.length, "incorrect number of ships");
  }

  /**
   * Helpers
   */

  function setup() internal returns (uint256 gameId) {
    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    joinGameSystem = JoinGameSystem(system(JoinGameSystemID));
    delete shipPrototypes;
  }
}
