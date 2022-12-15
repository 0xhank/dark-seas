// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";

// Components
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";

import { Action, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract ChangeSailActionTest is MudTest {
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[][] allActions = new Action[][](0);
  Action[] actions = new Action[](0);

  function testExecute() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    shipEntities.push(shipEntity);
    actions.push(Action.LowerSail);
    allActions.push(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(shipEntities, allActions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntity);

    assertEq(newSailPosition, 1);
  }

  function testNoEffect() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(shipEntity);
    actions.push(Action.RaiseSail);
    allActions.push(actions);

    actionSystem.executeTyped(shipEntities, allActions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntity);

    assertEq(newSailPosition, 2);

    delete actions;
    delete allActions;
    actions.push(Action.LowerSail);
    allActions.push(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));
    actionSystem.executeTyped(shipEntities, allActions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 3, Phase.Action));
    actionSystem.executeTyped(shipEntities, allActions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 4, Phase.Action));
    actionSystem.executeTyped(shipEntities, allActions);

    newSailPosition = sailPositionComponent.getValue(shipEntity);
    assertEq(newSailPosition, 1);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}
