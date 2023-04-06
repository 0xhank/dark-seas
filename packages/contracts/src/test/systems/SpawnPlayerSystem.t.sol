// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";

// Components
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";
import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../../components/ShipPrototypeComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";

// Systems
import { SpawnPlayerSystem, ID as SpawnPlayerSystemID } from "../../systems/SpawnPlayerSystem.sol";

// Types
import { GodID } from "../../libraries/DSTypes.sol";

// Libs
import { LibUtils } from "../../libraries/LibUtils.sol";

contract SpawnPlayerSystemTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  function testSpawnPlayer() public prank(deployer) {
    setup();
    NameComponent nameComponent = NameComponent(LibUtils.addressById(world, NameComponentID));
    uint256 playerEntity = addressToEntity(deployer);
    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));
    spawnPlayerSystem.executeTyped("test");

    assertEq(nameComponent.getValue(playerEntity), "test");

    uint256[] memory defaultShipPrototypeEntities = OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID))
      .getValue(GodID);

    QueryFragment[] memory fragments = new QueryFragment[](1);

    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(LibUtils.addressById(world, OwnedByComponentID)),
      abi.encode(addressToEntity(deployer))
    );
    uint256[] memory playerShips = LibQuery.query(fragments);

    assertEq(playerShips.length, defaultShipPrototypeEntities.length);
  }

  function setup() internal {}
}
