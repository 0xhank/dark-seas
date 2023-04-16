// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";

// Components
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../../components/DamagedCannonsComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";

// Types
import { Action, Coord, Move } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract DamageTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ComponentDevSystem componentDevSystem;

  Action[] actions;
  Move[] moves;

  function testDamagedCannonsEffect() public prank(deployer) {
    uint256 gameId = setup();
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      LibUtils.addressById(world, DamagedCannonsComponentID)
    );
    uint256 attackerEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);

    componentDevSystem.executeTyped(DamagedCannonsComponentID, attackerEntity, abi.encode(2));
    assertEq(damagedCannonsComponent.getValue(attackerEntity), 2);

    Action memory action = Action({
      shipEntity: attackerEntity,
      actions: [bytes("action.repairCannons"), none],
      metadata: [none, none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    actionSystem.executeTyped(gameId, actions);
    assertTrue(damagedCannonsComponent.has(attackerEntity));
    assertEq(damagedCannonsComponent.getValue(attackerEntity), 1);
  }

  function testFireEffect() public prank(deployer) {
    uint256 gameId = setup();
    uint256 shipEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);

    OnFireComponent onFireComponent = OnFireComponent(LibUtils.addressById(world, OnFireComponentID));

    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));

    componentDevSystem.executeTyped(OnFireComponentID, shipEntity, abi.encode(2));

    assertTrue(onFireComponent.getValue(shipEntity) == 2);

    uint32 health = healthComponent.getValue(shipEntity);

    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.extinguishFire"), none],
      metadata: [none, none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    actionSystem.executeTyped(gameId, actions);
    assertTrue(onFireComponent.has(shipEntity));
    assertEq(healthComponent.getValue(shipEntity), health - 1);
  }

  function testFireDeathNoAttacker() public prank(deployer) {
    uint256 gameId = setup();
    uint256 shipEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));

    componentDevSystem.executeTyped(HealthComponentID, shipEntity, abi.encode(1));
    componentDevSystem.executeTyped(OnFireComponentID, shipEntity, abi.encode(2));

    vm.warp(getTurnAndPhaseTime(world, gameId, 69, Phase.Action));

    Action memory action = Action({ shipEntity: shipEntity, actions: [none, none], metadata: [none, none] });
    actions.push(action);

    actionSystem.executeTyped(gameId, actions);

    assertTrue(!CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).has(shipEntity));
  }

  function testDamagedSailEffect() public prank(deployer) {
    uint256 gameId = setup();

    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    uint256 shipEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);

    Coord memory position = positionComponent.getValue(shipEntity);
    uint32 rotation = rotationComponent.getValue(shipEntity);
    componentDevSystem.executeTyped(SailPositionComponentID, shipEntity, abi.encode(0));
    Move memory move = Move({ shipEntity: shipEntity, moveCardEntity: moveStraightEntity });

    moves.push(move);
    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(gameId, moves, 69)));
    CommitSystem(system(CommitSystemID)).executeTyped(gameId, commitment);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Reveal));
    MoveSystem(system(MoveSystemID)).executeTyped(gameId, moves, 69);

    assertCoordEq(positionComponent.getValue(shipEntity), position);
    assertEq(rotationComponent.getValue(shipEntity), rotation);
  }

  /**
   * Helpers
   */

  function setup() internal returns (uint256 gameId) {
    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    actionSystem = ActionSystem(system(ActionSystemID));
    componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    sailPositionComponent = SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID));
    delete moves;
    delete actions;
  }
}
