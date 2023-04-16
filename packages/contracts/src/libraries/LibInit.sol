// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "../libraries/LibCreateShipPrototype.sol";
import "../libraries/LibUtils.sol";

import { MoveCard, GameConfig, ShipPrototype, CannonPrototype, Coord } from "../libraries/DSTypes.sol";

library LibInit {
  function init(IWorld world) internal {
    CannonPrototype[] memory cannon6 = new CannonPrototype[](6);
    CannonPrototype[] memory cannon5 = new CannonPrototype[](5);
    CannonPrototype[] memory cannon4 = new CannonPrototype[](4);
    CannonPrototype[] memory cannon3 = new CannonPrototype[](3);
    CannonPrototype[] memory cannon2 = new CannonPrototype[](2);
    CannonPrototype[] memory cannon1 = new CannonPrototype[](1);

    // Leaky Canoe
    cannon2[0] = CannonPrototype({ rotation: 90, firepower: 7, range: 50 });
    cannon2[1] = CannonPrototype({ rotation: 270, firepower: 7, range: 50 });

    uint256 ship1 = LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 1, length: 6, maxHealth: 3, speed: 8, cannons: cannon2, name: "Leaky Canoe" }),
      100000000
    );

    // Wet Blanket
    cannon1[0] = CannonPrototype({ rotation: 0, firepower: 8, range: 72 });
    uint256 ship2 = LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 1, length: 6, maxHealth: 3, speed: 8, cannons: cannon1, name: "Wet Blanket" }),
      100000000
    );

    // Waterski
    cannon2[0] = CannonPrototype({ rotation: 45, firepower: 10, range: 70 });
    cannon2[1] = CannonPrototype({ rotation: 315, firepower: 10, range: 70 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 2, length: 7, maxHealth: 3, speed: 15, cannons: cannon2, name: "Waterski" }),
      1000
    );

    // Tugboat
    cannon2[0] = CannonPrototype({ rotation: 0, firepower: 8, range: 70 });
    cannon2[1] = CannonPrototype({ rotation: 180, firepower: 8, range: 70 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 2, length: 8, maxHealth: 5, speed: 5, cannons: cannon2, name: "Tugboat" }),
      1000
    );

    // Dolphin
    cannon3[0] = CannonPrototype({ rotation: 90, firepower: 9, range: 80 });
    cannon3[1] = CannonPrototype({ rotation: 270, firepower: 9, range: 80 });
    cannon3[2] = CannonPrototype({ rotation: 0, firepower: 11, range: 80 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 3, length: 9, maxHealth: 5, speed: 10, cannons: cannon3, name: "Dolphin" }),
      1000
    );

    // Defiance
    cannon4[0] = CannonPrototype({ rotation: 90, firepower: 11, range: 60 });
    cannon4[1] = CannonPrototype({ rotation: 270, firepower: 11, range: 60 });
    cannon4[2] = CannonPrototype({ rotation: 30, firepower: 12, range: 70 });
    cannon4[3] = CannonPrototype({ rotation: 330, firepower: 12, range: 70 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 3, length: 9, maxHealth: 4, speed: 8, cannons: cannon4, name: "Defiance" }),
      1000
    );

    // The Raven
    cannon2[0] = CannonPrototype({ rotation: 90, firepower: 18, range: 110 });
    cannon2[1] = CannonPrototype({ rotation: 270, firepower: 18, range: 110 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 4, length: 7, maxHealth: 4, speed: 12, cannons: cannon2, name: "The Raven" }),
      1000
    );

    // The Tank
    cannon6[0] = CannonPrototype({ rotation: 90, firepower: 10, range: 52 });
    cannon6[1] = CannonPrototype({ rotation: 270, firepower: 10, range: 52 });
    cannon6[2] = CannonPrototype({ rotation: 30, firepower: 10, range: 52 });
    cannon6[3] = CannonPrototype({ rotation: 330, firepower: 10, range: 52 });
    cannon6[4] = CannonPrototype({ rotation: 150, firepower: 10, range: 52 });
    cannon6[5] = CannonPrototype({ rotation: 210, firepower: 10, range: 52 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 4, length: 12, maxHealth: 6, speed: 5, cannons: cannon6, name: "The Tank" }),
      1000
    );

    // Victory
    cannon5[0] = CannonPrototype({ rotation: 90, firepower: 13, range: 70 });
    cannon5[1] = CannonPrototype({ rotation: 270, firepower: 13, range: 70 });
    cannon5[2] = CannonPrototype({ rotation: 45, firepower: 12, range: 60 });
    cannon5[3] = CannonPrototype({ rotation: 315, firepower: 12, range: 60 });
    cannon5[4] = CannonPrototype({ rotation: 0, firepower: 12, range: 60 });
    LibCreateShipPrototype.createShipPrototype(
      world,
      ShipPrototype({ price: 5, length: 13, maxHealth: 8, speed: 11, cannons: cannon5, name: "Victory" }),
      1000
    );

    uint256[] memory defaultShips = new uint256[](2);
    defaultShips[0] = ship1;
    defaultShips[1] = ship2;
    LibCreateShipPrototype.setDefaultShips(world, defaultShips);
  }
}
