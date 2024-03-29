// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";

// Components
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../../components/FirepowerComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "../../components/BootyComponent.sol";
import { KillsComponent, ID as KillsComponentID } from "../../components/KillsComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
// Libraries
import "../../libraries/LibVector.sol";
import "../../libraries/LibCombat.sol";
import "../../libraries/LibTurn.sol";
import "../../libraries/LibUtils.sol";
import "../../libraries/LibSpawn.sol";

import { Coord, Action, ActionType, Move } from "../../libraries/DSTypes.sol";

contract AttackActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  ActionSystem actionSystem;
  CommitSystem commitSystem;
  MoveSystem moveSystem;

  Move[] moves;
  Action[] actions;
  uint256[] targets;

  bytes none = abi.encode(0);

  function testRevertNotPlayer() public prank(deployer) {
    setup();

    vm.expectRevert(bytes("ActionSystem: player does not exist"));
    actionSystem.executeTyped(actions);
  }

  function testRevertNotOwner() public prank(deployer) {
    setup();

    uint256 shipEntity = spawnShip(Coord(0, 0), 0, alice);
    spawnShip(Coord(0, 0), 0, deployer);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.RepairSail, ActionType.None],
      metadata: [none, none]
    });
    actions.push(action);
    vm.expectRevert(bytes("ActionSystem: you don't own this ship"));
    actionSystem.executeTyped(actions);
  }

  function testRevertNotLoaded() public prank(deployer) {
    setup();
    uint256 shipEntity = spawnShip(Coord(0, 0), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Fire, ActionType.None],
      metadata: [abi.encode(cannonEntity, targets), none]
    });
    actions.push(action);
    vm.expectRevert(bytes("attack: cannon not loaded"));
    actionSystem.executeTyped(actions);
  }

  function testRevertSameCannon() public prank(deployer) {
    setup();
    uint256 shipEntity = spawnShip(Coord(0, 0), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Load, ActionType.Fire],
      metadata: [abi.encode(cannonEntity), abi.encode(cannonEntity, targets)]
    });
    actions.push(action);
    vm.expectRevert(bytes("ActionSystem: cannon already acted"));
    actionSystem.executeTyped(actions);
  }

  function testRevertUnloaded() public prank(deployer) {
    setup();
    uint256 shipEntity = spawnShip(Coord(0, 0), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, shipEntity, 90, 50, 80);
    uint256 defenderId = spawnShip(Coord(69, 69), 69, deployer);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    loadAndFireCannon(shipEntity, cannonEntity, defenderId, 2);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 4, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Fire, ActionType.None],
      metadata: [abi.encode(cannonEntity, targets), none]
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
    uint256 attackerId = spawnShip(startingPosition, 350, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerId, 90, 50, 80);

    startingPosition = Coord({ x: -25, y: -25 });
    uint256 defender2Id = spawnShip(startingPosition, rotation, deployer);

    startingPosition = Coord({ x: 25, y: 25 });
    uint256 defenderId = spawnShip(startingPosition, rotation, deployer);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 orig2Health = healthComponent.getValue(defender2Id);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    loadAndFireCannon(attackerId, cannonEntity, defenderId, 2);

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
    uint256 attackerEntity = spawnShip(startingPosition, 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 90, 50, 80);

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: attackerEntity }));

    commitAndExecuteMove(2, moves);

    uint256 defenderEntity = spawnShip(startingPosition, 0, deployer);

    uint32 origHealth = healthComponent.getValue(defenderEntity);
    uint32 attackerHealth = healthComponent.getValue(attackerEntity);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    loadAndFireCannon(attackerEntity, cannonEntity, defenderEntity, 2);

    uint32 newHealth = healthComponent.getValue(attackerEntity);
    assertEq(newHealth, attackerHealth);

    newHealth = healthComponent.getValue(defenderEntity);
    assertEq(newHealth, origHealth);
  }

  function testCombatPrecise() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerEntity = spawnShip(Coord({ x: 0, y: 0 }), 350, deployer);

    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 90, 50, 80);

    uint256 defenderEntity = spawnShip(Coord({ x: 9, y: 25 }), 0, alice);

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    loadAndFireCannon(attackerEntity, cannonEntity, defenderEntity, 1);

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, cannonEntity, defenderEntity);
    console.log("expected health decrease:", ehd);
    assertEq(newHealth, origHealth - ehd);
  }

  function testCombatForward() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerEntity = spawnShip(Coord({ x: 0, y: 0 }), 0, deployer);

    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 0, 50, 80);

    uint256 defenderEntity = spawnShip(Coord({ x: 20, y: 0 }), 180, alice);

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    loadAndFireCannon(attackerEntity, cannonEntity, defenderEntity, 1);

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, cannonEntity, defenderEntity);
    assertEq(newHealth, origHealth - ehd);
  }

  function testKill() public prank(deployer) {
    setup();
    KillsComponent killsComponent = KillsComponent(getAddressById(components, KillsComponentID));
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerEntity = spawnShip(Coord({ x: 0, y: 0 }), 0, deployer);
    uint256 ownerEntity = ownedByComponent.getValue(attackerEntity);
    uint256 defenderEntity = spawnShip(Coord({ x: 20, y: 0 }), 180, alice);

    uint256 attackerBooty = bootyComponent.getValue(attackerEntity);
    uint256 defenderBooty = bootyComponent.getValue(defenderEntity);
    uint256 ownerBooty = bootyComponent.getValue(ownerEntity);

    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 0, 50, 80);

    healthComponent.set(defenderEntity, 1);
    healthComponent.set(attackerEntity, 1);

    loadAndFireCannon(attackerEntity, cannonEntity, defenderEntity, 1);

    assertEq(healthComponent.getValue(defenderEntity), 0);
    assertEq(killsComponent.getValue(attackerEntity), 1);
    assertEq(bootyComponent.getValue(defenderEntity), 0);
    assertEq(bootyComponent.getValue(attackerEntity), attackerBooty + defenderBooty / 2);

    assertEq(bootyComponent.getValue(ownerEntity), ownerBooty + defenderBooty / 2);
    assertEq(healthComponent.getValue(attackerEntity), 2);
  }

  function testFireDeathPriorAttacker() public prank(deployer) {
    setup();
    KillsComponent killsComponent = KillsComponent(getAddressById(components, KillsComponentID));
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    uint256 attackerEntity = spawnShip(Coord({ x: 0, y: 0 }), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(components, world, attackerEntity, 0, 50, 80);

    uint256 defenderEntity = spawnShip(Coord({ x: 20, y: 0 }), 180, alice);

    loadAndFireCannon(attackerEntity, cannonEntity, defenderEntity, 1);

    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(HealthComponentID, defenderEntity, abi.encode(1));
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(OnFireComponentID, defenderEntity, abi.encode(2));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 69, Phase.Action));
    uint256 attackerBooty = bootyComponent.getValue(attackerEntity);
    uint256 defenderBooty = bootyComponent.getValue(defenderEntity);
    uint256 ownerBooty = bootyComponent.getValue(addressToEntity(deployer));
    vm.stopPrank();
    vm.startPrank(alice);
    Action memory action = Action({
      shipEntity: defenderEntity,
      actionTypes: [ActionType.None, ActionType.None],
      metadata: [none, none]
    });
    actions.push(action);

    actionSystem.executeTyped(actions);

    assertEq(healthComponent.getValue(defenderEntity), 0);
    assertEq(killsComponent.getValue(attackerEntity), 1);
    assertEq(bootyComponent.getValue(defenderEntity), 0);
    assertEq(bootyComponent.getValue(attackerEntity), attackerBooty + defenderBooty / 2);
    assertEq(bootyComponent.getValue(addressToEntity(deployer)), ownerBooty + defenderBooty / 2);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));

    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    gameConfig.entryCutoffTurns = 0;

    GameConfigComponent(getAddressById(components, GameConfigComponentID)).set(GodID, gameConfig);
    delete moves;
    delete actions;
    delete targets;
  }

  function expectedHealthDecrease(
    uint256 attackerEntity,
    uint256 cannonEntity,
    uint256 defenderEntity
  ) public view returns (uint32) {
    uint32 kills = KillsComponent(getAddressById(components, KillsComponentID)).getValue(attackerEntity);
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(cannonEntity);
    firepower = (firepower * (kills + 10)) / 10;
    (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternPosition(components, defenderEntity);

    uint256 randomness = LibUtils.randomness(attackerEntity, defenderEntity);
    Coord[] memory firingRange = LibCombat.getFiringArea(components, attackerEntity, cannonEntity);

    if (
      LibVector.withinPolygon(aft, firingRange) ||
      LibVector.lineIntersectsPolygon(Line({ start: stern, end: aft }), firingRange)
    ) {
      uint256 distance = LibVector.distance(firingRange[0], aft);
      return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
    } else return 0;
  }

  function commitAndExecuteMove(uint32 turn, Move[] memory _moves) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(_moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Reveal));
    moveSystem.executeTyped(_moves, 69);
  }

  function loadAndFireCannon(
    uint256 shipEntity,
    uint256 cannonEntity,
    uint256 targetEntity,
    uint32 turn
  ) internal {
    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Load, ActionType.None],
      metadata: [abi.encode(cannonEntity), none]
    });
    actions.push(action);
    actionSystem.executeTyped(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, turn + 1, Phase.Action));
    delete actions;

    targets.push(targetEntity);
    action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.Fire, ActionType.None],
      metadata: [abi.encode(cannonEntity, targets), none]
    });
    actions.push(action);
    actionSystem.executeTyped(actions);
    delete actions;
    delete targets;
  }
}
