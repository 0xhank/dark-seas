// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";

// Types
import { Side, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibVector.sol";
import "../../libraries/LibCombat.sol";

contract LibVectorTest is MudTest {
  ShipSpawnSystem shipSpawnSystem;

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
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    (Coord memory bow, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntityId);

    assertCoordEq(startingPosition, bow);
    Coord memory expectedStern = Coord({ x: -7, y: -7 });
    assertCoordEq(stern, expectedStern);
  }

  function testFiringArea() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });

    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, 0);

    Coord[4] memory firingArea = LibCombat.getFiringArea(components, shipEntityId, Side.Right);

    Coord memory stern = Coord({ x: -9, y: 0 });
    Coord memory bottomCorner = Coord({ x: 8, y: 49 });
    Coord memory topCorner = Coord({ x: -17, y: 49 });

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

    assertTrue(!LibVector.withinPolygon(polygon, point1), "point 1 failed");
    assertTrue(!LibVector.withinPolygon(polygon, point2), "point 2 failed");
    assertTrue(LibVector.withinPolygon(polygon, point3), "point 3 failed");
    assertTrue(!LibVector.withinPolygon(polygon, point4), "point 4 failed");
    assertTrue(!LibVector.withinPolygon(polygon, point5), "point 5 failed");
    assertTrue(!LibVector.withinPolygon(polygon, point6), "point 6 failed");
    assertTrue(!LibVector.withinPolygon(polygon, point7), "point 7 failed");
    assertTrue(LibVector.withinPolygon(polygon, point8), "point 8 failed");
  }

  function testPointInsideRectangle() public prank(deployer) {
    Coord[4] memory coords = [
      Coord({ x: 0, y: 0 }),
      Coord({ x: 0, y: 4 }),
      Coord({ x: 12, y: 4 }),
      Coord({ x: 12, y: 0 })
    ];

    Coord memory insideCoord = Coord({ x: 1, y: 1 });
    Coord memory outsideCoord = Coord({ x: -1, y: 3 });
    Coord memory onLineCoord = Coord({ x: 0, y: 3 });

    bool isInside = LibVector.withinPolygon(coords, insideCoord);
    bool isOutside = LibVector.withinPolygon(coords, outsideCoord);
    bool isOnLine = LibVector.withinPolygon(coords, onLineCoord);

    assertTrue(isInside);
    assertTrue(!isOutside);
    assertTrue(!isOnLine);
  }

  function testPointInsideTiltedTrapezoid() public prank(deployer) {
    Coord[4] memory coords = [
      Coord({ x: 2, y: 0 }),
      Coord({ x: 0, y: 4 }),
      Coord({ x: 1, y: 6 }),
      Coord({ x: 7, y: 6 })
    ];

    Coord memory insideCoord = Coord({ x: 6, y: 5 });
    Coord memory outsideCoord = Coord({ x: 0, y: 4 });
    Coord memory onLineCoord = Coord({ x: 1, y: 2 });

    bool isInside = LibVector.withinPolygon(coords, insideCoord);
    bool isOutside = LibVector.withinPolygon(coords, outsideCoord);
    bool isOnLine = LibVector.withinPolygon(coords, onLineCoord);

    assertTrue(isInside);
    assertTrue(!isOutside);
    assertTrue(!isOnLine);
  }

  function testSqrt() public prank(deployer) {
    Coord memory a = Coord(0, 0);
    Coord memory b = Coord(5, 0);
    assertEq(LibVector.distance(a, b), 5, "testSqrt: (0,0) and (5,0) failed");

    b = Coord(0, 5);
    assertEq(LibVector.distance(a, b), 5, "testSqrt: (0,0) and (0,5) failed");

    b = Coord(5, 5);
    assertApproxEqAbs(LibVector.distance(a, b), 7, 1, "testSqrt: (0,0) and (5,5) failed");

    a = Coord(24, 17);
    b = Coord(91, 3);
    assertApproxEqAbs(LibVector.distance(a, b), 68, 1, "testSqrt: (24,17) and (91,3) failed");

    uint256 initialGas = gasleft();
    LibVector.distance(a, b);
    console.log("sqrt gas used:", initialGas - gasleft());
  }

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
  }
}
