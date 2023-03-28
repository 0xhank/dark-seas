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
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { UpgradeComponent, ID as UpgradeComponentID } from "../../components/UpgradeComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
// Libraries
import "../../libraries/LibVector.sol";
import "../../libraries/LibCombat.sol";
import "../../libraries/LibTurn.sol";
import "../../libraries/LibUtils.sol";
import "../../libraries/LibSpawn.sol";

import { Coord, Action, Move } from "../../libraries/DSTypes.sol";

contract AttackActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  ActionSystem actionSystem;
  CommitSystem commitSystem;
  MoveSystem moveSystem;

  Move[] moves;
  Action[] actions;
  uint256[] targets;

  function testRevertNotPlayer() public prank(deployer) {
    uint256 gameId = setup();

    vm.expectRevert(bytes("ActionSystem: player does not exist"));
    actionSystem.executeTyped(gameId, actions);
  }

  function testRevertNotOwner() public prank(deployer) {
    uint256 gameId = setup();

    uint256 shipEntity = spawnShip(gameId, Coord(0, 0), 0, alice);
    spawnShip(gameId, Coord(0, 0), 0, deployer);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.repairSail"), none],
      metadata: [none, none]
    });
    actions.push(action);
    vm.expectRevert(bytes("ActionSystem: you don't own this ship"));
    actionSystem.executeTyped(gameId, actions);
  }

  function testRevertNotLoaded() public prank(deployer) {
    uint256 gameId = setup();
    uint256 shipEntity = spawnShip(gameId, Coord(0, 0), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 90, 50, 80);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.fire"), none],
      metadata: [abi.encode(cannonEntity, targets), none]
    });
    actions.push(action);
    vm.expectRevert(bytes("attack: cannon not loaded"));
    actionSystem.executeTyped(gameId, actions);
  }

  function testRevertSameCannon() public prank(deployer) {
    uint256 gameId = setup();
    uint256 shipEntity = spawnShip(gameId, Coord(0, 0), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 90, 50, 80);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.load"), bytes("action.fire")],
      metadata: [abi.encode(cannonEntity), abi.encode(cannonEntity, targets)]
    });
    actions.push(action);
    vm.expectRevert(bytes("ActionSystem: cannon already acted"));
    actionSystem.executeTyped(gameId, actions);
  }

  function testRevertUnloaded() public prank(deployer) {
    uint256 gameId = setup();
    uint256 shipEntity = spawnShip(gameId, Coord(0, 0), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, shipEntity, 90, 50, 80);
    uint256 defenderId = spawnShip(gameId, Coord(69, 69), 69, deployer);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    loadAndFireCannon(gameId, shipEntity, cannonEntity, defenderId, 2);
    vm.warp(getTurnAndPhaseTime(world, gameId, 4, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.fire"), none],
      metadata: [abi.encode(cannonEntity, targets), none]
    });
    actions.push(action);
    vm.expectRevert(bytes("attack: cannon not loaded"));
    actionSystem.executeTyped(gameId, actions);
  }

  function testAttackAction() public prank(deployer) {
    uint256 gameId = setup();

    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 attackerId = spawnShip(gameId, startingPosition, 350, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, attackerId, 90, 10, 80);

    startingPosition = Coord({ x: -25, y: -25 });
    uint256 defender2Id = spawnShip(gameId, startingPosition, rotation, deployer);

    startingPosition = Coord({ x: 10, y: 10 });
    uint256 defenderId = spawnShip(gameId, startingPosition, rotation, deployer);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 orig2Health = healthComponent.getValue(defender2Id);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    loadAndFireCannon(gameId, attackerId, cannonEntity, defenderId, 2);

    uint32 newHealth = healthComponent.getValue(defenderId);

    assertLe(newHealth, origHealth - 1);

    newHealth = healthComponent.getValue(defender2Id);
    assertEq(newHealth, orig2Health);

    newHealth = healthComponent.getValue(attackerId);
    assertEq(newHealth, attackerHealth);
  }

  function testCombatAfterMove() public prank(deployer) {
    uint256 gameId = setup();
    HealthComponent healthComponent = HealthComponent(component(HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint256 attackerEntity = spawnShip(gameId, startingPosition, 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, attackerEntity, 90, 50, 80);

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: attackerEntity }));

    commitAndExecuteMove(gameId, 2, moves);

    uint256 defenderEntity = spawnShip(gameId, startingPosition, 0, deployer);

    uint32 origHealth = healthComponent.getValue(defenderEntity);
    uint32 attackerHealth = healthComponent.getValue(attackerEntity);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    loadAndFireCannon(gameId, attackerEntity, cannonEntity, defenderEntity, 2);

    uint32 newHealth = healthComponent.getValue(attackerEntity);
    assertEq(newHealth, attackerHealth);

    newHealth = healthComponent.getValue(defenderEntity);
    assertEq(newHealth, origHealth);
  }

  function testCombatPrecise() public prank(deployer) {
    uint256 gameId = setup();

    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));

    uint256 attackerEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);

    uint256 cannonEntity = LibSpawn.spawnCannon(world, attackerEntity, 90, 50, 80);

    uint256 defenderEntity = spawnShip(gameId, Coord({ x: 9, y: 25 }), 0, alice);

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    loadAndFireCannon(gameId, attackerEntity, cannonEntity, defenderEntity, 1);

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, cannonEntity, defenderEntity);
    console.log("expected health decrease:", ehd);
    assertEq(newHealth, origHealth - ehd);
  }

  function testCombatForward() public prank(deployer) {
    uint256 gameId = setup();

    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));

    uint256 attackerEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 0, deployer);

    uint256 cannonEntity = LibSpawn.spawnCannon(world, attackerEntity, 0, 50, 80);

    uint256 defenderEntity = spawnShip(gameId, Coord({ x: 20, y: 0 }), 180, alice);

    uint32 origHealth = healthComponent.getValue(defenderEntity);

    loadAndFireCannon(gameId, attackerEntity, cannonEntity, defenderEntity, 1);

    uint32 newHealth = healthComponent.getValue(defenderEntity);

    uint32 ehd = expectedHealthDecrease(attackerEntity, cannonEntity, defenderEntity);
    assertEq(newHealth, origHealth - ehd);
  }

  function testKill() public prank(deployer) {
    uint256 gameId = setup();
    OwnedByComponent ownedByComponent = OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID));
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));

    uint256 attackerEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 0, deployer);
    uint256 ownerEntity = ownedByComponent.getValue(attackerEntity);
    uint256 defenderEntity = spawnShip(gameId, Coord({ x: 20, y: 0 }), 180, alice);

    uint256 cannonEntity = LibSpawn.spawnCannon(world, attackerEntity, 0, 50, 80);

    healthComponent.set(defenderEntity, 1);
    healthComponent.set(attackerEntity, 1);

    loadAndFireCannon(gameId, attackerEntity, cannonEntity, defenderEntity, 1);

    assertTrue(!CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).has(defenderEntity));
    assertEq(healthComponent.getValue(attackerEntity), 1);
    (uint256[] memory crates, ) = LibUtils.getEntityWith(world, UpgradeComponentID);
    assertEq(crates.length, 1);

    assertCoordEq(positionComponent.getValue(defenderEntity), positionComponent.getValue(crates[0]));
  }

  function testFireDeathPriorAttacker() public prank(deployer) {
    uint256 gameId = setup();
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    uint256 attackerEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 0, deployer);
    uint256 cannonEntity = LibSpawn.spawnCannon(world, attackerEntity, 0, 50, 80);

    uint256 defenderEntity = spawnShip(gameId, Coord({ x: 20, y: 0 }), 180, alice);

    loadAndFireCannon(gameId, attackerEntity, cannonEntity, defenderEntity, 1);
    assertEq(
      LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).getValue(defenderEntity),
      attackerEntity
    );
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(HealthComponentID, defenderEntity, abi.encode(1));
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(OnFireComponentID, defenderEntity, abi.encode(2));

    vm.warp(getTurnAndPhaseTime(world, gameId, 69, Phase.Action));
    vm.stopPrank();
    vm.startPrank(alice);
    Action memory action = Action({ shipEntity: defenderEntity, actions: [none, none], metadata: [none, none] });
    actions.push(action);

    actionSystem.executeTyped(gameId, actions);
    assertEq(
      LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).getValue(defenderEntity),
      attackerEntity
    );
  }

  /**
   * Helpers
   */

  function setup() internal returns (uint256 gameId) {
    bytes memory id = InitSystem(system(InitSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    actionSystem = ActionSystem(system(ActionSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    moveSystem = MoveSystem(system(MoveSystemID));

    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    gameConfig.entryCutoffTurns = 0;

    GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).set(gameId, gameConfig);
    delete moves;
    delete actions;
    delete targets;

    return gameId;
  }

  function expectedHealthDecrease(
    uint256 attackerEntity,
    uint256 cannonEntity,
    uint256 defenderEntity
  ) public view returns (uint32) {
    FirepowerComponent firepowerComponent = FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID));
    uint32 firepower = firepowerComponent.getValue(cannonEntity) + firepowerComponent.getValue(attackerEntity);

    (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternPosition(world, defenderEntity);
    uint256 randomness = LibUtils.randomness(attackerEntity, defenderEntity);
    Coord[] memory firingRange = LibCombat.getFiringArea(world, attackerEntity, cannonEntity);

    if (
      LibVector.withinPolygon(aft, firingRange) ||
      LibVector.lineIntersectsPolygon(Line({ start: stern, end: aft }), firingRange)
    ) {
      uint256 distance = LibVector.distance(firingRange[0], aft);
      return LibCombat.getHullDamage(LibCombat.getBaseHitChance(distance, firepower), randomness);
    } else return 0;
  }

  function commitAndExecuteMove(uint256 gameId, uint32 turn, Move[] memory _moves) internal {
    vm.warp(getTurnAndPhaseTime(world, gameId, turn, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(gameId, _moves, 69)));
    commitSystem.executeTyped(gameId, commitment);

    vm.warp(getTurnAndPhaseTime(world, gameId, turn, Phase.Reveal));
    moveSystem.executeTyped(gameId, _moves, 69);
  }

  function loadAndFireCannon(
    uint256 gameId,
    uint256 shipEntity,
    uint256 cannonEntity,
    uint256 targetEntity,
    uint32 turn
  ) internal {
    vm.warp(getTurnAndPhaseTime(world, gameId, turn, Phase.Action));
    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.load"), none],
      metadata: [abi.encode(cannonEntity), none]
    });
    actions.push(action);
    actionSystem.executeTyped(gameId, actions);

    vm.warp(getTurnAndPhaseTime(world, gameId, turn + 1, Phase.Action));
    delete actions;
    targets.push(targetEntity);
    action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.fire"), none],
      metadata: [abi.encode(cannonEntity, targets), none]
    });
    actions.push(action);
    actionSystem.executeTyped(gameId, actions);
    delete actions;
    delete targets;
  }
}
