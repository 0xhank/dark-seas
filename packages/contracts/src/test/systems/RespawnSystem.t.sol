// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Systems
import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "../../systems/PlayerSpawnSystem.sol";
import { RespawnSystem, ID as RespawnSystemID } from "../../systems/RespawnSystem.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "../../components/DamagedCannonsComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "../../components/BootyComponent.sol";
import { KillsComponent, ID as KillsComponentID } from "../../components/KillsComponent.sol";
import { MaxHealthComponent, ID as MaxHealthComponentID } from "../../components/MaxHealthComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Types
import { Coord, GodID } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";

contract RespawnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  RespawnSystem respawnSystem;

  function testRevertNoPlayer() public prank(alice) {
    uint256[] memory ships;
    respawnSystem = RespawnSystem(system(RespawnSystemID));
    vm.expectRevert(bytes("RespawnSystem: player has not already spawned"));
    respawnSystem.executeTyped(ships);
  }

  function testRevertNotDed() public prank(deployer) {
    uint256[] memory shipEntities = setup();

    for (uint256 i = 0; i < shipEntities.length; i++) {
      console.log("shipEntity:", shipEntities[i]);
    }
    vm.expectRevert(bytes("RespawnSystem: ship is not ded"));
    respawnSystem.executeTyped(shipEntities);
  }

  function testRespawn() public prank(deployer) {
    uint256[] memory shipEntities = setup();
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    KillsComponent killsComponent = KillsComponent(getAddressById(components, KillsComponentID));
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));
    DamagedCannonsComponent damagedCannonsComponent = DamagedCannonsComponent(
      getAddressById(components, DamagedCannonsComponentID)
    );

    for (uint256 i = 0; i < shipEntities.length; i++) {
      uint256 shipEntity = shipEntities[i];
      healthComponent.set(shipEntity, 0);
      killsComponent.set(shipEntity, 1000);
      bootyComponent.set(shipEntity, 1000);
      onFireComponent.set(shipEntity, 3);
      damagedCannonsComponent.set(shipEntity, 4);
      sailPositionComponent.set(shipEntity, 5);
    }
    respawnSystem.executeTyped(shipEntities);

    for (uint256 i = 0; i < shipEntities.length; i++) {
      uint256 shipEntity = shipEntities[i];
      assertEq(
        healthComponent.getValue(shipEntity),
        MaxHealthComponent(getAddressById(components, MaxHealthComponentID)).getValue(shipEntity)
      );
      assertEq(killsComponent.getValue(shipEntity), 0);
      assertEq(bootyComponent.getValue(shipEntity), gameConfig.buyin);
      assertTrue(!onFireComponent.has(shipEntity));
      assertTrue(!damagedCannonsComponent.has(shipEntity));
      assertEq(sailPositionComponent.getValue(shipEntity), 2);
    }
  }

  function setup() internal returns (uint256[] memory shipEntities) {
    PlayerSpawnSystem playerSpawnSystem = PlayerSpawnSystem(system(PlayerSpawnSystemID));
    respawnSystem = RespawnSystem(system(RespawnSystemID));
    playerSpawnSystem.executeTyped("Jamaican me crazy", Coord(1, 1));

    (shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    assertEq(shipEntities.length, 2, "incorrect number of ships");
    return shipEntities;
  }
}
