// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External
import "std-contracts/components/Uint32Component.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
// Components
import { UpgradeComponent, ID as UpgradeComponentID } from "../components/UpgradeComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { ID as HealthComponentID } from "../components/HealthComponent.sol";
import { ID as LengthComponentID } from "../components/LengthComponent.sol";
import { ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";
import { ID as SpeedComponentID } from "../components/SpeedComponent.sol";

// Types
import { Upgrade, Coord } from "./DSTypes.sol";

// Libraries
import "./LibVector.sol";
import "./LibUtils.sol";

library LibCrate {
  function createCrate(IWorld world, Coord memory position) public {
    uint256 crateEntity = world.getUniqueEntityId();

    uint256 componentSeed = LibUtils.getByteUInt(crateEntity, 2, 0);
    uint256 componentId;
    if (componentSeed == 0) componentId = HealthComponentID;
    else if (componentSeed == 1) componentId = LengthComponentID;
    else if (componentSeed == 2) componentId = FirepowerComponentID;
    else if (componentSeed == 3) componentId = SpeedComponentID;

    uint32 amount = uint32(LibUtils.getByteUInt(crateEntity, 1, 2));

    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(crateEntity, position);
    UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID)).set(
      crateEntity,
      Upgrade({ componentId: componentId, amount: amount + 1 })
    );
  }

  function claimCrate(
    IWorld world,
    uint256 shipEntity,
    uint256 crateEntity
  ) public {
    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    require(positionComponent.has(crateEntity), "claimCrate: crate already claimed");
    Coord memory cratePosition = positionComponent.getValue(crateEntity);
    Coord memory shipPosition = positionComponent.getValue(shipEntity);

    require(LibVector.distance(shipPosition, cratePosition) < 20, "claimCrate: too far away");

    Upgrade memory upgrade = UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID)).getValue(crateEntity);
    Uint32Component component = Uint32Component(LibUtils.addressById(world, upgrade.componentId));
    uint32 value = component.getValue(shipEntity);
    component.set(shipEntity, value + upgrade.amount);

    positionComponent.remove(crateEntity);
  }
}
