// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components

import { MoveCardComponent, ID as MoveCardComponentID } from "../../components/MoveCardComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { WindComponent, ID as WindComponentID } from "../../components/WindComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../../components/GameConfigComponent.sol";

// Internal
import "../MudTest.t.sol";
import { Wind, GodID, MoveCard, GameConfig } from "../../libraries/DSTypes.sol";

contract InitSystemTest is MudTest {
  uint256 entity1Id = uint256(keccak256("ds.prototype.moveEntity1"));
  uint256 entity2Id = uint256(keccak256("ds.prototype.moveEntity2"));
  uint256 entity3Id = uint256(keccak256("ds.prototype.moveEntity3"));

  function testExecute() public prank(deployer) {
    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    WindComponent windComponent = WindComponent(getAddressById(components, WindComponentID));
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));

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
    GameConfig memory gameConfig = gameConfigComponent.getValue(GodID);

    assertEq(wind.speed, 10, "wind speed failed");
    assertEq(wind.direction, 90, "wind direction failed");
    assertEq(gameConfig.startTime, block.timestamp);
    assertEq(gameConfig.movePhaseLength, 45);
    assertEq(gameConfig.actionPhaseLength, 75);
  }
}
