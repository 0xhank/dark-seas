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
    uint256 gameId = setup();
    uint256 crateEntity = world.getUniqueEntityId();
    ComponentDevSystem(system(ComponentDevSystemID)).executeTyped(
      UpgradeComponentID,
      crateEntity,
      abi.encode(Upgrade({ componentId: HealthComponentID, amount: 1 }))
    );
    Coord memory position = Coord(0, 0);
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(crateEntity, position);

    uint256 shipEntity = spawnShip(gameId, Coord(31, 0), 0, deployer);

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimCrate"), none],
      metadata: [abi.encode(crateEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));

    vm.expectRevert();
    actionSystem.executeTyped(gameId, actions);
  }

  function testRevertAlreadyClaimed() public prank(deployer) {
    uint256 gameId = setup();

    Coord memory position = Coord(0, 0);
    uint256 crateEntity = LibCrate.createCrate(world, gameId, position);
    uint256 shipEntity = spawnShip(gameId, Coord(0, 0), 0, deployer);

    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimCrate"), none],
      metadata: [abi.encode(crateEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));
    actionSystem.executeTyped(gameId, actions);

    shipEntity = spawnShip(gameId, Coord(0, 0), 0, alice);

    vm.stopPrank();
    vm.startPrank(alice);

    vm.expectRevert();
    actionSystem.executeTyped(gameId, actions);
  }

  function testCreateCrate() public prank(deployer) {
    uint256 gameId = setup();
    Coord memory coord = Coord(0, 0);
    LibCrate.createCrate(world, gameId, coord);

    (uint256[] memory crates, ) = LibUtils.getEntityWith(world, UpgradeComponentID);
    assertEq(crates.length, 1);

    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    CurrentGameComponent currentGameComponent = CurrentGameComponent(
      LibUtils.addressById(world, CurrentGameComponentID)
    );
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
    uint32 amount = uint32(LibUtils.getByteUInt(crates[0], 2, 2)) == 0 ? 2 : 1;
    assertEq(amount, upgrade.amount, "amount wrong");
    assertEq(gameId, currentGameComponent.getValue(crates[0]), "gameId wrong");
  }

  function testClaimCrate() public prank(deployer) {
    uint256 gameId = setup();
    CurrentGameComponent currentGameComponent = CurrentGameComponent(
      LibUtils.addressById(world, CurrentGameComponentID)
    );
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
    currentGameComponent.set(crateEntity, gameId);

    uint256 shipEntity = spawnShip(gameId, Coord(0, 0), 0, deployer);
    assertEq(currentGameComponent.getValue(shipEntity), gameId);
    uint32 health = healthComponent.getValue(shipEntity);
    Action memory action = Action({
      shipEntity: shipEntity,
      actions: [bytes("action.claimCrate"), none],
      metadata: [abi.encode(crateEntity), none]
    });
    actions.push(action);

    vm.warp(getTurnAndPhaseTime(world, gameId, 2, Phase.Action));
    actionSystem.executeTyped(gameId, actions);
    assertEq(healthComponent.getValue(shipEntity), health + 1);
    assertTrue(!positionComponent.has(crateEntity));
  }

  function setup() internal returns (uint256 gameId) {
    bytes memory id = CreateGameSystem(system(CreateGameSystemID)).executeTyped(baseGameConfig);
    gameId = abi.decode(id, (uint256));

    actionSystem = ActionSystem(system(ActionSystemID));
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    gameConfig.entryCutoffTurns = 0;

    GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).set(gameId, gameConfig);
    delete actions;
  }
}
