// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
// Systems
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { LeakComponent, ID as LeakComponentID } from "../../components/LeakComponent.sol";
import { DamagedSailComponent, ID as DamagedSailComponentID } from "../../components/DamagedSailComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../../components/CrewCountComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";

import { Action, Coord, GameConfig, GodID } from "../../libraries/DSTypes.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract RepairActionTest is MudTest {
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

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntities, allActions);
    assertTrue(onFireComponent.has(attackerId));
    assertEq(onFireComponent.getValue(attackerId), 1);

    newTurn = gameConfig.movePhaseLength * 10;
    vm.warp(newTurn);

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

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntities, allActions);
    assertTrue(leakComponent.has(entityID));
    assertEq(crewCountComponent.getValue(entityID), crewCount - 1);
  }

  function testDamagedMastEffect() public prank(deployer) {
    setup();
  }

  function testDamagedSailEffect() public prank(deployer) {
    setup();
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));

    gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(GodID);

    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}
