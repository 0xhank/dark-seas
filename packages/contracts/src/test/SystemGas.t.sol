// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components

// Internal
import "./MudTest.t.sol";
import "../libraries/LibVector.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../systems/ShipSpawnSystem.sol";

contract SystemGasTest is MudTest {
  function testShipSpawnGas() public prank(deployer) {
    ShipSpawnSystem shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 315;

    uint256 initialGas = gasleft();
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    uint256 finalGas = gasleft();

    console.log("ShipSpawnSystem gas:", initialGas - finalGas);
  }

  function testInitGas() public prank(deployer) {
    Coord[4] memory coords = [
      Coord({ x: 2, y: 0 }),
      Coord({ x: 0, y: 4 }),
      Coord({ x: 1, y: 6 }),
      Coord({ x: 7, y: 6 })
    ];

    Coord memory insideCoord = Coord({ x: 6, y: 5 });
    Coord memory outsideCoord = Coord({ x: 0, y: 4 });
    Coord memory onLineCoord = Coord({ x: 1, y: 2 });

    bool isInside = LibVector.winding(coords, insideCoord);
    bool isOutside = LibVector.winding(coords, outsideCoord);
    bool isOnLine = LibVector.winding(coords, onLineCoord);

    assertTrue(isInside);
    assertTrue(!isOutside);
    assertTrue(!isOnLine);
  }

  function testMoveGas() public prank(deployer) {}

  function testCombatGas() public prank(deployer) {}
}
