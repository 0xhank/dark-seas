// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components

import { MoveAngleComponent, ID as MoveAngleComponentID } from "../../components/MoveAngleComponent.sol";
import { MoveDistanceComponent, ID as MoveDistanceComponentID } from "../../components/MoveDistanceComponent.sol";
import { MoveRotationComponent, ID as MoveRotationComponentID } from "../../components/MoveRotationComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";

// Internal
import "../MudTest.t.sol";

contract InitSystemTest is MudTest {
  function testExecute() public prank(deployer) {
    uint256 entity1Id = uint256(keccak256("ds.prototype.moveEntity1"));
    uint256 entity2Id = uint256(keccak256("ds.prototype.moveEntity2"));
    uint256 entity3Id = uint256(keccak256("ds.prototype.moveEntity3"));

    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    MoveAngleComponent moveAngleComponent = MoveAngleComponent(getAddressById(components, MoveAngleComponentID));
    MoveDistanceComponent moveDistanceComponent = MoveDistanceComponent(
      getAddressById(components, MoveDistanceComponentID)
    );
    MoveRotationComponent moveRotationComponent = MoveRotationComponent(
      getAddressById(components, MoveRotationComponentID)
    );

    uint32 moveAngle = moveAngleComponent.getValue(entity1Id);
    uint32 moveDistance = moveDistanceComponent.getValue(entity1Id);
    uint32 moveRotation = moveRotationComponent.getValue(entity1Id);

    assertEq(moveAngle, 0);
    assertEq(moveDistance, 50);
    assertEq(moveRotation, 0);

    moveDistance = moveDistanceComponent.getValue(entity2Id);
    moveRotation = moveRotationComponent.getValue(entity2Id);
    moveAngle = moveAngleComponent.getValue(entity2Id);

    assertEq(moveAngle, 45);
    assertEq(moveDistance, 50);
    assertEq(moveRotation, 90);

    moveAngle = moveAngleComponent.getValue(entity3Id);
    moveDistance = moveDistanceComponent.getValue(entity3Id);
    moveRotation = moveRotationComponent.getValue(entity3Id);

    assertEq(moveAngle, 27);
    assertEq(moveDistance, 50);
    assertEq(moveRotation, 45);
  }
}
