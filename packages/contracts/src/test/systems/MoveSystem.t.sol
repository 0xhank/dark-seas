// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord, PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID, Wind, GodID } from "../../components/WindComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ChangeSailSystem, ID as ChangeSailSystemID } from "../../systems/ChangeSailSystem.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

import "../../libraries/LibNature.sol";

contract MoveSystemTest is MudTest {
  uint256 entityId;
  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  Wind wind;
  WindComponent windComponent;
  MoveSystem moveSystem;
  ShipSpawnSystem shipSpawnSystem;

  function testMove() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 21, y: startingPosition.y + 21 }), currPosition);
    assertEq(playerRotation, startingRotation);
  }

  function testMoveHardRight() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 315;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    uint256 moveHardRightId = uint256(keccak256("ds.prototype.moveEntity2"));

    moveSystem.executeTyped(shipEntityId, moveHardRightId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 30, y: startingPosition.y }), currPosition);
    assertEq(playerRotation, (startingRotation + 90) % 360);
  }

  function testMoveSoftRight() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 18;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity3"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 7, y: startingPosition.y + 7 }), currPosition);
    assertEq(playerRotation, (startingRotation + 45) % 360);
  }

  function testGetWindBoost() public prank(deployer) {
    setup();

    assertEq(LibNature.getWindBoost(wind, 0), -10);
    assertEq(LibNature.getWindBoost(wind, 22), 10);
    assertEq(LibNature.getWindBoost(wind, 81), 0);
    assertEq(LibNature.getWindBoost(wind, 121), -10);
    assertEq(LibNature.getWindBoost(wind, 241), 0);
    assertEq(LibNature.getWindBoost(wind, 281), 10);
    assertEq(LibNature.getWindBoost(wind, 340), -10);
  }

  function testGetMoveDistanceWithWind() public prank(deployer) {
    setup();

    uint32 moveDistance = LibNature.getMoveDistanceWithWind(20, 0, wind);
    assertEq(moveDistance, 10);

    moveDistance = LibNature.getMoveDistanceWithWind(5, 0, wind);
    assertEq(moveDistance, 0);

    moveDistance = LibNature.getMoveDistanceWithWind(10, 40, wind);
    assertEq(moveDistance, 20);

    moveDistance = LibNature.getMoveDistanceWithWind(10, 100, wind);
    assertEq(moveDistance, 10);
  }

  function testGetMoveDistanceAndRotationWithSails() public prank(deployer) {
    uint32 moveDistance = 50;
    uint32 moveRotation = 90;
    uint32 moveDirection = 45;
    uint32 sailPosition = 3;
    uint32 newMoveDistance;
    uint32 newMoveRotation;
    uint32 newMoveDirection;

    (newMoveDistance, newMoveRotation, newMoveDirection) = LibNature.getMoveDistanceAndRotationWithSails(
      moveDistance,
      moveRotation,
      moveDirection,
      sailPosition
    );
    assertEq(moveDistance, newMoveDistance, "full sails distance failed");
    assertEq(moveRotation, newMoveRotation, "full sails rotation failed");
    assertEq(moveDirection, newMoveDirection, "full sails angle failed");

    sailPosition = 2;
    (newMoveDistance, newMoveRotation, newMoveDirection) = LibNature.getMoveDistanceAndRotationWithSails(
      moveDistance,
      moveRotation,
      moveDirection,
      sailPosition
    );
    assertEq(moveDistance, (newMoveDistance * 100) / 75, "battle sails distance failed");
    assertEq(moveRotation, (newMoveRotation * 100) / 75, "battle sails rotation failed");
    assertEq(moveDirection, (newMoveDirection * 100) / 75, "battle sails angle failed");

    moveRotation = 270;
    moveDirection = 315;

    (newMoveDistance, newMoveRotation, newMoveDirection) = LibNature.getMoveDistanceAndRotationWithSails(
      moveDistance,
      moveRotation,
      moveDirection,
      sailPosition
    );
    assertEq(newMoveDistance, 20, "closed sails distance failed");
    assertEq(newMoveRotation, 306, "closed sails rotation failed");
    assertEq(newMoveDirection, 333, "closed sails angle failed");
  }

  function testMoveWithBattleSails() public prank(deployer) {
    setup();

    ChangeSailSystem changeSailSystem = ChangeSailSystem(system(ChangeSailSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 0;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    changeSailSystem.executeTyped(shipEntityId, 2);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);

    assertCoordEq(currPosition, Coord({ x: 15, y: 0 }));
  }

  function testMoveWithClosedSails() public prank(deployer) {
    setup();

    ChangeSailSystem changeSailSystem = ChangeSailSystem(system(ChangeSailSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 0;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    changeSailSystem.executeTyped(shipEntityId, 2);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    moveSystem.executeTyped(shipEntityId, moveStraightEntityId);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);

    assertCoordEq(currPosition, Coord({ x: 15, y: 0 }));
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));
    entityId = addressToEntity(deployer);
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);
  }
}
