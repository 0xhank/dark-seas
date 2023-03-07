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

    CannonPrototype[] memory cannon6 = new CannonPrototype[](6);
    CannonPrototype[] memory cannon5 = new CannonPrototype[](5);
    CannonPrototype[] memory cannon4 = new CannonPrototype[](4);
    CannonPrototype[] memory cannon3 = new CannonPrototype[](3);
    CannonPrototype[] memory cannon2 = new CannonPrototype[](2);
    CannonPrototype[] memory cannon1 = new CannonPrototype[](1);

    // Leaky Canoe
    cannon2[0] = CannonPrototype({ rotation: 90, firepower: 35, range: 50 });
    cannon2[1] = CannonPrototype({ rotation: 270, firepower: 35, range: 50 });

    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 1, length: 6, maxHealth: 3, speed: 80, cannons: cannon2, name: "Leaky Canoe" })
    );

    // Wet Blanket
    cannon1[0] = CannonPrototype({ rotation: 0, firepower: 40, range: 72 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 1, length: 6, maxHealth: 3, speed: 80, cannons: cannon1, name: "Wet Blanket" })
    );

    // Waterski
    cannon2[0] = CannonPrototype({ rotation: 45, firepower: 50, range: 70 });
    cannon2[1] = CannonPrototype({ rotation: 315, firepower: 50, range: 70 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 2, length: 7, maxHealth: 3, speed: 150, cannons: cannon2, name: "Waterski" })
    );

    // Tugboat
    cannon2[0] = CannonPrototype({ rotation: 0, firepower: 40, range: 70 });
    cannon2[1] = CannonPrototype({ rotation: 180, firepower: 40, range: 70 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 2, length: 8, maxHealth: 5, speed: 50, cannons: cannon2, name: "Tugboat" })
    );

    // Dolphin
    cannon3[0] = CannonPrototype({ rotation: 90, firepower: 45, range: 80 });
    cannon3[1] = CannonPrototype({ rotation: 270, firepower: 45, range: 80 });
    cannon3[2] = CannonPrototype({ rotation: 0, firepower: 55, range: 80 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 3, length: 9, maxHealth: 5, speed: 100, cannons: cannon3, name: "Dolphin" })
    );

    // Defiance
    cannon4[0] = CannonPrototype({ rotation: 90, firepower: 55, range: 60 });
    cannon4[1] = CannonPrototype({ rotation: 270, firepower: 55, range: 60 });
    cannon4[2] = CannonPrototype({ rotation: 30, firepower: 60, range: 70 });
    cannon4[3] = CannonPrototype({ rotation: 330, firepower: 60, range: 70 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 3, length: 9, maxHealth: 4, speed: 80, cannons: cannon4, name: "Defiance" })
    );

    // The Raven
    cannon2[0] = CannonPrototype({ rotation: 90, firepower: 90, range: 110 });
    cannon2[1] = CannonPrototype({ rotation: 270, firepower: 90, range: 110 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 4, length: 7, maxHealth: 4, speed: 120, cannons: cannon2, name: "The Raven" })
    );

    // The Tank
    cannon6[0] = CannonPrototype({ rotation: 90, firepower: 50, range: 52 });
    cannon6[1] = CannonPrototype({ rotation: 270, firepower: 50, range: 52 });
    cannon6[2] = CannonPrototype({ rotation: 30, firepower: 50, range: 52 });
    cannon6[3] = CannonPrototype({ rotation: 330, firepower: 50, range: 52 });
    cannon6[4] = CannonPrototype({ rotation: 150, firepower: 50, range: 52 });
    cannon6[5] = CannonPrototype({ rotation: 210, firepower: 50, range: 52 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 4, length: 12, maxHealth: 6, speed: 50, cannons: cannon6, name: "The Tank" })
    );

    // Victory
    cannon5[0] = CannonPrototype({ rotation: 90, firepower: 65, range: 70 });
    cannon5[1] = CannonPrototype({ rotation: 270, firepower: 65, range: 70 });
    cannon5[2] = CannonPrototype({ rotation: 45, firepower: 60, range: 60 });
    cannon5[3] = CannonPrototype({ rotation: 315, firepower: 60, range: 60 });
    cannon5[4] = CannonPrototype({ rotation: 0, firepower: 60, range: 60 });
    LibCreateShip.createShip(
      components,
      ShipPrototype({ price: 5, length: 13, maxHealth: 8, speed: 110, cannons: cannon5, name: "Victory" })
    );

    gameConfigComponent.set(
      GodID,
      GameConfig({
        startTime: block.timestamp,
        commitPhaseLength: 25,
        revealPhaseLength: 9,
        actionPhaseLength: 25,
        worldSize: 160,
        perlinSeed: 454520,
        entryCutoffTurns: 500, // entry is closed after the 60th turn (~1 hour)
        buyin: 0,
        respawnAllowed: false,
        // Calculation: Every turn, the world shrinks by gameConfig.shrinkrate / 100.
        // If shrink rate is 100, the world will shrink by 1 each turn.
        // Shrinking starts once entry is cutoff and ends when the world size is 50.
        shrinkRate: 500,
        budget: 5
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
