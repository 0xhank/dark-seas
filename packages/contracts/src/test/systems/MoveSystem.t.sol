// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord, PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID } from "../../components/WindComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "../../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { Wind, GodID, MoveCard, Action, GameConfig } from "../../libraries/DSTypes.sol";

import "../../libraries/LibMove.sol";

contract MoveSystemTest is MudTest {
  uint256 entityId;
  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  Wind wind;
  WindComponent windComponent;
  MoveSystem moveSystem;
  ShipSpawnSystem shipSpawnSystem;
  ActionSystem actionSystem;
  GameConfig gameConfig;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[][] allActions = new Action[][](0);
  Action[] actions = new Action[](0);

  function testMove() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 shipEntity2Id = shipSpawnSystem.executeTyped(startingPosition, 0);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    console.log("move straight entity id", moveStraightEntityId);
    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);
    shipEntities.push(shipEntity2Id);
    moveEntities.push(moveStraightEntityId);

    uint256 newTurn = 2 * (gameConfig.movePhaseLength + gameConfig.actionPhaseLength) + 2;

    vm.warp(newTurn);

    moveSystem.executeTyped(shipEntities, moveEntities);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x + 21, y: startingPosition.y + 21 }), currPosition);
    assertEq(playerRotation, startingRotation);

    currPosition = positionComponent.getValue(shipEntity2Id);
    playerRotation = rotationComponent.getValue(shipEntity2Id);
    assertCoordEq(Coord({ x: startingPosition.x + 20, y: startingPosition.y }), currPosition);
    assertEq(playerRotation, 0);
  }

  function testRevertShipDed() public {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    uint256 newTurn = gameConfig.movePhaseLength + gameConfig.actionPhaseLength + 2;
    vm.warp(newTurn);

    delete shipEntities;
    delete moveEntities;

    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);
    componentDevSystem.executeTyped(HealthComponentID, shipEntityId, abi.encode(0));

    vm.expectRevert(bytes("MoveSystem: ship is sunk"));
    moveSystem.executeTyped(shipEntities, moveEntities);
  }

  function testRevertCruDed() public {
    setup();

    ComponentDevSystem componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    CrewCountComponent crewCountComponent = CrewCountComponent(getAddressById(components, CrewCountComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    uint256 newTurn = gameConfig.movePhaseLength + gameConfig.actionPhaseLength + 2;
    vm.warp(newTurn);

    delete shipEntities;
    delete moveEntities;

    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);
    componentDevSystem.executeTyped(CrewCountComponentID, shipEntityId, abi.encode(0));

    vm.expectRevert(bytes("MoveSystem: ship has no crew"));
    moveSystem.executeTyped(shipEntities, moveEntities);
  }

  function testRevertNotPlayer() public {
    setup();

    vm.expectRevert(bytes("MoveSystem: player does not exist"));
    moveSystem.executeTyped(shipEntities, moveEntities);
  }

  function testRevertNotOwner() public {
    setup();

    uint256 shipEntityId = shipSpawnSystem.executeTyped(Coord(0, 0), 0);
    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);

    uint256 newTurn = 2 * (gameConfig.movePhaseLength + gameConfig.actionPhaseLength) + 2;

    vm.warp(newTurn);

    vm.prank(deployer);
    shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.prank(deployer);

    vm.expectRevert(bytes("MoveSystem: you don't own this ship"));
    moveSystem.executeTyped(shipEntities, moveEntities);
  }

  function testRevertOutOfBounds() public {
    setup();
    uint32 worldRadius = GameConfigComponent(getAddressById(components, GameConfigComponentID))
      .getValue(GodID)
      .worldRadius;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(Coord(int32(worldRadius), 0), 0);
    uint256 moveStraightId = uint256(keccak256("ds.prototype.moveEntity1"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightId);

    uint256 newTurn = gameConfig.movePhaseLength + gameConfig.actionPhaseLength + 2;
    vm.warp(newTurn);

    vm.expectRevert(bytes("MoveSystem: move out of bounds"));
    moveSystem.executeTyped(shipEntities, moveEntities);
  }

  function testMoveHardRight() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 moveHardRightId = uint256(keccak256("ds.prototype.moveEntity2"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntityId);
    moveEntities.push(moveHardRightId);

    uint256 newTurn = gameConfig.movePhaseLength + gameConfig.actionPhaseLength + 2;
    vm.warp(newTurn);

    moveSystem.executeTyped(shipEntities, moveEntities);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x, y: startingPosition.y + 29 }), currPosition);
    assertEq(playerRotation, (startingRotation + 90) % 360);
  }

  function testMoveSoftRight() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 108;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity3"));

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);

    uint256 newTurn = gameConfig.movePhaseLength + gameConfig.actionPhaseLength + 2;
    vm.warp(newTurn);

    moveSystem.executeTyped(shipEntities, moveEntities);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);
    uint32 playerRotation = rotationComponent.getValue(shipEntityId);
    assertCoordEq(Coord({ x: startingPosition.x - 7, y: startingPosition.y + 7 }), currPosition);
    assertEq(playerRotation, (startingRotation + 45) % 360);
  }

  function testGetWindBoost() public prank(deployer) {
    setup();

    assertEq(LibMove.getWindBoost(wind, 90), -10);
    assertEq(LibMove.getWindBoost(wind, 112), 10);
    assertEq(LibMove.getWindBoost(wind, 171), 0);
    assertEq(LibMove.getWindBoost(wind, 211), -10);
    assertEq(LibMove.getWindBoost(wind, 331), 0);
    assertEq(LibMove.getWindBoost(wind, 11), 10);
    assertEq(LibMove.getWindBoost(wind, 70), -10);
  }

  function testGetMoveDistanceWithWind() public prank(deployer) {
    setup();

    uint32 moveDistance = LibMove.getMoveDistanceWithWind(20, 90, wind);
    assertEq(moveDistance, 10);

    moveDistance = LibMove.getMoveDistanceWithWind(5, 90, wind);
    assertEq(moveDistance, 0);

    moveDistance = LibMove.getMoveDistanceWithWind(10, 130, wind);
    assertEq(moveDistance, 20);

    moveDistance = LibMove.getMoveDistanceWithWind(10, 190, wind);
    assertEq(moveDistance, 10);
  }

  function testGetMoveWithOpenSails() public prank(deployer) {
    MoveCard memory moveCard = MoveCard({ distance: 50, rotation: 90, direction: 45 });
    uint32 sailPosition = 3;

    MoveCard memory newMoveCard;

    newMoveCard = LibMove.getMoveWithSails(moveCard, sailPosition);
    assertEq(moveCard.distance, newMoveCard.distance, "full sails distance failed");
    assertEq(moveCard.rotation, newMoveCard.rotation, "full sails rotation failed");
    assertEq(moveCard.direction, newMoveCard.direction, "full sails angle failed");

    sailPosition = 2;
    newMoveCard = LibMove.getMoveWithSails(moveCard, sailPosition);
    assertApproxEqAbs(moveCard.distance, (newMoveCard.distance * 100) / 75, 1, "battle sails distance failed");
    assertApproxEqAbs(moveCard.rotation, (newMoveCard.rotation * 100) / 75, 1, "battle sails rotation failed");
    assertApproxEqAbs(moveCard.direction, (newMoveCard.direction * 100) / 75, 1, "battle sails angle failed");

    moveCard.rotation = 270;
    moveCard.direction = 315;

    sailPosition = 1;

    newMoveCard = LibMove.getMoveWithSails(moveCard, sailPosition);
    assertEq(newMoveCard.distance, 20, "closed sails distance failed");
    assertEq(newMoveCard.rotation, 324, "closed sails rotation failed");
    assertEq(newMoveCard.direction, 342, "closed sails angle failed");
  }

  function testMoveWithBattleSails() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 0;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    vm.warp(gameConfig.movePhaseLength + 1);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(shipEntityId);
    actions.push(Action.LowerSail);
    allActions.push(actions);
    actionSystem.executeTyped(shipEntities, allActions);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    vm.warp(gameConfig.actionPhaseLength);

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);

    newTurn = 2 * (gameConfig.movePhaseLength + gameConfig.actionPhaseLength) + 2;
    vm.warp(newTurn);

    moveSystem.executeTyped(shipEntities, moveEntities);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);

    assertCoordEq(currPosition, Coord({ x: 15, y: 0 }));
  }

  function testMoveWithClosedSails() public prank(deployer) {
    setup();

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 0;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(shipEntityId);
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);
    allActions.push(actions);
    actionSystem.executeTyped(shipEntities, allActions);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    vm.warp(gameConfig.actionPhaseLength);

    delete shipEntities;
    delete moveEntities;
    shipEntities.push(shipEntityId);
    moveEntities.push(moveStraightEntityId);

    newTurn = 2 * (gameConfig.movePhaseLength + gameConfig.actionPhaseLength) + 2;
    vm.warp(newTurn);

    moveSystem.executeTyped(shipEntities, moveEntities);

    Coord memory currPosition = positionComponent.getValue(shipEntityId);

    assertCoordEq(currPosition, Coord({ x: 8, y: 0 }));
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));
    actionSystem = ActionSystem(system(ActionSystemID));
    entityId = addressToEntity(deployer);
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
    wind = WindComponent(getAddressById(components, WindComponentID)).getValue(GodID);
    gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(GodID);
  }
}
