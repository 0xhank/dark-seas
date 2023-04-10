// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../DarkSeasTest.t.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";

import { PurchaseShipSystem, ID as PurchaseShipSystemID } from "../../systems/PurchaseShipSystem.sol";
import { SpawnPlayerSystem, ID as SpawnPlayerSystemID } from "../../systems/SpawnPlayerSystem.sol";

import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../../components/ShipPrototypeComponent.sol";

contract PurchaseShipTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  function testPurchaseShip() public prank(deployer) {
    PurchaseShipSystem purchaseShipSystem = PurchaseShipSystem(system(PurchaseShipSystemID));
    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));
    spawnPlayerSystem.executeTyped("Johnson");

    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(
      QueryType.HasValue,
      IComponent(LibUtils.addressById(world, OwnedByComponentID)),
      abi.encode(addressToEntity(deployer))
    );
    (uint256[] memory shipPrototypes, ) = LibUtils.getEntityWith(world, ShipPrototypeComponentID);

    uint256[] memory prevPlayerShips = LibQuery.query(fragments);
    purchaseShipSystem.executeTyped(shipPrototypes[0]);

    uint256[] memory playerShips = LibQuery.query(fragments);

    uint256[] memory defaultShipPrototypeEntities = OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID))
      .getValue(GodID);

    assertEq(
      defaultShipPrototypeEntities.length + 1,
      playerShips.length,
      "player ships do not match default entities plus one"
    );
    assertEq(prevPlayerShips.length + 1, playerShips.length, "player ships do not match prev ships plus one");
  }
}
