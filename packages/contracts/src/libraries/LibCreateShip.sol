// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../components/ShipPrototypeComponent.sol";
import { ShipPrototype } from "../libraries/DSTypes.sol";

import "../libraries/LibUtils.sol";
import { GodID } from "../libraries/DSTypes.sol";

library LibCreateShip {
  function setDefaultShips(IWorld world, uint256[] calldata shipPrototypeEntities) public {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );

    shipPrototypeComponent.set(GodID, string(abi.encode(shipPrototypeEntities)));
  }

  function createShip(IWorld world, ShipPrototype memory shipPrototype) public returns (uint256 prototypeEntity) {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );

    bytes memory encodedShipPrototype = abi.encode(shipPrototype);
    prototypeEntity = uint256(keccak256(encodedShipPrototype));
    require(!shipPrototypeComponent.has(prototypeEntity), "createShip: ship prototype already created");
    shipPrototypeComponent.set(prototypeEntity, string(encodedShipPrototype));
  }
}
