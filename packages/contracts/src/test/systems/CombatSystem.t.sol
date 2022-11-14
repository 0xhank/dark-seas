// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord, PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { CombatSystem, ID as CombatSystemID } from "../../systems/CombatSystem.sol";

// Internal
import "../../libraries/LibPolygon.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract CombatSystemTest is MudTest {
  uint256 entityId;
  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  CombatSystem combatSystem;
  ShipSpawnSystem shipSpawnSystem;

  function testInRange() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    Coord memory endPosition = Coord({ x: 10, y: 0 });

    uint32 range = 9;
    bool inRange = LibPolygon.inRange(startingPosition, endPosition, range);
    assertTrue(!inRange, "9 within range");

    range = 11;
    inRange = LibPolygon.inRange(startingPosition, endPosition, range);
    assertTrue(inRange, "11 out of range");

    endPosition = Coord({ x: 3, y: 6 });
    range = 6;
    inRange = LibPolygon.inRange(startingPosition, endPosition, range);
    assertTrue(!inRange, "6 within range");

    range = 7;
    inRange = LibPolygon.inRange(startingPosition, endPosition, range);
    assertTrue(inRange, "7 out of range");
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    combatSystem = CombatSystem(system(CombatSystemID));
    entityId = addressToEntity(deployer);
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
  }
}
