// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components

import { MoveCardComponent, ID as MoveCardComponentID, MoveCard } from "../../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID, GodID, Wind } from "../../components/WindComponent.sol";

// Internal
import "../MudTest.t.sol";

contract InitSystemTest is MudTest {
  uint256 entity1Id = uint256(keccak256("ds.prototype.moveEntity1"));
  uint256 entity2Id = uint256(keccak256("ds.prototype.moveEntity2"));
  uint256 entity3Id = uint256(keccak256("ds.prototype.moveEntity3"));

  function testExecute() public prank(deployer) {
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    WindComponent windComponent = WindComponent(getAddressById(components, WindComponentID));

    MoveCard memory moveCard = moveCardComponent.getValue(entity1Id);

    assertEq(moveCard.direction, 0);
    assertEq(moveCard.distance, 20);
    assertEq(moveCard.rotation, 0);

    moveCard = moveCardComponent.getValue(entity2Id);

    assertEq(moveCard.direction, 45);
    assertEq(moveCard.distance, 20);
    assertEq(moveCard.rotation, 90);

    moveCard = moveCardComponent.getValue(entity3Id);

    assertEq(moveCard.direction, 27);
    assertEq(moveCard.distance, 20);
    assertEq(moveCard.rotation, 45);

    Wind memory wind = windComponent.getValue(GodID);

    assertEq(wind.speed, 10, "wind speed failed");
    assertEq(wind.direction, 0, "wind direction failed");
  }
}
