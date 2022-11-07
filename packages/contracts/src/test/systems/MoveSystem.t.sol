// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord, PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";

// Systems
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract MoveSystemTest is MudTest {
  uint256 entityId;
  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  MoveSystem moveSystem;

  function testMove() public prank(deployer) {
    setup();
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    // // Get player's current coordinate
    Coord memory coord = Coord({ x: 1, y: 1 });
    uint32 rotation = 45;

    moveSystem.executeTyped(entityId, coord);

    Coord memory currPosition = positionComponent.getValue(entityId);
    uint32 playerRotation = rotationComponent.getValue(entityId);
    assertCoordEq(coord, currPosition);
    assertEq(playerRotation, rotation);
  }

  /**
   * Helpers
   */

  function setup() internal {
    moveSystem = MoveSystem(system(MoveSystemID));
    entityId = addressToEntity(deployer);
    console.log("entityId:", entityId);
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
  }

  // function movePlayerRight(int32 distance) internal returns (Coord memory) {
  //   Coord memory currCoord = positionComponent.getValue(entityId);
  //   Coord[] memory path = new Coord[](1);
  //   path[0] = Coord({ x: currCoord.x + distance, y: currCoord.y });
  //   moveSystem.executeTyped(entityId, path);
  //   return path[0];
  // }

  // function spawnPlayer() internal {
  //   // Player spawns
  //   PlayerSpawnSystem(system(PlayerSpawnSystemID)).executeTyped();
  //   moveSystem = MoveSystem(system(MoveSystemID));
  //   entityId = addressToEntity(deployer);
  //   positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
  // }
}
