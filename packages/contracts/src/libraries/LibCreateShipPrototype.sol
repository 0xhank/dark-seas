// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { IWorld } from "solecs/interfaces/IWorld.sol";

import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "../../components/ShipPrototypeComponent.sol";
import { PriceComponent, ID as PriceComponentID } from "../../components/PriceComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../../components/LengthComponent.sol";
import { MaxHealthComponent, ID as MaxHealthComponentID } from "../../components/MaxHealthComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "../../components/SpeedComponent.sol";
import { NameComponent, ID as NameComponentID } from "../../components/NameComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../../components/FirepowerComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../../components/RangeComponent.sol";
import { OwnerOfComponent, ID as OwnerOfComponentID } from "../../components/OwnerOfComponent.sol";

import { ShipPrototype, CannonPrototype } from "../libraries/DSTypes.sol";

import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";
import { GodID } from "../libraries/DSTypes.sol";

library LibCreateShipPrototype {
  function setDefaultShips(IWorld world, uint256[] memory shipPrototypeEntities) internal {
    OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID)).set(GodID, shipPrototypeEntities);
  }

  function createShipPrototype(
    IWorld world,
    ShipPrototype memory shipPrototype
  ) internal returns (uint256 prototypeEntity) {
    prototypeEntity = uint256(keccak256(abi.encode(shipPrototype)));
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );
    if (shipPrototypeComponent.has(prototypeEntity)) return prototypeEntity;
    shipPrototypeComponent.set(prototypeEntity);
    PriceComponent(LibUtils.addressById(world, PriceComponentID)).set(prototypeEntity, shipPrototype.price);
    SpeedComponent(LibUtils.addressById(world, SpeedComponentID)).set(prototypeEntity, shipPrototype.speed);
    LengthComponent(LibUtils.addressById(world, LengthComponentID)).set(prototypeEntity, shipPrototype.length);
    MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID)).set(prototypeEntity, shipPrototype.maxHealth);
    NameComponent(LibUtils.addressById(world, NameComponentID)).set(prototypeEntity, shipPrototype.name);

    uint256[] memory cannonEntities = new uint256[](shipPrototype.cannons.length);
    for (uint256 i = 0; i < shipPrototype.cannons.length; i++) {
      cannonEntities[i] = createCannonPrototype(world, prototypeEntity, shipPrototype.cannons[i]);
    }
    OwnerOfComponent(LibUtils.addressById(world, OwnerOfComponentID)).set(prototypeEntity, cannonEntities);
  }

  function createCannonPrototype(
    IWorld world,
    uint256 shipPrototypeEntity,
    CannonPrototype memory cannonPrototype
  ) internal returns (uint256 cannonPrototypeEntity) {
    cannonPrototypeEntity = uint256(keccak256(abi.encode(cannonPrototype)));

    CannonComponent cannonComponent = CannonComponent(LibUtils.addressById(world, CannonComponentID));
    if (cannonComponent.has(cannonPrototypeEntity)) return cannonPrototypeEntity;
    cannonComponent.set(cannonPrototypeEntity);

    RotationComponent(LibUtils.addressById(world, RotationComponentID)).set(
      cannonPrototypeEntity,
      cannonPrototype.rotation
    );
    FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID)).set(
      cannonPrototypeEntity,
      cannonPrototype.firepower
    );
    RangeComponent(LibUtils.addressById(world, RangeComponentID)).set(cannonPrototypeEntity, cannonPrototype.range);
  }
}
