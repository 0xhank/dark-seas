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
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";

// Internal
import "../../libraries/LibVector.sol";
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
    bool inRange = LibVector.inRange(startingPosition, endPosition, range);
    assertTrue(!inRange, "9 within range");

    range = 11;
    inRange = LibVector.inRange(startingPosition, endPosition, range);
    assertTrue(inRange, "11 out of range");

    endPosition = Coord({ x: 3, y: 6 });
    range = 6;
    inRange = LibVector.inRange(startingPosition, endPosition, range);
    assertTrue(!inRange, "6 within range");

    range = 7;
    inRange = LibVector.inRange(startingPosition, endPosition, range);
    assertTrue(inRange, "7 out of range");
  }

  function testGetSternLocation() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 45;
    uint32 length = 50;

    Coord memory sternLocation = LibVector.getSternLocation(startingPosition, rotation, length);

    Coord memory expectedLocation = Coord({ x: -35, y: -35 });
    assertCoordEq(sternLocation, expectedLocation);
  }

  function testGetShipBowAndSternLocation() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 50, 50);

    (Coord memory bow, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntityId);

    assertCoordEq(startingPosition, bow);
    Coord memory expectedStern = Coord({ x: -35, y: -35 });
    assertCoordEq(stern, expectedStern);
  }

  function testFiringArea() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 0;

    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, 350, 50, 50);

    Coord[4] memory firingArea = combatSystem.getFiringArea(components, shipEntityId, Side.Right);

    Coord memory stern = Coord({ x: -49, y: 8 });
    Coord memory bottomCorner = Coord({ x: 0, y: -49 });
    Coord memory topCorner = Coord({ x: -66, y: -38 });

    assertCoordEq(startingPosition, firingArea[0]);
    assertCoordEq(stern, firingArea[1]);
    assertCoordEq(topCorner, firingArea[2]);
    assertCoordEq(bottomCorner, firingArea[3]);
  }

  function testInsidePolygon() public prank(deployer) {
    setup();

    Coord[4] memory polygon = [
      Coord({ x: 0, y: 0 }),
      Coord({ x: 0, y: 10 }),
      Coord({ x: 10, y: 10 }),
      Coord({ x: 10, y: 0 })
    ];

    Coord memory point1 = Coord({ x: 5, y: 10 }); // not inside
    Coord memory point2 = Coord({ x: 5, y: 0 }); // not inside
    Coord memory point3 = Coord({ x: 5, y: 5 }); // inside
    Coord memory point4 = Coord({ x: 0, y: 5 }); // not inside
    Coord memory point5 = Coord({ x: -5, y: 5 }); // not inside
    Coord memory point6 = Coord({ x: 5, y: -5 }); // not inside
    Coord memory point7 = Coord({ x: 15, y: 5 }); // not inside
    Coord memory point8 = Coord({ x: 9, y: 9 }); // inside

    assertTrue(!LibVector.winding(polygon, point1), "point 1 failed");
    assertTrue(!LibVector.winding(polygon, point2), "point 2 failed");
    assertTrue(LibVector.winding(polygon, point3), "point 3 failed");
    assertTrue(!LibVector.winding(polygon, point4), "point 4 failed");
    assertTrue(!LibVector.winding(polygon, point5), "point 5 failed");
    assertTrue(!LibVector.winding(polygon, point6), "point 6 failed");
    assertTrue(!LibVector.winding(polygon, point7), "point 7 failed");
    assertTrue(LibVector.winding(polygon, point8), "point 8 failed");
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
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    combatSystem.executeTyped(attackerId, Side.Right);

    uint32 newHealth = healthComponent.getValue(defenderId);
    assertEq(newHealth, origHealth - 1);

    newHealth = healthComponent.getValue(defender2Id);
    assertEq(newHealth, orig2Health);

    newHealth = healthComponent.getValue(attackerId);
    assertEq(newHealth, attackerHealth);
  }

  function testCombatAfterMove() public prank(deployer) {
    setup();
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    MoveSystem moveSystem = MoveSystem(system(MoveSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint256 attackerId = shipSpawnSystem.executeTyped(startingPosition, 0, 10, 30);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    moveSystem.executeTyped(attackerId, moveStraightEntityId);

    uint256 defenderId = shipSpawnSystem.executeTyped(startingPosition, 0, 10, 30);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    combatSystem.executeTyped(attackerId, Side.Right);

    Coord[4] memory firingArea = combatSystem.getFiringArea(components, attackerId, Side.Right);

    (Coord memory targetPosition, Coord memory targetAft) = LibVector.getShipBowAndSternLocation(
      components,
      defenderId
    );

    uint32 newHealth = healthComponent.getValue(attackerId);
    assertEq(newHealth, attackerHealth);

    newHealth = healthComponent.getValue(defenderId);
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
