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

  bytes none = abi.encode(0);

  function testDamagedCannonsEffect() public prank(deployer) {
    setup();
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      LibUtils.addressById(world, DamagedCannonsComponentID)
    );
    uint256 attackerEntity = spawnShip(Coord({ x: 0, y: 0 }), 350, deployer);

    componentDevSystem.executeTyped(DamagedCannonsComponentID, attackerEntity, abi.encode(2));
    assertEq(damagedCannonsComponent.getValue(attackerEntity), 2);

    Action memory action = Action({
      shipEntity: attackerEntity,
      actions: [bytes("action.repairCannons"), none],
      metadata: [none, none]
    });
    actions.push(action);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Action));

    actionSystem.executeTyped(actions);
    assertTrue(damagedCannonsComponent.has(attackerEntity));
    assertEq(damagedCannonsComponent.getValue(attackerEntity), 1);
  }

  function testFireEffect() public prank(deployer) {
    setup();
    uint256 shipEntity = spawnShip(Coord({ x: 0, y: 0 }), 350, deployer);

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

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 1, Phase.Action));

    actionSystem.executeTyped(actions);
    assertTrue(onFireComponent.has(shipEntity));
    assertEq(healthComponent.getValue(shipEntity), health - 1);
  }

  function testFireDeathNoAttacker() public prank(deployer) {
    setup();
    uint256 shipEntity = spawnShip(Coord({ x: 0, y: 0 }), 350, deployer);
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));

    componentDevSystem.executeTyped(HealthComponentID, shipEntity, abi.encode(1));
    componentDevSystem.executeTyped(OnFireComponentID, shipEntity, abi.encode(2));

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 69, Phase.Action));

    Action memory action = Action({ shipEntity: shipEntity, actions: [none, none], metadata: [none, none] });
    actions.push(action);

    actionSystem.executeTyped(actions);

    assertEq(healthComponent.getValue(shipEntity), 0);
  }

  function testDamagedSailEffect() public prank(deployer) {
    setup();

    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(LibUtils.addressById(world, RotationComponentID));

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    uint256 shipEntity = spawnShip(Coord({ x: 0, y: 0 }), 350, deployer);

    Coord memory position = positionComponent.getValue(shipEntity);
    uint32 rotation = rotationComponent.getValue(shipEntity);
    componentDevSystem.executeTyped(SailPositionComponentID, shipEntity, abi.encode(0));
    Move memory move = Move({ shipEntity: shipEntity, moveCardEntity: moveStraightEntity });

    moves.push(move);
    vm.warp(LibTurn.getTurnAndPhaseTime(world, 2, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    CommitSystem(system(CommitSystemID)).executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(world, 2, Phase.Reveal));
    MoveSystem(system(MoveSystemID)).executeTyped(moves, 69);

    assertCoordEq(positionComponent.getValue(shipEntity), position);
    assertEq(rotationComponent.getValue(shipEntity), rotation);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    sailPositionComponent = SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID));
    delete moves;
    delete actions;
  }
}
