// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import { getAddressById } from "solecs/utils.sol";
import "solecs/System.sol";

// Components
import { MoveCardComponent, ID as MoveCardComponentID } from "../components/MoveCardComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
import { ActionComponent, ID as ActionComponentID, FunctionSelector } from "../components/ActionComponent.sol";
import { ActionSystem, ID as ActionSystemID } from "../systems/ActionSystem.sol";
// Types
import { MoveCard, GameConfig, ShipPrototype, CannonPrototype, Coord } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.Init"));

import "../libraries/LibCreateShip.sol";
import "../libraries/LibUtils.sol";
import "../libraries/LibCrate.sol";

// @todo: make this admin only
contract InitSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    GameConfigComponent gameConfigComponent = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID));

    uint256 gameId = world.getUniqueEntityId();

    gameConfigComponent.set(gameId, abi.decode(arguments, (GameConfig)));

    createShips();
    createMoveCards();
    createActions();

    return abi.encode(gameId);
  }

  function executeTyped(GameConfig calldata gameConfig) public returns (bytes memory) {
    return execute(abi.encode(gameConfig));
  }

  function createShips() private {
    CannonPrototype[] memory cannon6 = new CannonPrototype[](6);
    CannonPrototype[] memory cannon5 = new CannonPrototype[](5);
    CannonPrototype[] memory cannon4 = new CannonPrototype[](4);
    CannonPrototype[] memory cannon3 = new CannonPrototype[](3);
    CannonPrototype[] memory cannon2 = new CannonPrototype[](2);
    CannonPrototype[] memory cannon1 = new CannonPrototype[](1);

    // Leaky Canoe
    cannon2[0] = CannonPrototype({ rotation: 90, firepower: 7, range: 50 });
    cannon2[1] = CannonPrototype({ rotation: 270, firepower: 7, range: 50 });

    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 1, length: 6, maxHealth: 3, speed: 8, cannons: cannon2, name: "Leaky Canoe" })
    );

    // Wet Blanket
    cannon1[0] = CannonPrototype({ rotation: 0, firepower: 8, range: 72 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 1, length: 6, maxHealth: 3, speed: 8, cannons: cannon1, name: "Wet Blanket" })
    );

    // Waterski
    cannon2[0] = CannonPrototype({ rotation: 45, firepower: 10, range: 70 });
    cannon2[1] = CannonPrototype({ rotation: 315, firepower: 10, range: 70 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 2, length: 7, maxHealth: 3, speed: 15, cannons: cannon2, name: "Waterski" })
    );

    // Tugboat
    cannon2[0] = CannonPrototype({ rotation: 0, firepower: 8, range: 70 });
    cannon2[1] = CannonPrototype({ rotation: 180, firepower: 8, range: 70 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 2, length: 8, maxHealth: 5, speed: 5, cannons: cannon2, name: "Tugboat" })
    );

    // Dolphin
    cannon3[0] = CannonPrototype({ rotation: 90, firepower: 9, range: 80 });
    cannon3[1] = CannonPrototype({ rotation: 270, firepower: 9, range: 80 });
    cannon3[2] = CannonPrototype({ rotation: 0, firepower: 11, range: 80 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 3, length: 9, maxHealth: 5, speed: 10, cannons: cannon3, name: "Dolphin" })
    );

    // Defiance
    cannon4[0] = CannonPrototype({ rotation: 90, firepower: 11, range: 60 });
    cannon4[1] = CannonPrototype({ rotation: 270, firepower: 11, range: 60 });
    cannon4[2] = CannonPrototype({ rotation: 30, firepower: 12, range: 70 });
    cannon4[3] = CannonPrototype({ rotation: 330, firepower: 12, range: 70 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 3, length: 9, maxHealth: 4, speed: 8, cannons: cannon4, name: "Defiance" })
    );

    // The Raven
    cannon2[0] = CannonPrototype({ rotation: 90, firepower: 18, range: 110 });
    cannon2[1] = CannonPrototype({ rotation: 270, firepower: 18, range: 110 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 4, length: 7, maxHealth: 4, speed: 12, cannons: cannon2, name: "The Raven" })
    );

    // The Tank
    cannon6[0] = CannonPrototype({ rotation: 90, firepower: 10, range: 52 });
    cannon6[1] = CannonPrototype({ rotation: 270, firepower: 10, range: 52 });
    cannon6[2] = CannonPrototype({ rotation: 30, firepower: 10, range: 52 });
    cannon6[3] = CannonPrototype({ rotation: 330, firepower: 10, range: 52 });
    cannon6[4] = CannonPrototype({ rotation: 150, firepower: 10, range: 52 });
    cannon6[5] = CannonPrototype({ rotation: 210, firepower: 10, range: 52 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 4, length: 12, maxHealth: 6, speed: 5, cannons: cannon6, name: "The Tank" })
    );

    // Victory
    cannon5[0] = CannonPrototype({ rotation: 90, firepower: 13, range: 70 });
    cannon5[1] = CannonPrototype({ rotation: 270, firepower: 13, range: 70 });
    cannon5[2] = CannonPrototype({ rotation: 45, firepower: 12, range: 60 });
    cannon5[3] = CannonPrototype({ rotation: 315, firepower: 12, range: 60 });
    cannon5[4] = CannonPrototype({ rotation: 0, firepower: 12, range: 60 });
    LibCreateShip.createShip(
      world,
      ShipPrototype({ price: 5, length: 13, maxHealth: 8, speed: 11, cannons: cannon5, name: "Victory" })
    );
  }

  function createMoveCards() private {
    // Initialize Prototypes
    MoveCardComponent moveCardComponent = MoveCardComponent(LibUtils.addressById(world, MoveCardComponentID));
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

  function createActions() private {
    ActionComponent actionComponent = ActionComponent(LibUtils.addressById(world, ActionComponentID));
    ActionSystem actionSystem = ActionSystem(getAddressById(world.systems(), ActionSystemID));
    uint256 LoadID = uint256(keccak256("action.load"));
    actionComponent.set(LoadID, FunctionSelector(address(actionSystem), actionSystem.load.selector));

    uint256 FireID = uint256(keccak256("action.fire"));
    actionComponent.set(FireID, FunctionSelector(address(actionSystem), actionSystem.fire.selector));

    uint256 RaiseSailID = uint256(keccak256("action.raiseSail"));
    actionComponent.set(RaiseSailID, FunctionSelector(address(actionSystem), actionSystem.raiseSail.selector));

    uint256 LowerSailID = uint256(keccak256("action.lowerSail"));
    actionComponent.set(LowerSailID, FunctionSelector(address(actionSystem), actionSystem.lowerSail.selector));

    uint256 RepairSailID = uint256(keccak256("action.repairSail"));
    actionComponent.set(RepairSailID, FunctionSelector(address(actionSystem), actionSystem.repairSail.selector));

    uint256 ExtinguishFireID = uint256(keccak256("action.extinguishFire"));
    actionComponent.set(
      ExtinguishFireID,
      FunctionSelector(address(actionSystem), actionSystem.extinguishFire.selector)
    );

    uint256 RepairCannonsID = uint256(keccak256("action.repairCannons"));
    actionComponent.set(RepairCannonsID, FunctionSelector(address(actionSystem), actionSystem.repairCannons.selector));

    uint256 ClaimCrateID = uint256(keccak256("action.claimCrate"));
    actionComponent.set(ClaimCrateID, FunctionSelector(address(actionSystem), actionSystem.claimCrate.selector));
  }
}
