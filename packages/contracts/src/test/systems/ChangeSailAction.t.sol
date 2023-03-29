// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Components
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";

// Systems
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";

import { Action, Move, Coord } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract ChangeSailActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;

  Move[] moves;
  Action[] actions;

  function testExecute() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = spawnShip(gameId, startingPosition, startingRotation, deployer);

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.lowerSail"), none],
      metadata: [none, none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    actionSystem.executeTyped(gameId, actions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntity);

    assertEq(newSailPosition, 1);
  }

  function testNoEffect() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntity = spawnShip(gameId, startingPosition, startingRotation, deployer);
    vm.warp(getTurnAndPhaseTime(world, gameId, 1, Phase.Action));

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.raiseSail"), none],
      metadata: [none, none]
    });
    actions.push(action);

    actionSystem.executeTyped(gameId, actions);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntity);

    assertEq(newSailPosition, 2);

    delete actions;

    action = Action({ shipEntity: shipEntity, actions: [bytes("action.lowerSail"), none], metadata: [none, none] });

    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));
    actionSystem.executeTyped(gameId, actions);

    vm.warp(getTurnAndPhaseTime(world, gameId, 3, Phase.Action));
    actionSystem.executeTyped(gameId, actions);

    vm.warp(getTurnAndPhaseTime(world, gameId, 4, Phase.Action));
    actionSystem.executeTyped(gameId, actions);

    newSailPosition = sailPositionComponent.getValue(shipEntity);
    assertEq(newSailPosition, 1);
  }

  /**
   * Helpers
   */

  function setup() internal returns (uint256 gameId) {
    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    actionSystem = ActionSystem(system(ActionSystemID));
    sailPositionComponent = SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID));
    delete moves;
    delete actions;
  }
}
