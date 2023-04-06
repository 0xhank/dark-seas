// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External
import "std-contracts/components/Uint32Component.sol";
import { console } from "forge-std/console.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
// Components
import { UpgradeComponent, ID as UpgradeComponentID } from "../components/UpgradeComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { CurrentGameComponent, ID as CurrentGameComponentID } from "../components/CurrentGameComponent.sol";
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
  // todo: reset length and speed stats after round end
  function createCrate(IWorld world, uint256 gameId, Coord memory position) internal returns (uint256 crateEntity) {
    crateEntity = world.getUniqueEntityId();

    uint256 componentSeed = LibUtils.getByteUInt(crateEntity, 2, 0);
    uint256 componentId;
    if (componentSeed == 0) componentId = HealthComponentID;
    else if (componentSeed == 1) componentId = LengthComponentID;
    else if (componentSeed == 2) componentId = FirepowerComponentID;
    else componentId = SpeedComponentID;

    uint32 amount = uint32(LibUtils.getByteUInt(crateEntity, 2, 2)) == 0 ? 2 : 1;

    CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).set(crateEntity, gameId);
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(crateEntity, position);
    UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID)).set(
      crateEntity,
      Upgrade({ componentId: componentId, amount: amount })
    );
  }

  function claimCrate(IWorld world, uint256 shipEntity, uint256 crateEntity) internal {
    CurrentGameComponent currentGameComponent = CurrentGameComponent(
      LibUtils.addressById(world, CurrentGameComponentID)
    );
    PositionComponent positionComponent = PositionComponent(LibUtils.addressById(world, PositionComponentID));
    require(
      currentGameComponent.getValue(shipEntity) == currentGameComponent.getValue(crateEntity),
      "claimCrate: ship and crate exist in different games"
    );
    require(positionComponent.has(crateEntity), "claimCrate: crate has no position");
    Coord memory cratePosition = positionComponent.getValue(crateEntity);
    (Coord memory shipPosition, Coord memory aftPosition) = LibVector.getShipBowAndSternPosition(world, shipEntity);

    require(
      LibVector.distance(shipPosition, cratePosition) < 20 || LibVector.distance(aftPosition, cratePosition) < 20,
      "claimCrate: too far away"
    );

    Upgrade memory upgrade = UpgradeComponent(LibUtils.addressById(world, UpgradeComponentID)).getValue(crateEntity);
    Uint32Component component = Uint32Component(LibUtils.addressById(world, upgrade.componentId));
    uint32 value = component.getValue(shipEntity);
    component.set(shipEntity, value + upgrade.amount);

    positionComponent.remove(crateEntity);
  }
}
