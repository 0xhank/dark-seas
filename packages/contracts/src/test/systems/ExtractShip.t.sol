// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../DarkSeasTest.t.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";

import { ExtractShipSystem, ID as ExtractShipSystemID } from "../../systems/ExtractShipSystem.sol";
import { SpawnPlayerSystem, ID as SpawnPlayerSystemID } from "../../systems/SpawnPlayerSystem.sol";
import { JoinGameSystem, ID as JoinGameSystemID } from "../../systems/JoinGameSystem.sol";

import { CurrentGameComponent, ID as CurrentGameComponentID } from "../../components/CurrentGameComponent.sol";

contract ExtractShipTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  function testExtractShip() public prank(deployer) {
    CurrentGameComponent currentGameComponent = CurrentGameComponent(
      LibUtils.addressById(world, CurrentGameComponentID)
    );
    ExtractShipSystem extractShipSystem = ExtractShipSystem(system(ExtractShipSystemID));
    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));

    JoinGameSystem joinGameSystem = JoinGameSystem(system(JoinGameSystemID));
    spawnPlayerSystem.executeTyped("Johnson");

    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(LibUtils.addressById(world, OwnedByComponentID)),
      abi.encode(addressToEntity(deployer))
    );

    uint256[] memory playerShips = LibQuery.query(fragments);

    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    uint256 gameId = abi.decode(id, (uint256));

    joinGameSystem.executeTyped(gameId, playerShips);
    uint256 shipToUse = playerShips[0];

    assertTrue(currentGameComponent.has(shipToUse));

    extractShipSystem.executeTyped(shipToUse);
    assertTrue(!currentGameComponent.has(shipToUse));
  }

  function testBulkExtractShip() public prank(deployer) {
    CurrentGameComponent currentGameComponent = CurrentGameComponent(
      LibUtils.addressById(world, CurrentGameComponentID)
    );
    ExtractShipSystem extractShipSystem = ExtractShipSystem(system(ExtractShipSystemID));
    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));

    JoinGameSystem joinGameSystem = JoinGameSystem(system(JoinGameSystemID));
    spawnPlayerSystem.executeTyped("Johnson");

    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(LibUtils.addressById(world, OwnedByComponentID)),
      abi.encode(addressToEntity(deployer))
    );

    uint256[] memory playerShips = LibQuery.query(fragments);

    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    uint256 gameId = abi.decode(id, (uint256));

    joinGameSystem.executeTyped(gameId, playerShips);

    for (uint i = 0; i < playerShips.length; i++) {
      assertTrue(currentGameComponent.has(playerShips[i]));
    }

    extractShipSystem.bulkExtract(playerShips);

    for (uint i = 0; i < playerShips.length; i++) {
      assertTrue(!currentGameComponent.has(playerShips[i]));
    }
  }
}
