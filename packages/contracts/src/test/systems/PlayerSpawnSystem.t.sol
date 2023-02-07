// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../DarkSeasTest.t.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Systems
import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "../../systems/PlayerSpawnSystem.sol";

import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";
// Components
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "../../components/BootyComponent.sol";

// Types
import { Coord, Phase, Move } from "../../libraries/DSTypes.sol";

// Internal
import "../../libraries/LibUtils.sol";
import "../../libraries/LibTurn.sol";

contract PlayerSpawnTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  PlayerSpawnSystem playerSpawnSystem;
  NameComponent nameComponent;
  MoveSystem moveSystem;
  CommitSystem commitSystem;

  Move[] moves;

  function testRevertTooLate() public prank(deployer) {
    setup();

    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    vm.warp(LibTurn.getTurnAndPhaseTime(components, gameConfig.entryCutoffTurns + 1, Phase.Commit));

    vm.expectRevert(bytes("PlayerSpawnSystem: entry period has ended"));
    playerSpawnSystem.executeTyped(deployer, "Jamaican me crazy", Coord(1, 1));
  }

  function testSpawn() public prank(deployer) {
    setup();
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    BootyComponent bootyComponent = BootyComponent(getAddressById(components, BootyComponentID));
    uint256 playerEntity = addressToEntity(deployer);

    playerSpawnSystem.executeTyped(deployer, "Jamaican me crazy", Coord(1, 1));

    (uint256[] memory entities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    assertEq(entities.length, 2, "incorrect number of ships");

    bool hasName = nameComponent.has(playerEntity);
    for (uint256 i = 0; i < entities.length; i++) {
      uint256 shipBooty = bootyComponent.getValue(entities[i]);

      assertEq(shipBooty, gameConfig.buyin);
    }

    assertTrue(hasName, "player name not stored");
    if (hasName) {
      string memory playerName = nameComponent.getValue(playerEntity);
      assertEq(playerName, "Jamaican me crazy");
    }
  }

  function testAccess() public {
    setup();

    uint256 playerEntity = addressToEntity(msg.sender);
    playerSpawnSystem.executeTyped(deployer, "Jamaican me crazy", Coord(1, 1));

    (uint256[] memory entities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    // move as deployer
    vm.startPrank(deployer);
    moves.push(Move({ moveCardEntity: moveStraightEntity, shipEntity: entities[0] }));

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Commit));

    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Reveal));
    moveSystem.executeTyped(moves, 69);

    vm.stopPrank();

    // move as msg sender
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Commit));
    commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Reveal));

    vm.expectRevert();
    moveSystem.executeTyped(moves, 69);

    // create account with bob controlling alice's ships
    vm.startPrank(alice);
    playerSpawnSystem.executeTyped(bob, "Jamaican me crazy", Coord(1, 1));
    vm.stopPrank();

    // bob moves
    vm.startPrank(bob);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 3, Phase.Commit));

    commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 3, Phase.Reveal));
    vm.expectRevert(bytes("MoveSystem: you don't own this ship"));
    moveSystem.executeTyped(moves, 69);
    vm.stopPrank();
  }

  /**
   * Helpers
   */

  function setup() internal {
    playerSpawnSystem = PlayerSpawnSystem(system(PlayerSpawnSystemID));
    nameComponent = NameComponent(getAddressById(components, NameComponentID));
    moveSystem = MoveSystem(system(MoveSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    delete moves;
  }
}
