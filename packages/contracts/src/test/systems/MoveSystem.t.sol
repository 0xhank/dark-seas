// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { Perlin } from "noise/Perlin.sol";

// Systems
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { ABDKMath64x64 as Math } from "abdk-libraries-solidity/ABDKMath64x64.sol";

// Components
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "../../components/SpeedComponent.sol";

// Types
import { GodID, MoveCard, Move, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibMove.sol";
import "../../libraries/LibTurn.sol";

contract MoveSystemTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  MoveCardComponent moveCardComponent;
  SailPositionComponent sailPositionComponent;
  SpeedComponent speedComponent;

  MoveSystem moveSystem;
  CommitSystem commitSystem;

  Move[] moves;

  function testCommitReveal() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;

    uint256 shipEntity = spawnShip(startingPosition, startingRotation, deployer);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Reveal));
    moveSystem.executeTyped(moves, 69);
  }

  function testRevertCommitReveal() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;

    uint256 shipEntity = spawnShip(startingPosition, startingRotation, deployer);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Reveal));
    vm.expectRevert(bytes("MoveSystem: commitment doesn't match move"));
    moveSystem.executeTyped(moves, 420);
  }

  function testRevertShipDed() public prank(deployer) {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = spawnShip(startingPosition, startingRotation, deployer);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    componentDevSystem.executeTyped(HealthComponentID, shipEntity, abi.encode(0));

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: ship is sunk"));
    moveSystem.executeTyped(moves, 69);
  }

  function testRevertNotPlayer() public prank(deployer) {
    setup();

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    vm.expectRevert(bytes("MoveSystem: player does not exist"));
    commitSystem.executeTyped(commitment);
  }

  function testRevertNotOwner() public prank(deployer) {
    setup();

    uint256 shipEntity = spawnShip(Coord(0, 0), 0, alice);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));

    spawnShip(Coord(0, 0), 0, deployer);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: you don't own this ship"));
    moveSystem.executeTyped(moves, 69);
  }

  function testOutOfBounds() public prank(deployer) {
    setup();
    uint32 worldSize = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID))
      .getValue(GodID)
      .worldSize;
    uint256 shipEntity = spawnShip(Coord(0, int32(worldSize)), 90, deployer);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: shipEntity }));
    uint32 health = HealthComponent(LibUtils.addressById(world, HealthComponentID)).getValue(shipEntity);
    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Reveal));

    moveSystem.executeTyped(moves, 69);

    uint32 newHealth = HealthComponent(LibUtils.addressById(world, HealthComponentID)).getValue(shipEntity);

    assertEq(health - 1, newHealth);
  }

  function testMove() public prank(deployer) {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = spawnShip(position, rotation, deployer);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));
    uint32 sailPosition = sailPositionComponent.getValue(shipEntity);
    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);
    moveCard = LibMove.getMoveWithSails(moveCard, speedComponent.getValue(shipEntity), sailPosition);

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

  function testMoveHardRight() public prank(deployer) {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = spawnShip(position, rotation, deployer);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));
    uint32 sailPosition = sailPositionComponent.getValue(shipEntity);
    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithSails(moveCard, speedComponent.getValue(shipEntity), sailPosition);

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

  function testMoveSoftRight() public prank(deployer) {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = spawnShip(position, rotation, deployer);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity3"));
    uint32 sailPosition = sailPositionComponent.getValue(shipEntity);

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithSails(moveCard, speedComponent.getValue(shipEntity), sailPosition);

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
    uint32 debuff = 70;
    newMoveCard = LibMove.getMoveWithSails(moveCard, 100, sailPosition);
    assertEq(newMoveCard.distance, (moveCard.distance * debuff) / 100, "closed sails distance failed");
    assertEq(newMoveCard.rotation, 360 - (((360 - moveCard.rotation) * 100) / debuff), "closed sails rotation failed");
    assertEq(newMoveCard.direction, 360 - (((360 - moveCard.direction) * 100) / debuff), "closed sails angle failed");

    moveCard.distance = 100;
    moveCard.rotation = 90;
    moveCard.direction = 45;
    newMoveCard = LibMove.getMoveWithSails(moveCard, 100, sailPosition);

    assertEq(newMoveCard.distance, (moveCard.distance * debuff) / 100, "closed sails distance 2 failed");
    assertEq(newMoveCard.rotation, (moveCard.rotation * 100) / debuff, "closed sails 2 rotation failed");
    assertEq(newMoveCard.direction, (moveCard.direction * 100) / debuff, "closed sails angle 2 failed");
  }

  function testMoveWithLoweredSails() public prank(deployer) {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = spawnShip(position, rotation, deployer);
    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(SailPositionComponentID, shipEntity, abi.encode(1));
    uint32 sailPosition = sailPositionComponent.getValue(shipEntity);

    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithSails(moveCard, speedComponent.getValue(shipEntity), sailPosition);

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

  int128 constant _11 = 8 * 2**64;

  function getValue(Coord memory input) public view returns (int32 finalResult) {
    int128 denom = 15;
    uint8 precision = 64;
    int128 perlinResult = Perlin.noise2d(input.x, input.y, denom, precision);

    finalResult = int32(Math.muli(perlinResult, 100));
  }

  function testMoveSuicide() public prank(deployer) {
    setup();
    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    GameConfigComponent gameConfigComponent = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID));

    GameConfig memory gameConfig = gameConfigComponent.getValue(GodID);
    gameConfig.worldSize = 10;
    gameConfigComponent.set(GodID, gameConfig);

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 90;
    uint256 shipEntity = spawnShip(position, rotation, deployer);
    componentDevSystem.executeTyped(HealthComponentID, shipEntity, abi.encode(1));

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity1"));
    moves.push(Move({ moveCardEntity: moveCardEntity, shipEntity: shipEntity }));

    commitAndExecuteMove(1, moves);

    uint32 health = HealthComponent(LibUtils.addressById(world, HealthComponentID)).getValue(shipEntity);
    assertEq(health, 0);
  }

  /**
   * Helpers
   */

  function setup() internal {
    moveSystem = MoveSystem(system(MoveSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));
    moveCardComponent = MoveCardComponent(LibUtils.addressById(world, MoveCardComponentID));
    sailPositionComponent = SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID));
    speedComponent = SpeedComponent(LibUtils.addressById(world, SpeedComponentID));

    delete moves;
  }

  function commitAndExecuteMove(uint32 turn, Move[] memory _moves) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(world, turn, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(_moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, turn, Phase.Reveal));
    moveSystem.executeTyped(_moves, 69);
  }
}
