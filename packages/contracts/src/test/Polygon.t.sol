// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components

// Internal
import "./MudTest.t.sol";
import "../libraries/LibPolygon.sol";

contract PolygonTest is MudTest {
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

    bool isInside = LibPolygon.winding(coords, insideCoord);
    bool isOutside = LibPolygon.winding(coords, outsideCoord);
    bool isOnLine = LibPolygon.winding(coords, onLineCoord);

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

    bool isInside = LibPolygon.winding(coords, insideCoord);
    bool isOutside = LibPolygon.winding(coords, outsideCoord);
    bool isOnLine = LibPolygon.winding(coords, onLineCoord);

    assertTrue(isInside);
    assertTrue(!isOutside);
    assertTrue(!isOnLine);
  }
}
