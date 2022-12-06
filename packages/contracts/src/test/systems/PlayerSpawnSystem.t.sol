// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById, addressToEntity, getSystemAddressById } from "solecs/utils.sol";

// External

// Components
import { PlayerComponent, ID as PlayerComponentID } from "../../components/PlayerComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../../components/LastActionComponent.sol";
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";

import { PositionComponent, ID as PositionComponentID, Coord } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../../components/LengthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../../components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../../components/FirepowerComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../../components/LastActionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../../components/LastMoveComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";

// Systems
import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "../../systems/PlayerSpawnSystem.sol";
// Internal
import "../../libraries/LibVector.sol";
import "../../libraries/LibCombat.sol";
import "../../libraries/LibUtils.sol";
import "../../libraries/LibSpawn.sol";

import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { Side, Coord, Action, GameConfig, GodID } from "../../libraries/DSTypes.sol";

contract PlayerSpawnTest is MudTest {
  PlayerSpawnSystem playerSpawnSystem;

  function testSpawn() public prank(deployer) {
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
