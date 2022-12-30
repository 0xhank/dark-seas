// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";

// Components
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";

import { Action, ActionType, Move, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract ChangeSailActionTest is MudTest {
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;

  Move[] moves;
  Action[] actions;

  function testExecute() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.LowerSail, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(actions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntity);

    assertEq(newSailPosition, 1);
  }

  function testNoEffect() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.RaiseSail, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);

    actionSystem.executeTyped(actions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntity);

    assertEq(newSailPosition, 2);

    delete actions;

    action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.LowerSail, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });

    actions.push(action);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Action));
    actionSystem.executeTyped(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 3, Phase.Action));
    actionSystem.executeTyped(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 4, Phase.Action));
    actionSystem.executeTyped(actions);

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
    delete moves;
    delete actions;
  }
}
