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
import { Action, Coord } from "../../libraries/DSTypes.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract RepairActionTest is MudTest {
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  ComponentDevSystem componentDevSystem;

  Action[] actions = new Action[](0);

  function testExtinguishFire() public prank(deployer) {
    setup();
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350, 50, 50);

    componentDevSystem.executeTyped(OnFireComponentID, entityID, abi.encode(true));

    assertTrue(onFireComponent.has(entityID));
    actions.push(Action.ExtinguishFire);

    actionSystem.executeTyped(entityID, actions);
  }

  function testRepairLeak() public prank(deployer) {
    setup();
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350, 50, 50);

    componentDevSystem.executeTyped(LeakComponentID, entityID, abi.encode(true));

    assertTrue(leakComponent.has(entityID));

    delete actions;
    actions.push(Action.RepairLeak);

    actionSystem.executeTyped(entityID, actions);
    assertFalse(leakComponent.has(entityID));
  }

  function testRepairMast() public prank(deployer) {
    setup();
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350, 50, 50);

    componentDevSystem.executeTyped(SailPositionComponentID, entityID, abi.encode(0));

    assertEq(sailPositionComponent.getValue(entityID), 0);

    delete actions;
    actions.push(Action.RepairMast);
    actionSystem.executeTyped(entityID, actions);
    assertEq(sailPositionComponent.getValue(entityID), 1);
  }

  function testRepairSail() public prank(deployer) {
    setup();
    DamagedSailComponent damagedSailComponent = DamagedSailComponent(
      getAddressById(components, DamagedSailComponentID)
    );
    uint256 entityID = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350, 50, 50);
    componentDevSystem.executeTyped(DamagedSailComponentID, entityID, abi.encode(true));

    assertTrue(damagedSailComponent.has(entityID));

    delete actions;
    actions.push(Action.RepairSail);
    actionSystem.executeTyped(entityID, actions);
    assertFalse(damagedSailComponent.has(entityID));
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
