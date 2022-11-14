// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord, PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { CombatSystem, ID as CombatSystemID, Side } from "../../systems/CombatSystem.sol";

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

  function testGetSternLocation() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 45;
    uint32 length = 50;

    Coord memory sternLocation = LibPolygon.getSternLocation(startingPosition, rotation, length);

    Coord memory expectedLocation = Coord({ x: -35, y: 35 });
    assertCoordEq(sternLocation, expectedLocation);
  }

  function testGetShipSternAndAftLocation() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 50, 50);

    (Coord memory aft, Coord memory stern) = LibPolygon.getShipSternAndAftLocation(components, shipEntityId);

    assertCoordEq(startingPosition, aft);
    Coord memory expectedStern = Coord({ x: -35, y: 35 });
    assertCoordEq(stern, expectedStern);
  }

  function testFiringArea() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 0;

    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, 350, 50, 50);

    Coord[4] memory firingArea = combatSystem.getFiringArea(components, shipEntityId, Side.Right);

    Coord memory aft = Coord({ x: -49, y: 8 });
    Coord memory topCorner = Coord({ x: 0, y: -49 });
    Coord memory bottomCorner = Coord({ x: -66, y: -38 });

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(aft, firingArea[1]);
    assertCoordEq(topCorner, firingArea[2]);
    assertCoordEq(bottomCorner, firingArea[3]);
  }

  function testCombatSystem() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint32 range = 50;
    uint32 length = 50;
    uint256 attackerId = shipSpawnSystem.executeTyped(startingPosition, 350, 50, 50);

    startingPosition = Coord({ x: -25, y: -25 });
    uint256 defenderId = shipSpawnSystem.executeTyped(startingPosition, rotation, 50, 50);

    startingPosition = Coord({ x: 25, y: 25 });
    uint256 defender2Id = shipSpawnSystem.executeTyped(startingPosition, rotation, 50, 50);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 orig2Health = healthComponent.getValue(defender2Id);

    combatSystem.executeTyped(attackerId, Side.Right);

    uint32 newHealth = healthComponent.getValue(defenderId);
    assertEq(newHealth, origHealth - 1);

    newHealth = healthComponent.getValue(defender2Id);
    assertEq(newHealth, origHealth);
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
