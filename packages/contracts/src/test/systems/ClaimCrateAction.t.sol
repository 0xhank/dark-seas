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
import "../../libraries/LibCrate.sol";

contract ClaimCrateActionTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  ActionSystem actionSystem;
  Action[] actions;

  function testRevertTooFar() public prank(deployer) {
    setup();
    uint256 crateEntity = world.getUniqueEntityId();
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(
      UpgradeComponentID,
      crateEntity,
      abi.encode(Upgrade({ componentId: HealthComponentID, amount: 1 }))
    );
    Coord memory position = Coord(0, 0);
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(crateEntity, position);

    uint256 shipEntity = spawnShip(Coord(31, 0), 0, deployer);

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimCrate"), none],
      metadata: [abi.encode(crateEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, 2, Phase.Action));

    vm.expectRevert();
    actionSystem.executeTyped(actions);
  }

  function testRevertAlreadyClaimed() public prank(deployer) {
    setup();

    uint256 crateEntity = world.getUniqueEntityId();
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(
      UpgradeComponentID,
      crateEntity,
      abi.encode(Upgrade({ componentId: HealthComponentID, amount: 1 }))
    );
    Coord memory position = Coord(0, 0);
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(crateEntity, position);

    uint256 shipEntity = spawnShip(Coord(0, 0), 0, deployer);

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimCrate"), none],
      metadata: [abi.encode(crateEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, 2, Phase.Action));
    actionSystem.executeTyped(actions);

    shipEntity = spawnShip(Coord(0, 0), 0, alice);

    vm.stopPrank();
    vm.startPrank(alice);

    vm.expectRevert();
    actionSystem.executeTyped(actions);
  }

  function testCreateCrate() public prank(deployer) {
    setup();
    Coord memory coord = Coord(0, 0);
    console.log("deployer:", deployer);
    console.log("this:", address(this));
    LibCrate.createCrate(world, coord);

    (uint256[] memory crates, ) = LibUtils.getEntityWith(world, UpgradeComponentID);
    assertEq(crates.length, 1);

    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    UpgradeComponent upgradeComponent = UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID));

    assertCoordEq(positionComponent.getValue(crates[0]), coord);
    uint256 componentSeed = LibUtils.getByteUInt(crates[0], 2, 0);
    uint256 componentId;
    if (componentSeed == 0) componentId = HealthComponentID;
    else if (componentSeed == 1) componentId = LengthComponentID;
    else if (componentSeed == 2) componentId = FirepowerComponentID;
    else if (componentSeed == 3) componentId = SpeedComponentID;
    console.log("componentSeed: ", componentSeed);
    console.log("componentId: ", componentId);

    Upgrade memory upgrade = upgradeComponent.getValue(crates[0]);
    assertEq(componentId, upgrade.componentId, "id wrong");
    uint32 amount = uint32(LibUtils.getByteUInt(crates[0], 1, 2));
    assertEq(amount + 1, upgrade.amount, "amount wrong");
  }

  function testClaimCrate() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    uint256 crateEntity = world.getUniqueEntityId();
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(
      UpgradeComponentID,
      crateEntity,
      abi.encode(Upgrade({ componentId: HealthComponentID, amount: 1 }))
    );
    Coord memory position = Coord(0, 0);
    positionComponent.set(crateEntity, position);

    uint256 shipEntity = spawnShip(Coord(0, 0), 0, deployer);

    uint32 health = healthComponent.getValue(shipEntity);
    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimCrate"), none],
      metadata: [abi.encode(crateEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, 2, Phase.Action));
    actionSystem.executeTyped(actions);
    assertEq(healthComponent.getValue(shipEntity), health + 1);
    assertTrue(!positionComponent.has(crateEntity));
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
