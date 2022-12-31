// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";

// Systems
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";

// Components
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../../components/DamagedCannonsComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Types
import { Action, ActionType, Coord, GameConfig, GodID } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibTurn.sol";

contract RepairActionTest is MudTest {
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  ComponentDevSystem componentDevSystem;

  Action[] actions;

  function testExtinguishFire() public prank(deployer) {
    setup();
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    componentDevSystem.executeTyped(OnFireComponentID, shipEntity, abi.encode(1));

    assertTrue(onFireComponent.has(shipEntity));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.ExtinguishFire, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);
    actionSystem.executeTyped(actions);

    assertFalse(onFireComponent.has(shipEntity));
  }

  function testRepairSail() public prank(deployer) {
    setup();

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    componentDevSystem.executeTyped(SailPositionComponentID, shipEntity, abi.encode(0));

    assertEq(sailPositionComponent.getValue(shipEntity), 0);
    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.RepairSail, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(actions);

    assertEq(sailPositionComponent.getValue(shipEntity), 1);
  }

  function testRepairCannons() public prank(deployer) {
    setup();
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      getAddressById(components, DamagedCannonsComponentID)
    );
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);
    componentDevSystem.executeTyped(DamagedCannonsComponentID, shipEntity, abi.encode(1));

    assertTrue(damagedCannonsComponent.has(shipEntity));
    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.RepairCannons, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(actions);

    assertFalse(damagedCannonsComponent.has(shipEntity));
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
