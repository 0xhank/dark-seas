// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";

import "../libraries/LibVector.sol";
import "../libraries/LibCombat.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.Combat"));

enum Side {
  Right,
  Left
}

contract CombatSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function isValid(bytes memory arguments) internal view returns (uint256 entity, Side side) {
    (entity, side) = abi.decode(arguments, (uint256, Side));
    ShipComponent shipComponent = ShipComponent(getAddressById(components, ShipComponentID));
    require(shipComponent.has(entity), "CombatSystem: Must engage in combat with ship");
  }

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, Side side) = isValid(arguments);

    Coord[4] memory firingRange = LibCombat.getFiringArea(components, entity, side);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == entity) continue;
      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);

      if (LibVector.withinPolygon(firingRange, aft)) {
        LibCombat.damageEnemy(components, entity, shipEntities[i], aft);
      } else if (LibVector.withinPolygon(firingRange, stern)) {
        LibCombat.damageEnemy(components, entity, shipEntities[i], stern);
      }
    }
  }

  function executeTyped(uint256 entity, Side side) public returns (bytes memory) {
    return execute(abi.encode(entity, side));
  }
}
