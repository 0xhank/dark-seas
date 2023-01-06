// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

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
import "../../libraries/LibSpawn.sol";

import { Side, Coord, Action, ActionType, Move } from "../../libraries/DSTypes.sol";

contract AttackActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  CommitSystem commitSystem;
  MoveSystem moveSystem;

  Move[] moves;
  Action[] actions;

  function testRevertNotPlayer() public {
    setup();

    vm.expectRevert(bytes("ActionSystem: player does not exist"));
    actionSystem.executeTyped(actions);
  }

  function testRevertNotOwner() public {
    setup();

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.prank(deployer);
    shipSpawnSystem.executeTyped(Coord(0, 0), 0);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    vm.prank(deployer);

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.RepairSail, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);
    vm.expectRevert(bytes("ActionSystem: you don't own this ship"));
    actionSystem.executeTyped(actions);
  }

  function testRevertNotLoaded() public prank(deployer) {
    setup();
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Fire, ActionType.None],
      specialEntities: [cannonEntity, uint256(0)]
    });
    actions.push(action);
    vm.expectRevert(bytes("attack: cannon not loaded"));
    actionSystem.executeTyped(actions);
  }

  function testRevertSameCannon() public prank(deployer) {
    setup();
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Load, ActionType.Fire],
      specialEntities: [cannonEntity, cannonEntity]
    });
    actions.push(action);
    vm.expectRevert(bytes("ActionSystem: cannon already acted"));
    actionSystem.executeTyped(actions);
  }

  function testRevertUnloaded() public prank(deployer) {
    setup();
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord(0, 0), 0);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    loadAndFireCannon(shipEntity, cannonEntity, 2);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 4, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Fire, ActionType.None],
      specialEntities: [cannonEntity, uint256(0)]
    });
    actions.push(action);
    vm.expectRevert(bytes("attack: cannon not loaded"));
    actionSystem.executeTyped(actions);
  }

  function testAttackAction() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 attackerId = shipSpawnSystem.executeTyped(startingPosition, 350);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerId, 90, 50, 80);

    startingPosition = Coord({ x: -25, y: -25 });
    uint256 defender2Id = shipSpawnSystem.executeTyped(startingPosition, rotation);

    startingPosition = Coord({ x: 25, y: 25 });
    uint256 defenderId = shipSpawnSystem.executeTyped(startingPosition, rotation);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 orig2Health = healthComponent.getValue(defender2Id);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    loadAndFireCannon(attackerId, cannonEntity, 2);

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
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 90, 50, 80);

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));
    delete moves;
    delete actions;
    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: attackerEntity }));

    commitAndExecuteMove(2, moves);

    uint256 defenderEntity = shipSpawnSystem.executeTyped(startingPosition, 0);

    uint32 origHealth = healthComponent.getValue(defenderEntity);
    uint32 attackerHealth = healthComponent.getValue(attackerEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    loadAndFireCannon(attackerEntity, cannonEntity, 2);

    uint32 newHealth = healthComponent.getValue(attackerEntity);
    assertEq(newHealth, attackerHealth);

    newHealth = healthComponent.getValue(defenderEntity);
    assertEq(newHealth, origHealth);
  }

  function testCombatPrecise() public {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    vm.startPrank(deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 90, 50, 80);
    vm.stopPrank();

    vm.prank(alice);
    uint256 defenderEntity = shipSpawnSystem.executeTyped(Coord({ x: 9, y: 25 }), 0);
    vm.stopPrank();

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    loadAndFireCannon(attackerEntity, cannonEntity, 1);

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, cannonEntity, defenderEntity);
    console.log("expected health decrease:", ehd);
    assertEq(newHealth, origHealth - ehd);
  }

  function testCombatForward() public {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 0);

    vm.startPrank(deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 0, 50, 80);
    vm.stopPrank();

    vm.prank(alice);
    uint256 defenderEntity = shipSpawnSystem.executeTyped(Coord({ x: 20, y: 0 }), 180);
    vm.stopPrank();

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    loadAndFireCannon(attackerEntity, cannonEntity, 1);

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, cannonEntity, defenderEntity);
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
    uint256 cannonEntity,
    uint256 defenderEntity
  ) public view returns (uint32) {
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(cannonEntity);
    uint32 cannonRotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(cannonEntity);
    Coord memory attackerPosition = PositionComponent(getAddressById(components, PositionComponentID)).getValue(
      attackerEntity
    );
    (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, defenderEntity);

    uint256 distance;
    uint256 randomness = LibUtils.randomness(attackerEntity, defenderEntity);
    if (!LibCombat.isBroadside(cannonRotation)) {
      Coord[3] memory firingRange3 = LibCombat.getFiringAreaPivot(components, attackerEntity, cannonEntity);

      if (LibVector.withinPolygon3(firingRange3, aft)) {
        distance = LibVector.distance(attackerPosition, aft);
        return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
      } else if (LibVector.withinPolygon3(firingRange3, stern)) {
        distance = LibVector.distance(attackerPosition, stern);
        return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
      } else return 0;
    }
    Coord[4] memory firingRange4 = LibCombat.getFiringAreaBroadside(components, attackerEntity, cannonEntity);

    if (LibVector.withinPolygon4(firingRange4, aft)) {
      distance = LibVector.distance(attackerPosition, aft);
      return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
    } else if (LibVector.withinPolygon4(firingRange4, stern)) {
      distance = LibVector.distance(attackerPosition, stern);
      return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
    } else return 0;
  }

  function commitAndExecuteMove(uint32 turn, Move[] memory moves) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Reveal));
    moveSystem.executeTyped(moves, 69);
  }

  function loadAndFireCannon(
    uint256 shipEntity,
    uint256 cannonEntity,
    uint32 turn
  ) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Load, ActionType.None],
      specialEntities: [cannonEntity, uint256(0)]
    });
    actions.push(action);
    actionSystem.executeTyped(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn + 1, Phase.Action));
    delete actions;
    action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Fire, ActionType.None],
      specialEntities: [cannonEntity, uint256(0)]
    });
    actions.push(action);
    actionSystem.executeTyped(actions);
    delete actions;
  }
}
