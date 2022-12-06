// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord } from "../../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";

import { Action, GameConfig, GodID } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibTurn.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract ChangeSailActionTest is MudTest {
  uint256 entityId;
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  GameConfig gameConfig;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[][] allActions = new Action[][](0);
  Action[] actions = new Action[](0);

  function testExecute() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    shipEntities.push(shipEntityId);
    actions.push(Action.LowerSail);
    allActions.push(actions);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(shipEntities, allActions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntityId);

    assertEq(newSailPosition, 2);
  }

  function testNoEffect() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    delete shipEntities;
    delete actions;
    delete allActions;

    shipEntities.push(shipEntityId);
    actions.push(Action.RaiseSail);
    allActions.push(actions);

    actionSystem.executeTyped(shipEntities, allActions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntityId);

    assertEq(newSailPosition, 3);

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

    newSailPosition = sailPositionComponent.getValue(shipEntityId);
    assertEq(newSailPosition, 1);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));

    gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(GodID);

    uint256 phaseTime = gameConfig.commitPhaseLength;
    vm.warp(phaseTime + 1);

    entityId = addressToEntity(deployer);
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}
