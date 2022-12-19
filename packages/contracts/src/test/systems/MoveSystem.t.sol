// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";

// Components
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID } from "../../components/WindComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";

// Types
import { Wind, GodID, MoveCard, Action, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibMove.sol";
import "../../libraries/LibTurn.sol";

contract MoveSystemTest is MudTest {
  Wind wind;

  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  MoveCardComponent moveCardComponent;
  WindComponent windComponent;
  SailPositionComponent sailPositionComponent;

  MoveSystem moveSystem;
  CommitSystem commitSystem;
  ShipSpawnSystem shipSpawnSystem;
  ActionSystem actionSystem;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[][] allActions = new Action[][](0);
  Action[] actions = new Action[](0);

  function testCommitReveal() public {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;

    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    delete shipEntities;
    delete moveEntities;
    console.log("move straight entity id", moveStraightEntity);
    shipEntities.push(shipEntity);
    moveEntities.push(moveStraightEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));
    moveSystem.executeTyped(shipEntities, moveEntities, 69);
  }

  function testRevertCommitReveal() public {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;

    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    console.log("move straight entity id", moveStraightEntity);
    shipEntities.push(shipEntity);
    moveEntities.push(moveStraightEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));
    vm.expectRevert(bytes("MoveSystem: commitment doesn't match move"));
    moveSystem.executeTyped(shipEntities, moveEntities, 420);
  }

  function testRevertShipDed() public {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    delete shipEntities;
    delete moveEntities;

    shipEntities.push(shipEntity);
    moveEntities.push(moveStraightEntity);
    componentDevSystem.executeTyped(HealthComponentID, shipEntity, abi.encode(0));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: ship is sunk"));
    moveSystem.executeTyped(shipEntities, moveEntities, 69);
  }

  function testRevertCruDed() public {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    CrewCountComponent crewCountComponent = CrewCountComponent(getAddressById(components, CrewCountComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    delete shipEntities;
    delete moveEntities;

    shipEntities.push(shipEntity);
    moveEntities.push(moveStraightEntity);
    componentDevSystem.executeTyped(CrewCountComponentID, shipEntity, abi.encode(0));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: ship has no crew"));
    moveSystem.executeTyped(shipEntities, moveEntities, 69);
  }

  function testRevertNotPlayer() public {
    setup();

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    vm.expectRevert(bytes("MoveSystem: player does not exist"));
    commitSystem.executeTyped(commitment);
  }

  function testRevertNotOwner() public {
    setup();

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    shipEntities.push(shipEntity);
    moveEntities.push(moveStraightEntity);

    vm.prank(deployer);
    shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    vm.prank(deployer);
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: you don't own this ship"));
    vm.prank(deployer);
    moveSystem.executeTyped(shipEntities, moveEntities, 69);
  }

  function testRevertOutOfBounds() public {
    setup();
    uint32 worldRadius = GameConfigComponent(getAddressById(components, GameConfigComponentID))
      .getValue(GodID)
      .worldRadius;
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(int32(worldRadius), 0), 0);
    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntity);
    moveEntities.push(moveStraightEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));

    vm.expectRevert(bytes("MoveSystem: move out of bounds"));
    moveSystem.executeTyped(shipEntities, moveEntities, 69);
  }

  function testMove() public prank(deployer) {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntity);
    moveEntities.push(moveCardEntity);

    commitAndExecuteMove(1, shipEntities, moveEntities);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(moveCard, sailPositionComponent.getValue(shipEntity));

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
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntity);
    moveEntities.push(moveCardEntity);

    commitAndExecuteMove(1, shipEntities, moveEntities);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(moveCard, sailPositionComponent.getValue(shipEntity));

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
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);

    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity3"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntity);
    moveEntities.push(moveCardEntity);

    commitAndExecuteMove(1, shipEntities, moveEntities);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(moveCard, sailPositionComponent.getValue(shipEntity));

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

  function testGetWindBoost() public prank(deployer) {
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

  function testGetMoveWithWind() public prank(deployer) {
    setup();

    MoveCard memory moveCard = MoveCard({ distance: 20, rotation: 20, direction: 20 });

    Wind memory wind = Wind({ speed: 10, direction: 0 });

    MoveCard memory newMoveCard = LibMove.getMoveWithWind(moveCard, 90, wind);
    assertEq(moveCard.distance, newMoveCard.distance, "no wind effect distance failed");
    assertEq(moveCard.rotation, newMoveCard.rotation, "no wind effect rotation failed");
    assertEq(moveCard.direction, newMoveCard.direction, "no wind effect angle failed");

    newMoveCard = LibMove.getMoveWithWind(moveCard, 0, wind);
    assertApproxEqAbs(newMoveCard.distance, (moveCard.distance * 125) / 100, 1, "wind boost distance failed");
    assertApproxEqAbs(newMoveCard.rotation, (moveCard.rotation * 125) / 100, 1, "wind boost rotation failed");
    assertApproxEqAbs(newMoveCard.direction, (moveCard.direction * 125) / 100, 1, "wind boost angle failed");

    newMoveCard = LibMove.getMoveWithWind(moveCard, 180, wind);
    assertApproxEqAbs(newMoveCard.distance, (moveCard.distance * 75) / 100, 1, "wind debuff distance failed");
    assertApproxEqAbs(newMoveCard.rotation, (moveCard.rotation * 75) / 100, 1, "wind debuff rotation failed");
    assertApproxEqAbs(newMoveCard.direction, (moveCard.direction * 75) / 100, 1, "wind debuff angle failed");
  }

  function testGetMoveWithOpenSails() public prank(deployer) {
    MoveCard memory moveCard = MoveCard({ distance: 50, rotation: 90, direction: 45 });
    uint32 sailPosition = 2;

    MoveCard memory newMoveCard;

    newMoveCard = LibMove.getMoveWithSails(moveCard, sailPosition);
    assertEq(moveCard.distance, newMoveCard.distance, "full sails distance failed");
    assertEq(moveCard.rotation, newMoveCard.rotation, "full sails rotation failed");
    assertEq(moveCard.direction, newMoveCard.direction, "full sails angle failed");

    moveCard.rotation = 270;
    moveCard.direction = 315;

    sailPosition = 1;

    newMoveCard = LibMove.getMoveWithSails(moveCard, sailPosition);
    assertEq(newMoveCard.distance, (moveCard.distance * 33) / 100, "closed sails distance failed");
    assertEq(newMoveCard.rotation, 360 - ((360 - moveCard.rotation) * 33) / 100, "closed sails rotation failed");
    assertEq(newMoveCard.direction, 360 - ((360 - moveCard.direction) * 33) / 100, "closed sails angle failed");
  }

  function testMoveWithBattleSails() public prank(deployer) {
    setup();

    Coord memory position = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 shipEntity = shipSpawnSystem.executeTyped(position, rotation);
    uint256 moveCardEntity = uint256(keccak256("ds.prototype.moveEntity2"));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(shipEntity);
    actions.push(Action.LowerSail);
    allActions.push(actions);
    actionSystem.executeTyped(shipEntities, allActions);

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntity);
    moveEntities.push(moveCardEntity);

    commitAndExecuteMove(1, shipEntities, moveEntities);

    MoveCard memory moveCard = moveCardComponent.getValue(moveCardEntity);

    moveCard = LibMove.getMoveWithWind(moveCard, rotation, wind);

    moveCard = LibMove.getMoveWithSails(moveCard, sailPositionComponent.getValue(shipEntity));

    Coord memory expectedPosition = LibVector.getPositionByVector(
      position,
      rotation,
      moveCard.distance,
      moveCard.direction
    );
    uint32 expectedRotation = (rotation + moveCard.rotation) % 360;

    position = positionComponent.getValue(shipEntity);
    rotation = rotationComponent.getValue(shipEntity);
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    actionSystem = ActionSystem(system(ActionSystemID));
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
    wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);
  }

  function commitAndExecuteMove(
    uint32 turn,
    uint256[] memory shipEntities,
    uint256[] memory moveEntities
  ) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Reveal));
    moveSystem.executeTyped(shipEntities, moveEntities, 69);
  }
}
