// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord } from "../../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { Action } from "../../libraries/DSTypes.sol";

// Internal
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract ChangeSailActionTest is MudTest {
  uint256 entityId;
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;

  Action[] actions = new Action[](0);

  function testExecute() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    actions.push(Action.LowerSail);
    actionSystem.executeTyped(actions, shipEntityId);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntityId);

    assertEq(newSailPosition, 2);
  }

  function testReversions() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    delete actions;
    actions.push(Action.RaiseSail);

    vm.expectRevert(abi.encodePacked("RaiseSail: invalid sail position"));
    actionSystem.executeTyped(actions, shipEntityId);

    delete actions;
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);
    actions.push(Action.LowerSail);

    vm.expectRevert(abi.encodePacked("LowerSail: invalid sail position"));
    actionSystem.executeTyped(actions, shipEntityId);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));

    entityId = addressToEntity(deployer);
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}
