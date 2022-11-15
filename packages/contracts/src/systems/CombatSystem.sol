// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";

import "../libraries/LibPolygon.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.Combat"));

enum Side {
  Right,
  Left
}

contract CombatSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, Side side) = abi.decode(arguments, (uint256, Side));

    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    require(shipComponent.has(entity), "CombatSystem: Must engage in combat with ship");

    Coord[4] memory firingRange = getFiringArea(components, entity, side);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == entity) continue;
      (Coord memory aft, Coord memory stern) = LibPolygon.getShipSternAndAftLocation(components, shipEntities[i]);

      if (!LibPolygon.checkInside(firingRange, aft) && !LibPolygon.checkInside(firingRange, stern)) continue;

      uint32 enemyHealth = healthComponent.getValue(shipEntities[i]);

      if (enemyHealth <= 0) continue;

      healthComponent.set(shipEntities[i], enemyHealth - 1);
    }
  }

  function executeTyped(uint256 entity, Side side) public returns (bytes memory) {
    return execute(abi.encode(entity, side));
  }

  function getFiringArea(
    IUint256Component components,
    uint256 entity,
    Side side
  ) public returns (Coord[4] memory) {
    uint32 range = RangeComponent(getAddressById(components, RangeComponentID)).getValue(entity);
    Coord memory position = PositionComponent(getAddressById(components, PositionComponentID)).getValue(entity);
    uint32 length = LengthComponent(getAddressById(components, LengthComponentID)).getValue(entity);
    uint32 rotation = RotationComponent(getAddressById(components, RotationComponentID)).getValue(entity);
    uint32 topRange = side == Side.Left ? 80 : 280;
    uint32 bottomRange = side == Side.Left ? 100 : 260;
    Coord memory sternLocation = LibPolygon.getSternLocation(position, rotation, length);
    Coord memory topCorner = LibPolygon.getPositionByVector(position, rotation, range, topRange);
    Coord memory bottomCorner = LibPolygon.getPositionByVector(sternLocation, rotation, range, bottomRange);

    return ([position, sternLocation, topCorner, bottomCorner]);
  }
}
