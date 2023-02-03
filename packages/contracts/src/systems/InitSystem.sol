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

  uint256[] shipEntities;
  CannonPrototype[] cannons;

  function execute(bytes memory arguments) public returns (bytes memory) {
    MoveCardComponent moveCardComponent = MoveCardComponent(getAddressById(components, MoveCardComponentID));
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));

    CannonPrototype memory cannon1 = CannonPrototype({ rotation: 90, firepower: 65, range: 60 });
    CannonPrototype memory cannon2 = CannonPrototype({ rotation: 270, firepower: 65, range: 60 });
    CannonPrototype memory cannon3 = CannonPrototype({ rotation: 345, firepower: 50, range: 50 });
    CannonPrototype memory cannon4 = CannonPrototype({ rotation: 15, firepower: 50, range: 50 });

    cannons.push(cannon1);
    cannons.push(cannon2);
    cannons.push(cannon3);
    cannons.push(cannon4);

    ShipPrototype memory shipPrototype = ShipPrototype({ length: 13, maxHealth: 10, speed: 90, cannons: cannons });

    uint256 shipEntity = LibCreateShip.createShip(components, shipPrototype);
    shipEntities.push(shipEntity);

    cannon1 = CannonPrototype({ rotation: 90, firepower: 50, range: 100 });
    cannon2 = CannonPrototype({ rotation: 270, firepower: 50, range: 100 });
    cannon3 = CannonPrototype({ rotation: 0, firepower: 40, range: 100 });
    delete cannons;

    cannons.push(cannon1);
    cannons.push(cannon2);
    cannons.push(cannon3);
    shipPrototype = ShipPrototype({ length: 10, maxHealth: 10, speed: 110, cannons: cannons });

    shipEntity = LibCreateShip.createShip(components, shipPrototype);
    shipEntities.push(shipEntity);
    gameConfigComponent.set(
      GodID,
      GameConfig({
        startTime: block.timestamp,
        commitPhaseLength: 30,
        revealPhaseLength: 9,
        actionPhaseLength: 23,
        worldSize: 75,
        perlinSeed: 420,
        shipPrototypes: shipEntities,
        entryCutoff: 60 * 60 * 15, // 15 hours,
        buyin: 1000,
        respawnAllowed: true
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
