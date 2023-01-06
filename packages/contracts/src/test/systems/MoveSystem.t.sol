// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";

// Components
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID } from "../../components/WindComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "../../components/SpeedComponent.sol";

// Types
import { Wind, GodID, MoveCard, Move, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibMove.sol";
import "../../libraries/LibTurn.sol";

contract MoveSystemTest is DarkSeasTest {
  Wind wind;

  constructor() DarkSeasTest(new Deploy()) {}

  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  MoveCardComponent moveCardComponent;
  WindComponent windComponent;
  SailPositionComponent sailPositionComponent;
  SpeedComponent speedComponent;

  MoveSystem moveSystem;
  CommitSystem commitSystem;
  ShipSpawnSystem shipSpawnSystem;

  Move[] moves;

  function testCommitReveal() public {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;

    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));
    moveSystem.executeTyped(moves, 69);
  }

  function testRevertCommitReveal() public {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;

    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));
    vm.expectRevert(bytes("MoveSystem: commitment doesn't match move"));
    moveSystem.executeTyped(moves, 420);
  }

  function testRevertShipDed() public {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    componentDevSystem.executeTyped(HealthComponentID, shipEntity, abi.encode(0));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: ship is sunk"));
    moveSystem.executeTyped(moves, 69);
  }

  function testRevertCruDed() public {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    componentDevSystem.executeTyped(CrewCountComponentID, shipEntity, abi.encode(0));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: ship has no crew"));
    moveSystem.executeTyped(moves, 69);
  }

  function testRevertNotPlayer() public {
    setup();

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    vm.expectRevert(bytes("MoveSystem: player does not exist"));
    commitSystem.executeTyped(commitment);
  }

  function testRevertNotOwner() public {
    setup();

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    vm.prank(deployer);
    shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    vm.prank(deployer);
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: you don't own this ship"));
    vm.prank(deployer);
    moveSystem.executeTyped(moves, 69);
  }

  function testRevertOutOfBounds() public {
    setup();
    uint32 worldRadius = GameConfigComponent(getAddressById(components, GameConfigComponentID))
      .getValue(GodID)
      .worldRadius;
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(int32(worldRadius), 0), 0);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: move out of bounds"));
    moveSystem.executeTyped(moves, 69);
  }

  function testMove() public {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(
      moveCard,
      speedComponent.getValue(shipEntity),
      sailPositionComponent.getValue(shipEntity)
    );

    Coord memory expectedPosition = LibVector.getPositionByVector(
      position,
      rotation,
      moveCard.distance,
      moveCard.direction
    );
    uint32 expectedRotation = (rotation + moveCard.rotation) % 360;

    position = positionComponent.getValue(shipEntity);
    rotation = rotationComponent.getValue(shipEntity);

    assertCoordEq(position, expectedPosition);
    assertEq(rotation, expectedRotation);
  }

  function testMoveHardRight() public {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(
      moveCard,
      speedComponent.getValue(shipEntity),
      sailPositionComponent.getValue(shipEntity)
    );

    Coord memory expectedPosition = LibVector.getPositionByVector(
      position,
      rotation,
      moveCard.distance,
      moveCard.direction
    );
    uint32 expectedRotation = (rotation + moveCard.rotation) % 360;

    position = positionComponent.getValue(shipEntity);
    rotation = rotationComponent.getValue(shipEntity);

    assertCoordEq(position, expectedPosition);
    assertEq(rotation, expectedRotation);
  }

  function testMoveSoftRight() public {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity3"));

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(
      moveCard,
      speedComponent.getValue(shipEntity),
      sailPositionComponent.getValue(shipEntity)
    );

    Coord memory expectedPosition = LibVector.getPositionByVector(
      position,
      rotation,
      moveCard.distance,
      moveCard.direction
    );
    uint32 expectedRotation = (rotation + moveCard.rotation) % 360;

    position = positionComponent.getValue(shipEntity);
    rotation = rotationComponent.getValue(shipEntity);

    assertCoordEq(position, expectedPosition);
    assertEq(rotation, expectedRotation);
  }

  function testGetWindBoost() public {
    setup();

    Wind memory customWind = Wind({ direction: 0, speed: 10 });
    assertEq(LibMove.windBoost(customWind, 90), 0);
    assertEq(LibMove.windBoost(customWind, 112), 0);
    assertEq(LibMove.windBoost(customWind, 171), -10);
    assertEq(LibMove.windBoost(customWind, 211), -10);
    assertEq(LibMove.windBoost(customWind, 331), 10);
    assertEq(LibMove.windBoost(customWind, 11), 10);
    assertEq(LibMove.windBoost(customWind, 70), 10);
  }

  function testGetMoveWithOpenSails() public prank(deployer) {
    MoveCard memory moveCard = MoveCard({ distance: 50, rotation: 90, direction: 45 });
    uint32 sailPosition = 2;

    MoveCard memory newMoveCard;

    newMoveCard = LibMove.getMoveWithSails(moveCard, 100, sailPosition);
    assertEq(moveCard.distance, newMoveCard.distance, "full sails distance failed");
    assertEq(moveCard.rotation, newMoveCard.rotation, "full sails rotation failed");
    assertEq(moveCard.direction, newMoveCard.direction, "full sails angle failed");

    moveCard.rotation = 270;
    moveCard.direction = 315;

    sailPosition = 1;
    uint32 debuff = 50;
    uint32 modifiedDebuff = (debuff * 100) / 75;
    newMoveCard = LibMove.getMoveWithSails(moveCard, 100, sailPosition);
    assertEq(newMoveCard.distance, (moveCard.distance * 50) / 100, "closed sails distance failed");
    assertEq(newMoveCard.rotation, 360 - ((moveCard.rotation * modifiedDebuff) / 100), "closed sails rotation failed");
    assertEq(newMoveCard.direction, 360 - ((moveCard.direction * modifiedDebuff) / 100), "closed sails angle failed");

    moveCard.distance = 100;
    moveCard.rotation = 90;
    moveCard.direction = 45;
    newMoveCard = LibMove.getMoveWithSails(moveCard, 100, sailPosition);

    assertEq(newMoveCard.distance, (moveCard.distance * debuff) / 100, "closed sails distance 2 failed");
    assertEq(
      newMoveCard.rotation,
      180 - ((moveCard.rotation * modifiedDebuff) / 100),
      "closed sails 2 rotation failed"
    );
    assertEq(newMoveCard.direction, 180 - ((moveCard.direction * modifiedDebuff) / 100), "closed sails angle 2 failed");
  }

  function testMoveWithLoweredSails() public {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);
    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(SailPositionComponentID, shipEntity, abi.encode(1));

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(
      moveCard,
      speedComponent.getValue(shipEntity),
      sailPositionComponent.getValue(shipEntity)
    );

    Coord memory expectedPosition = LibVector.getPositionByVector(
      position,
      rotation,
      moveCard.distance,
      moveCard.direction
    );
    uint32 expectedRotation = (rotation + moveCard.rotation) % 360;

    position = positionComponent.getValue(shipEntity);
    rotation = rotationComponent.getValue(shipEntity);

    assertCoordEq(position, expectedPosition);
    assertEq(rotation, expectedRotation);
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
    speedComponent = SpeedComponent(getAddressById(components, SpeedComponentID));

    wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);
    delete moves;
  }

  function commitAndExecuteMove(uint32 turn, Move[] memory moves) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Reveal));
    moveSystem.executeTyped(moves, 69);
  }
}
