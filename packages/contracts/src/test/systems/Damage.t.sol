// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { LeakComponent, ID as LeakComponentID } from "../../components/LeakComponent.sol";
import { DamagedMastComponent, ID as DamagedMastComponentID } from "../../components/DamagedMastComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
// Systems
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";

import { Action, Coord, GameConfig, GodID } from "../../libraries/DSTypes.sol";
import "../../libraries/LibTurn.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract DamageTest is MudTest {
  SailPositionComponent sailPositionComponent;
  GameConfig gameConfig;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  ComponentDevSystem componentDevSystem;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[][] allActions = new Action[][](0);
  Action[] actions = new Action[](0);

  function testFireEffect() public prank(deployer) {
    setup();
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    uint256 attackerId = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);
    uint256 defenderId = shipSpawnSystem.executeTyped(Coord({ x: 9, y: 25 }), 0);
    uint32 origHealth = healthComponent.getValue(defenderId);

    componentDevSystem.executeTyped(OnFireComponentID, attackerId, abi.encode(2));
    assertEq(onFireComponent.getValue(attackerId), 2);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(attackerId);
    actions.push(Action.ExtinguishFire);
    allActions.push(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(shipEntities, allActions);
    assertTrue(onFireComponent.has(attackerId));
    assertEq(onFireComponent.getValue(attackerId), 1);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(attackerId);
    actions.push(Action.FireRight);
    allActions.push(actions);

    uint256 gas = gasleft();
    actionSystem.executeTyped(shipEntities, allActions);

    console.log("gas:", gas - gasleft());

    uint32 newHealth = healthComponent.getValue(defenderId);
    assertEq(newHealth, origHealth);
  }

  function testLeakEffect() public prank(deployer) {
    setup();
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));
    CrewCountComponent crewCountComponent = CrewCountComponent(getAddressById(components, CrewCountComponentID));

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    componentDevSystem.executeTyped(LeakComponentID, entityID, abi.encode(true));

    assertTrue(leakComponent.has(entityID));

    uint32 crewCount = crewCountComponent.getValue(entityID);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(entityID);
    actions.push(Action.ExtinguishFire);
    allActions.push(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(shipEntities, allActions);
    assertTrue(leakComponent.has(entityID));
    assertEq(crewCountComponent.getValue(entityID), crewCount - 1);
  }

  function testDamagedMastEffect() public prank(deployer) {
    setup();
    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    DamagedMastComponent damagedMastComponent = DamagedMastComponent(
      getAddressById(components, DamagedMastComponentID)
    );
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    componentDevSystem.executeTyped(DamagedMastComponentID, entityID, abi.encode(2));

    assertTrue(damagedMastComponent.has(entityID));

    uint32 health = healthComponent.getValue(entityID);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(entityID);
    actions.push(Action.RepairMast);
    allActions.push(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(shipEntities, allActions);
    assertTrue(damagedMastComponent.has(entityID));
    assertEq(healthComponent.getValue(entityID), health - 1);
  }

  function testDamagedSailEffect() public prank(deployer) {
    setup();

    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );
    MoveSystem moveSystem = MoveSystem(system(MoveSystemID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    Coord memory position = positionComponent.getValue(entityID);
    uint32 rotation = rotationComponent.getValue(entityID);
    componentDevSystem.executeTyped(SailPositionComponentID, entityID, abi.encode(0));

    delete shipEntities;
    moveEntities.push(moveStraightEntityId);
    shipEntities.push(entityID);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(shipEntities, moveEntities, 69)));
    CommitSystem(system(CommitSystemID)).executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Reveal));
    moveSystem.executeTyped(shipEntities, moveEntities, 69);

    assertCoordEq(positionComponent.getValue(entityID), position);
    assertEq(rotationComponent.getValue(entityID), rotation);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}