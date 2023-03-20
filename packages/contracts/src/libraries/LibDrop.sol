// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External
import "std-contracts/components/Uint32Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
// Components
import { UpgradeComponent, ID as UpgradeComponentID } from "../components/UpgradeComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";

// Types
import { Upgrade, Coord } from "./DSTypes.sol";

// Libraries
import "./LibVector.sol";
import "./LibUtils.sol";

library LibDrop {
  function createDrop(
    IWorld world,
    Upgrade calldata upgrade,
    Coord memory position
  ) public {
    uint256 dropEntity = world.getUniqueEntityId();

    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(dropEntity, position);
    UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID)).set(dropEntity, upgrade);
  }

  function claimDrop(
    IWorld world,
    uint256 shipEntity,
    uint256 dropEntity
  ) public {
    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    require(positionComponent.has(dropEntity), "claimDrop: drop already claimed");
    Coord memory dropPosition = positionComponent.getValue(dropEntity);
    Coord memory shipPosition = positionComponent.getValue(shipEntity);

    require(LibVector.distance(shipPosition, dropPosition) < 20, "claimDrop: too far away");

    Upgrade memory upgrade = UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID)).getValue(dropEntity);
    Uint32Component component = Uint32Component(LibUtils.addressById(world, upgrade.componentId));
    uint32 value = component.getValue(shipEntity);
    component.set(shipEntity, value + upgrade.amount);

    positionComponent.remove(dropEntity);
  }
}
