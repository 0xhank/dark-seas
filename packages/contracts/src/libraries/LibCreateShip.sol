// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../components/ShipPrototypeComponent.sol";
import { ShipPrototype } from "../libraries/DSTypes.sol";

import "../libraries/LibUtils.sol";

library LibCreateShip {
  function createShip(IWorld world, ShipPrototype memory shipPrototype) public returns (uint256 prototypeEntity) {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );

    bytes memory packedShipPrototype = abi.encode(shipPrototype);
    prototypeEntity = uint256(keccak256(packedShipPrototype));
    require(!shipPrototypeComponent.has(prototypeEntity), "createShip: ship prototype already created");
    shipPrototypeComponent.set(prototypeEntity, string(packedShipPrototype));
  }
}
