// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord, PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract MoveSystemTest is MudTest {
  uint256 entityId;
  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  MoveSystem moveSystem;
  ShipSpawnSystem shipSpawnSystem;

  function testMove() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 35, y: startingPosition.y + 35 }), currPosition);
    assertEq(playerRotation, startingRotation);
  }

  function testMoveHardRight() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 315;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity2"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 50, y: startingPosition.y }), currPosition);
    assertEq(playerRotation, (startingRotation + 90) % 360);
  }

  function testMoveSoftRight() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 18;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity3"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 35, y: startingPosition.y + 35 }), currPosition);
    assertEq(playerRotation, (startingRotation + 45) % 360);
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
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
