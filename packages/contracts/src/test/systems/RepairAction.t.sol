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

  function testExtinguishFire() public prank(deployer) {
    setup();
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    componentDevSystem.executeTyped(OnFireComponentID, entityID, abi.encode(true));

    assertTrue(onFireComponent.has(entityID));

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(entityID);
    actions.push(Action.ExtinguishFire);
    allActions.push(actions);
    actionSystem.executeTyped(shipEntities, allActions);

    assertFalse(onFireComponent.has(entityID));
  }

  function testRepairLeak() public prank(deployer) {
    setup();
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    componentDevSystem.executeTyped(LeakComponentID, entityID, abi.encode(true));

    assertTrue(leakComponent.has(entityID));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(entityID);
    actions.push(Action.RepairLeak);
    allActions.push(actions);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntities, allActions);
    assertFalse(leakComponent.has(entityID));
  }

  function testRepairMast() public prank(deployer) {
    setup();

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    componentDevSystem.executeTyped(SailPositionComponentID, entityID, abi.encode(0));

    assertEq(sailPositionComponent.getValue(entityID), 0);

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(entityID);
    actions.push(Action.RepairMast);
    allActions.push(actions);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntities, allActions);

    assertEq(sailPositionComponent.getValue(entityID), 1);
  }

  function testRepairSail() public prank(deployer) {
    setup();
    DamagedSailComponent damagedSailComponent = DamagedSailComponent(
      getAddressById(components, DamagedSailComponentID)
    );
    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);
    componentDevSystem.executeTyped(DamagedSailComponentID, entityID, abi.encode(true));

    assertTrue(damagedSailComponent.has(entityID));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(entityID);
    actions.push(Action.RepairSail);
    allActions.push(actions);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntities, allActions);
    assertFalse(damagedSailComponent.has(entityID));
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
