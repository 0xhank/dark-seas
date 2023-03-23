// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { getAddressById } from "solecs/utils.sol";

// Systems
import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "../../systems/PlayerSpawnSystem.sol";
import { RespawnSystem, ID as RespawnSystemID } from "../../systems/RespawnSystem.sol";

// Components
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../../components/DamagedCannonsComponent.sol";
import { MaxHealthComponent, ID as MaxHealthComponentID } from "../../components/MaxHealthComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// // Types
import { Coord, GodID } from "../../libraries/DSTypes.sol";

// // Internal
import "../../libraries/LibUtils.sol";

contract RespawnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  RespawnSystem respawnSystem;

  uint256[] ships;

  function testRevertNoPlayer() public prank(deployer) {
    setup();

    vm.stopPrank();
    vm.startPrank(bob);
    respawnSystem = RespawnSystem(system(RespawnSystemID));
    vm.expectRevert(bytes("RespawnSystem: player has not already spawned"));

    respawnSystem.executeTyped(ships);
  }

  function testRevertNotDed() public prank(deployer) {
    uint256[] memory shipEntities = setup();

    vm.expectRevert(bytes("RespawnSystem: ship is not ded"));
    respawnSystem.executeTyped(shipEntities);
  }

  function testRespawn() public prank(deployer) {
    uint256[] memory shipEntities = setup();
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      GodID
    );
    HealthComponent healthComponent = HealthComponent(LibUtils.addressById(world, HealthComponentID));
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      LibUtils.addressById(world, SailPositionComponentID)
    );

    OnFireComponent onFireComponent = OnFireComponent(LibUtils.addressById(world, OnFireComponentID));
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      LibUtils.addressById(world, DamagedCannonsComponentID)
    );

    for (uint256 i = 0; i < shipEntities.length; i++) {
      uint256 shipEntity = shipEntities[i];
      healthComponent.set(shipEntity, 0);
      onFireComponent.set(shipEntity, 3);
      damagedCannonsComponent.set(shipEntity, 4);
      sailPositionComponent.set(shipEntity, 5);
    }
    respawnSystem.executeTyped(shipEntities);

    for (uint256 i = 0; i < shipEntities.length; i++) {
      uint256 shipEntity = shipEntities[i];
      assertEq(
        healthComponent.getValue(shipEntity),
        MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID)).getValue(shipEntity)
      );
      assertTrue(!onFireComponent.has(shipEntity));
      assertTrue(!damagedCannonsComponent.has(shipEntity));
      assertEq(sailPositionComponent.getValue(shipEntity), 2);
    }
  }

  function setup() internal returns (uint256[] memory shipEntities) {
    PlayerSpawnSystem playerSpawnSystem = PlayerSpawnSystem(system(PlayerSpawnSystemID));
    respawnSystem = RespawnSystem(system(RespawnSystemID));
    uint256 shipId = createShipPrototype(1);
    ships.push(shipId);
    playerSpawnSystem.executeTyped("Jamaican me crazy", ships);
    GameConfigComponent gameConfigComponent = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID));
    GameConfig memory gameConfig = gameConfigComponent.getValue(GodID);
    gameConfig.respawnAllowed = true;

    gameConfigComponent.set(GodID, gameConfig);

    (shipEntities, ) = LibUtils.getEntityWith(world, ShipComponentID);

    return shipEntities;
  }
}
