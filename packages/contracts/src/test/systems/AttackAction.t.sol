// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";

// Components
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../../components/FirepowerComponent.sol";

// Libraries
import "../../libraries/LibVector.sol";
import "../../libraries/LibCombat.sol";
import "../../libraries/LibTurn.sol";
import "../../libraries/LibUtils.sol";

import { Side, Coord, Action } from "../../libraries/DSTypes.sol";

contract AttackActionTest is MudTest {
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  CommitSystem commitSystem;
  MoveSystem moveSystem;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[][] allActions = new Action[][](0);
  Action[] actions = new Action[](0);

  function testRevertNotPlayer() public {
    setup();

    vm.expectRevert(bytes("ActionSystem: player does not exist"));
    actionSystem.executeTyped(shipEntities, allActions);
  }

  function testRevertNotOwner() public {
    setup();

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.prank(deployer);
    shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    vm.prank(deployer);

    shipEntities.push(shipEntity);
    allActions.push(actions);

    vm.expectRevert(bytes("ActionSystem: you don't own this ship"));
    actionSystem.executeTyped(shipEntities, allActions);
  }

  function testAttackAction() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 attackerId = shipSpawnSystem.executeTyped(startingPosition, 350);

    startingPosition = Coord({ x: -25, y: -25 });
    uint256 defender2Id = shipSpawnSystem.executeTyped(startingPosition, rotation);

    startingPosition = Coord({ x: 25, y: 25 });
    uint256 defenderId = shipSpawnSystem.executeTyped(startingPosition, rotation);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 orig2Health = healthComponent.getValue(defender2Id);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(attackerId);
    actions.push(Action.FireRight);
    allActions.push(actions);
    actionSystem.executeTyped(shipEntities, allActions);

    uint32 newHealth = healthComponent.getValue(defenderId);

    assertGe(newHealth, origHealth - 1);

    newHealth = healthComponent.getValue(defender2Id);
    assertEq(newHealth, orig2Health);

    newHealth = healthComponent.getValue(attackerId);
    assertEq(newHealth, attackerHealth);
  }

  function testCombatAfterMove() public prank(deployer) {
    setup();
    HealthComponent healthComponent = HealthComponent(component(HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint256 attackerEntity = shipSpawnSystem.executeTyped(startingPosition, 0);

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    shipEntities.push(attackerEntity);
    moveEntities.push(moveStraightEntity);

    commitAndExecuteMove(2, shipEntities, moveEntities);

    uint256 defenderEntity = shipSpawnSystem.executeTyped(startingPosition, 0);

    uint32 origHealth = healthComponent.getValue(defenderEntity);
    uint32 attackerHealth = healthComponent.getValue(attackerEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(attackerEntity);
    actions.push(Action.FireRight);
    allActions.push(actions);
    actionSystem.executeTyped(shipEntities, allActions);

    uint32 newHealth = healthComponent.getValue(attackerEntity);
    assertEq(newHealth, attackerHealth);

    newHealth = healthComponent.getValue(defenderEntity);
    assertEq(newHealth, origHealth);
  }

  function testCombatPrecise() public {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    vm.prank(deployer);
    uint256 defenderEntity = shipSpawnSystem.executeTyped(Coord({ x: 9, y: 25 }), 0);

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(attackerEntity);
    actions.push(Action.FireRight);
    allActions.push(actions);

    uint256 gas = gasleft();
    actionSystem.executeTyped(shipEntities, allActions);

    console.log("gas:", gas - gasleft());

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, defenderEntity, Side.Right);
    console.log("expected health decrease:", ehd);
    assertEq(newHealth, origHealth - ehd);
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    actionSystem = ActionSystem(system(ActionSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));
  }

  function expectedHealthDecrease(
    uint256 attackerEntity,
    uint256 defenderEntity,
    Side side
  ) public view returns (uint32) {
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(attackerEntity);
    Coord memory attackerPosition = PositionComponent(getAddressById(components, PositionComponentID)).getValue(
      attackerEntity
    );
    (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, defenderEntity);
    Coord[4] memory firingRange = LibCombat.getFiringArea(components, attackerEntity, side);

    uint256 distance;
    uint256 randomness = LibUtils.randomness(attackerEntity, defenderEntity);
    Coord[4] memory firingRange = LibCombat.getFiringAreaSide(components, attackerEntity, side);

    if (LibVector.withinPolygon4(firingRange, aft)) {
      distance = LibVector.distance(attackerPosition, aft);
      return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
    } else if (LibVector.withinPolygon4(firingRange, stern)) {
      distance = LibVector.distance(attackerPosition, stern);
      return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
    } else return 0;
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
