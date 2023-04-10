// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { console } from "forge-std/console.sol";

// Components
import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../components/ShipPrototypeComponent.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

// Types
import { ShipPrototype, GodID } from "../libraries/DSTypes.sol";

uint256 constant ID = uint256(keccak256("ds.system.PurchaseShip"));

contract PurchaseShipSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    uint256 shipPrototypeEntity = abi.decode(arguments, (uint256));
    require(
      ShipPrototypeComponent(LibUtils.addressById(world, ShipPrototypeComponentID)).has(shipPrototypeEntity),
      "PurchaseShipSystem: entity is not a ship prototype"
    );
    LibSpawn.initializeShip(world, shipPrototypeEntity);
  }

  function executeTyped(uint256 shipPrototypeEntity) public returns (bytes memory) {
    return execute(abi.encode(shipPrototypeEntity));
  }
}
