// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";

// Components
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { GodID, MoveCard, GameConfig, ShipPrototype, CannonPrototype } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.Init"));

import "../libraries/LibCreateShip.sol";

// @todo: make this admin only
contract InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));

    uint256[] memory shipEntities = new uint256[](2);
    CannonPrototype[] memory cannonEntities1 = new CannonPrototype[](4);
    cannonEntities1[0] = CannonPrototype({ rotation: 90, firepower: 65, range: 60 });
    cannonEntities1[1] = CannonPrototype({ rotation: 270, firepower: 65, range: 60 });
    cannonEntities1[2] = CannonPrototype({ rotation: 345, firepower: 50, range: 50 });
    cannonEntities1[3] = CannonPrototype({ rotation: 15, firepower: 50, range: 50 });

    ShipPrototype memory shipPrototype = ShipPrototype({
      length: 13,
      maxHealth: 10,
      speed: 90,
      cannons: cannonEntities1
    });

    shipEntities[0] = LibCreateShip.createShip(components, shipPrototype);

    CannonPrototype[] memory cannonEntities2 = new CannonPrototype[](3);
    cannonEntities2[0] = CannonPrototype({ rotation: 90, firepower: 50, range: 100 });
    cannonEntities2[1] = CannonPrototype({ rotation: 270, firepower: 50, range: 100 });
    cannonEntities2[2] = CannonPrototype({ rotation: 0, firepower: 40, range: 100 });

    shipPrototype = ShipPrototype({ length: 10, maxHealth: 10, speed: 110, cannons: cannonEntities2 });

    shipEntities[1] = LibCreateShip.createShip(components, shipPrototype);

    gameConfigComponent.set(
      GodID,
      GameConfig({
        startTime: block.timestamp,
        commitPhaseLength: 22,
        revealPhaseLength: 9,
        actionPhaseLength: 22,
        worldSize: 120,
        perlinSeed: 420,
        shipPrototypes: shipEntities,
        entryCutoffTurns: 60, // entry is closed after the 60th turn (~1 hour)
        buyin: 1000,
        respawnAllowed: true,
        // Calculation: Every turn, the world shrinks by gameConfig.shrinkrate / 100.
        // If shrink rate is 100, the world will shrink by 1 each turn.
        // Shrinking starts once entry is cutoff and ends when the world size is 50.
        shrinkRate: 0
      })
    );

    // Initialize Prototypes
    uint256 moveEntity1 = uint256(keccak256("ds.prototype.moveEntity1"));

    moveCardComponent.set(moveEntity1, MoveCard({ direction: 0, distance: 50, rotation: 0 }));

    uint256 moveEntity2 = uint256(keccak256("ds.prototype.moveEntity2"));

    moveCardComponent.set(moveEntity2, MoveCard({ direction: 45, distance: 30, rotation: 90 }));

    uint256 moveEntity3 = uint256(keccak256("ds.prototype.moveEntity3"));

    moveCardComponent.set(moveEntity3, MoveCard({ direction: 27, distance: 40, rotation: 45 }));

    uint256 moveEntity4 = uint256(keccak256("ds.prototype.moveEntity4"));

    moveCardComponent.set(moveEntity4, MoveCard({ direction: 315, distance: 30, rotation: 270 }));

    uint256 moveEntity5 = uint256(keccak256("ds.prototype.moveEntity5"));

    moveCardComponent.set(moveEntity5, MoveCard({ direction: 333, distance: 40, rotation: 315 }));
  }
}
