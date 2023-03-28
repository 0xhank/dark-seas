// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";

// Components
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../../components/DamagedCannonsComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";

// Types
import { Action, Coord } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibTurn.sol";

contract RepairActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ComponentDevSystem componentDevSystem;

  Action[] actions;

  function testExtinguishFire() public prank(deployer) {
    uint256 gameId = setup();
    OnFireComponent onFireComponent = OnFireComponent(LibUtils.addressById(world, OnFireComponentID));

    uint256 shipEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);

    componentDevSystem.executeTyped(OnFireComponentID, shipEntity, abi.encode(1));

    assertTrue(onFireComponent.has(shipEntity));

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.extinguishFire"), none],
      metadata: [none, none]
    });
    actions.push(action);
    actionSystem.executeTyped(gameId, actions);

    assertFalse(onFireComponent.has(shipEntity));
  }

  function testRepairSail() public prank(deployer) {
    uint256 gameId = setup();

    uint256 shipEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);

    componentDevSystem.executeTyped(SailPositionComponentID, shipEntity, abi.encode(0));

    assertEq(sailPositionComponent.getValue(shipEntity), 0);
    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.repairSail"), none],
      metadata: [none, none]
    });
    actions.push(action);
    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    actionSystem.executeTyped(gameId, actions);

    assertEq(sailPositionComponent.getValue(shipEntity), 1);
  }

  function testRepairCannons() public prank(deployer) {
    uint256 gameId = setup();
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      LibUtils.addressById(world, DamagedCannonsComponentID)
    );
    uint256 shipEntity = spawnShip(gameId, Coord({ x: 0, y: 0 }), 350, deployer);
    componentDevSystem.executeTyped(DamagedCannonsComponentID, shipEntity, abi.encode(1));

    assertTrue(damagedCannonsComponent.has(shipEntity));
    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.repairCannons"), none],
      metadata: [none, none]
    });
    actions.push(action);
    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    actionSystem.executeTyped(gameId, actions);

    assertFalse(damagedCannonsComponent.has(shipEntity));
  }

  /**
   * Helpers
   */

  function setup() internal returns (uint256 gameId) {
    bytes memory id = InitSystem(system(InitSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    actionSystem = ActionSystem(system(ActionSystemID));
    componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));

    sailPositionComponent = SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID));
  }
}
