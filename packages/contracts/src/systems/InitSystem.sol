// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

// Components
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { WindComponent, ID as WindComponentID } from "../components/WindComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { Wind, GodID, MoveCard, GameConfig } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.Init"));

// @todo: make this admin only
contract InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory) public returns (bytes memory) {
    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    WindComponent windComponent = WindComponent(getAddressById(components, WindComponentID));
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));

    gameConfigComponent.set(
      GodID,
      GameConfig({
        startTime: block.timestamp,
        commitPhaseLength: 30,
        revealPhaseLength: 10,
        actionPhaseLength: 30,
        worldRadius: 400
      })
    );

    // Initialize Prototypes
    uint256 moveEntity1 = uint256(keccak256("ds.prototype.moveEntity1"));

    moveCardComponent.set(moveEntity1, MoveCard({ direction: 0, distance: 50, rotation: 0 }));

    uint256 moveEntity2 = uint256(keccak256("ds.prototype.moveEntity2"));

    moveCardComponent.set(moveEntity2, MoveCard({ direction: 45, distance: 50, rotation: 90 }));

    uint256 moveEntity3 = uint256(keccak256("ds.prototype.moveEntity3"));

    moveCardComponent.set(moveEntity3, MoveCard({ direction: 27, distance: 50, rotation: 45 }));

    uint256 moveEntity4 = uint256(keccak256("ds.prototype.moveEntity4"));

    moveCardComponent.set(moveEntity4, MoveCard({ direction: 315, distance: 50, rotation: 270 }));

    uint256 moveEntity5 = uint256(keccak256("ds.prototype.moveEntity5"));

    moveCardComponent.set(moveEntity5, MoveCard({ direction: 333, distance: 50, rotation: 315 }));

    windComponent.set(GodID, Wind(5, 35));
  }
}
