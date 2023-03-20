// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";

// Systems
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { UpgradeComponent, ID as UpgradeComponentID } from "../../components/UpgradeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";

// Types
import { Coord, Action, Upgrade } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibUtils.sol";
import "../../libraries/LibUtils.sol";

contract ClaimDropActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  ActionSystem actionSystem;
  Action[] actions;

  function testClaimDrop() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    uint256 dropEntity = world.getUniqueEntityId();
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(
      UpgradeComponentID,
      dropEntity,
      abi.encode(Upgrade({ componentId: HealthComponentID, amount: 1 }))
    );
    Coord memory position = Coord(0, 0);
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(dropEntity, position);

    uint256 shipEntity = spawnShip(Coord(0, 0), 0, deployer);

    uint32 health = healthComponent.getValue(shipEntity);
    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimDrop"), none],
      metadata: [abi.encode(dropEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, 2, Phase.Action));
    actionSystem.executeTyped(actions);

    assertEq(healthComponent.getValue(shipEntity), health + 1);
  }

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );

    gameConfig.entryCutoffTurns = 0;

    GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).set(GodID, gameConfig);
    delete actions;
  }
}
