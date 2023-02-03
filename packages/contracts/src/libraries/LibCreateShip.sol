// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";

import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../components/ShipPrototypeComponent.sol";

import { ShipPrototype, CannonPrototype } from "../libraries/DSTypes.sol";

library LibCreateShip {
  function createShip(IUint256Component components, ShipPrototype memory shipPrototype)
    public
    returns (uint256 prototypeEntity)
  {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      getAddressById(components, ShipPrototypeComponentID)
    );

    bytes memory packedShipPrototype = abi.encode(shipPrototype);
    prototypeEntity = uint256(keccak256(packedShipPrototype));
    require(!shipPrototypeComponent.has(prototypeEntity), "createShip: ship prototype already created");
    shipPrototypeComponent.set(prototypeEntity, packedShipPrototype);
  }
}
