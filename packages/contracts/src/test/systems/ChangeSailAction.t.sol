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
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract ChangeSailActionTest is MudTest {
  uint256 entityId;
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  GameConfig gameConfig;

  Action[] actions = new Action[](0);

  function testExecute() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    actions.push(Action.LowerSail);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntityId, actions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntityId);

    assertEq(newSailPosition, 2);
  }

  function testNoEffect() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation);

    uint256 newTurn = 1 + gameConfig.movePhaseLength + (gameConfig.movePhaseLength + gameConfig.actionPhaseLength);
    vm.warp(newTurn);

    delete actions;
    actions.push(Action.RaiseSail);
    actionSystem.executeTyped(shipEntityId, actions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntityId);

    assertEq(newSailPosition, 3);

    delete actions;
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);

    newTurn = 1 + gameConfig.movePhaseLength + (2 * (gameConfig.movePhaseLength + gameConfig.actionPhaseLength));
    vm.warp(newTurn);

    actionSystem.executeTyped(shipEntityId, actions);

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

    uint256 phaseTime = gameConfig.movePhaseLength;
    vm.warp(phaseTime + 1);

    entityId = addressToEntity(deployer);
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}
