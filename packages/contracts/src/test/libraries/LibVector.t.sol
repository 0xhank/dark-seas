// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Types
import { Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibVector.sol";

contract LibVectorTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  function testGetSternPosition() public prank(deployer) {
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 45;
    uint32 length = 50;

    Coord memory sternPosition = LibVector.getSternPosition(startingPosition, rotation, length);

    Coord memory expectedPosition = Coord({ x: -35, y: -35 });
    assertCoordEq(sternPosition, expectedPosition);
  }

  function testGetShipBowAndSternPosition() public prank(deployer) {
    uint256 gameId = setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = spawnShip(gameId, startingPosition, startingRotation, deployer);

    (Coord memory bow, Coord memory stern) = LibVector.getShipBowAndSternPosition(world, shipEntity);

    assertCoordEq(startingPosition, bow);
    Coord memory expectedStern = Coord({ x: -7, y: -7 });
    assertCoordEq(stern, expectedStern);
  }

  function testLinesIntersect() public prank(deployer) {
    Line memory line1 = Line(Coord(0, 0), Coord(10, 0));
    Line memory line2 = Line(Coord(0, 5), Coord(5, -5));

    assertTrue(LibVector.linesIntersect(line1, line2));
    line2 = Line(Coord(0, 5), Coord(10, -5));
    assertTrue(LibVector.linesIntersect(line1, line2));
    line2 = Line(Coord(2, 0), Coord(5, 0));
    assertTrue(!LibVector.linesIntersect(line1, line2));
    line2 = Line(Coord(2, 20), Coord(5, 40));
    assertTrue(!LibVector.linesIntersect(line1, line2));
  }

  function testInsidePolygon() public prank(deployer) {
    Coord[] memory polygon = new Coord[](4);
    polygon[0] = Coord({ x: 0, y: 0 });
    polygon[1] = Coord({ x: 0, y: 10 });
    polygon[2] = Coord({ x: 10, y: 10 });
    polygon[3] = Coord({ x: 10, y: 0 });

    Coord memory point1 = Coord({ x: 5, y: 10 }); // not inside
    Coord memory point2 = Coord({ x: 5, y: 0 }); // not inside
    Coord memory point3 = Coord({ x: 5, y: 5 }); // inside
    Coord memory point4 = Coord({ x: 0, y: 5 }); // not inside
    Coord memory point5 = Coord({ x: -5, y: 5 }); // not inside
    Coord memory point6 = Coord({ x: 5, y: -5 }); // not inside
    Coord memory point7 = Coord({ x: 15, y: 5 }); // not inside
    Coord memory point8 = Coord({ x: 9, y: 9 }); // inside

    assertTrue(!LibVector.withinPolygon(point1, polygon), "point 1 failed");
    assertTrue(!LibVector.withinPolygon(point2, polygon), "point 2 failed");
    assertTrue(LibVector.withinPolygon(point3, polygon), "point 3 failed");
    assertTrue(!LibVector.withinPolygon(point4, polygon), "point 4 failed");
    assertTrue(!LibVector.withinPolygon(point5, polygon), "point 5 failed");
    assertTrue(!LibVector.withinPolygon(point6, polygon), "point 6 failed");
    assertTrue(!LibVector.withinPolygon(point7, polygon), "point 7 failed");
    assertTrue(LibVector.withinPolygon(point8, polygon), "point 8 failed");
  }

  function testPointInsideRectangle() public prank(deployer) {
    Coord[] memory coords = new Coord[](4);
    coords[0] = Coord({ x: 0, y: 0 });
    coords[1] = Coord({ x: 0, y: 4 });
    coords[2] = Coord({ x: 12, y: 4 });
    coords[3] = Coord({ x: 12, y: 0 });

    Coord memory insideCoord = Coord({ x: 1, y: 1 });
    Coord memory outsideCoord = Coord({ x: -1, y: 3 });
    Coord memory onLineCoord = Coord({ x: 0, y: 3 });

    bool isInside = LibVector.withinPolygon(insideCoord, coords);
    bool isOutside = LibVector.withinPolygon(outsideCoord, coords);
    bool isOnLine = LibVector.withinPolygon(onLineCoord, coords);

    assertTrue(isInside);
    assertTrue(!isOutside);
    assertTrue(!isOnLine);
  }

  function testPointInsideTiltedTrapezoid() public prank(deployer) {
    Coord[] memory coords = new Coord[](4);
    coords[0] = Coord({ x: 2, y: 0 });
    coords[1] = Coord({ x: 0, y: 4 });
    coords[2] = Coord({ x: 1, y: 6 });
    coords[3] = Coord({ x: 7, y: 6 });

    Coord memory insideCoord = Coord({ x: 6, y: 5 });
    Coord memory outsideCoord = Coord({ x: 0, y: 4 });
    Coord memory onLineCoord = Coord({ x: 1, y: 2 });

    bool isInside = LibVector.withinPolygon(insideCoord, coords);
    bool isOutside = LibVector.withinPolygon(outsideCoord, coords);
    bool isOnLine = LibVector.withinPolygon(onLineCoord, coords);

    assertTrue(isInside);
    assertTrue(!isOutside);
    assertTrue(!isOnLine);
  }

  function testPointInsideForwardPath() public prank(deployer) {
    Coord[] memory coords = new Coord[](3);
    coords[0] = Coord({ x: 0, y: 0 });
    coords[1] = Coord({ x: 78, y: -13 });
    coords[2] = Coord({ x: 78, y: 13 });

    Coord memory insideCoord = Coord({ x: 70, y: 0 });
    Coord memory outsideCoord = Coord({ x: 79, y: 0 });
    Coord memory onLineCoord = Coord({ x: 78, y: 0 });

    bool isInside = LibVector.withinPolygon(insideCoord, coords);
    bool isOutside = LibVector.withinPolygon(outsideCoord, coords);
    bool isOnLine = LibVector.withinPolygon(onLineCoord, coords);

    assertTrue(isInside, "is inside failed");
    assertTrue(!isOutside, "is outside failed");
    assertTrue(!isOnLine, "is on line failed");
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

  function testShrinkingWorld() public prank(deployer) {
    uint256 gameId = setup();
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    gameConfig.entryCutoffTurns = 0;
    gameConfig.worldSize = 100;

    gameConfig.shrinkRate = 100;
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 1), 99, "shrinkrate 100 failed");
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 99), 50, "shrinkrate 100 min failed");

    gameConfig.shrinkRate = 200;
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 1), 98, "shrinkrate 200 failed");
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 2), 96, "testShrink 200 failed");
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 99), 50, "shrinkrate 200 min failed");

    gameConfig.shrinkRate = 50;
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 1), 100, "shrinkrate 50 failed");
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 2), 99, "testShrink 50 failed");
    assertEq(LibVector.getWorldHeightAtTurn(gameConfig, 102), 50, "shrinkrate 50 min failed");
  }

  function setup() private returns (uint256 gameId) {
    bytes memory id = InitSystem(system(InitSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));
    return gameId;
  }
}
