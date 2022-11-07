// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

import { MoveAngleComponent, ID as MoveAngleComponentID } from "../components/MoveAngleComponent.sol";
import { MoveDistanceComponent, ID as MoveDistanceComponentID } from "../components/MoveDistanceComponent.sol";
import { MoveRotationComponent, ID as MoveRotationComponentID } from "../components/MoveRotationComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.Init"));

contract InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public returns (bytes memory) {
    // require(LibECS.isAdmin(components, msg.sender), "admin only system");
    MoveAngleComponent moveAngleComponent = MoveAngleComponent(getAddressById(components, MoveAngleComponentID));
    MoveDistanceComponent moveDistanceComponent = MoveDistanceComponent(
      getAddressById(components, MoveDistanceComponentID)
    );
    MoveRotationComponent moveRotationComponent = MoveRotationComponent(
      getAddressById(components, MoveRotationComponentID)
    );

    // Initialize Prototypes
    uint256 moveEntity1 = uint256(keccak256("ds.prototype.moveEntity1"));

    moveAngleComponent.set(moveEntity1, 0);
    moveDistanceComponent.set(moveEntity1, 50);
    moveRotationComponent.set(moveEntity1, 0);

    // Initialize Prototypes
    uint256 moveEntity2 = uint256(keccak256("ds.prototype.moveEntity2"));

    moveAngleComponent.set(moveEntity2, 45);
    moveDistanceComponent.set(moveEntity2, 50);
    moveRotationComponent.set(moveEntity2, 90);

    // Initialize Prototypes
    uint256 moveEntity3 = uint256(keccak256("ds.prototype.moveEntity3"));

    moveAngleComponent.set(moveEntity3, 27);
    moveDistanceComponent.set(moveEntity3, 50);
    moveRotationComponent.set(moveEntity3, 45);
  }
}
