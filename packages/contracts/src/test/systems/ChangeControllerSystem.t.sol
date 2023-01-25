// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../DarkSeasTest.t.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "../../systems/PlayerSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";
import { ChangeControllerSystem, ID as ChangeControllerSystemID } from "../../systems/ChangeControllerSystem.sol";
// Components
import { OwnedByComponent, ID as OwnedByComponentID } from "../../components/OwnedByComponent.sol";

import { Coord, Move } from "../../libraries/DSTypes.sol";

contract ChangeControllerTest is DarkSeasTest {
  constructor() DarkSeasTest(new Deploy()) {}

  MoveSystem moveSystem;
  CommitSystem commitSystem;

  Move[] moves;

  function testChangeController() public {
    setup();
    PlayerSpawnSystem(system(PlayerSpawnSystemID)).executeTyped(deployer, "Jamaican me crazy", Coord(1, 1));

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
    // change controller
    ChangeControllerSystem(system(ChangeControllerSystemID)).executeTyped(deployer, alice);
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    assertFalse(ownedByComponent.has(addressToEntity(deployer)));
    assertEq(ownedByComponent.getValue(addressToEntity(alice)), addressToEntity(address(this)));

    // move as deployer
    vm.startPrank(deployer);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Commit));

    commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Reveal));
    vm.expectRevert();

    moveSystem.executeTyped(moves, 69);

    vm.stopPrank();

    // move as alice
    vm.startPrank(alice);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 3, Phase.Commit));

    commitment = uint256(keccak256(abi.encode(moves, 69)));
    commitSystem.executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 3, Phase.Reveal));
    moveSystem.executeTyped(moves, 69);

    vm.stopPrank();
  }

  function setup() internal {
    moveSystem = MoveSystem(system(MoveSystemID));
    commitSystem = CommitSystem(system(CommitSystemID));
    delete moves;
  }
}
