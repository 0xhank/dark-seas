// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

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
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );
    NameComponent nameComponent = NameComponent(LibUtils.addressById(world, NameComponentID));
    uint256 playerEntity = addressToEntity(deployer);
    SpawnPlayerSystem spawnPlayerSystem = SpawnPlayerSystem(system(SpawnPlayerSystemID));
    spawnPlayerSystem.executeTyped("test");

    assertEq(nameComponent.getValue(playerEntity), "test");

    string memory encodedDefaultShipPrototypeEntities = shipPrototypeComponent.getValue(GodID);

    uint256[] memory defaultShipPrototypeEntities = abi.decode(bytes(encodedDefaultShipPrototypeEntities), (uint256[]));
    (uint256[] memory ownedEntities, ) = LibUtils.getEntityWith(world, OwnedByComponentID);

    assertEq(ownedEntities.length, defaultShipPrototypeEntities.length);

    for (uint256 i = 0; i < ownedEntities.length; i++) {
      string memory ownedEntity = shipPrototypeComponent.getValue(ownedEntities[i]);
      string memory defaultShipPrototypeEntity = shipPrototypeComponent.getValue(defaultShipPrototypeEntities[i]);
      assertEq(ownedEntity, defaultShipPrototypeEntity);
    }
  }

  function setup() internal {}
}
