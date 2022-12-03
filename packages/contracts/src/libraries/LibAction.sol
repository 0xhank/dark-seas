// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";

import { Coord, Wind, Side, MoveCard } from "../libraries/DSTypes.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "../components/OnFireComponent.sol";
import { LeakComponent, ID as LeakComponentID } from "../components/LeakComponent.sol";
import { DamagedSailComponent, ID as DamagedSailComponentID } from "../components/DamagedSailComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { CrewCountComponent, ID as CrewCountComponentID } from "../components/CrewCountComponent.sol";

import { console } from "forge-std/console.sol";

import "trig/src/Trigonometry.sol";
import "./LibCombat.sol";
import "./LibUtils.sol";
import "./LibVector.sol";

library LibAction {
  function applyDamage(IUint256Component components, uint256 entity) public {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));
    CrewCountComponent crewCountComponent = CrewCountComponent(getAddressById(components, CrewCountComponentID));

    if (leakComponent.has(entity)) {
      uint32 crewCount = crewCountComponent.getValue(entity);
      if (crewCount <= 1) crewCountComponent.set(entity, 0);
      else crewCountComponent.set(entity, crewCount - 1);
    }
  }

  function attack(
    IUint256Component components,
    uint256 entity,
    Side side
  ) public {
    if (OnFireComponent(getAddressById(components, OnFireComponentID)).has(entity)) return;
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));

    Coord[4] memory firingRange = LibCombat.getFiringArea(components, entity, side);

    (uint256[] memory shipEntities, ) = LibUtils.getEntityWith(components, ShipComponentID);

    uint256 owner = ownedByComponent.getValue(entity);
    for (uint256 i = 0; i < shipEntities.length; i++) {
      if (shipEntities[i] == entity) continue;
      if (owner == ownedByComponent.getValue(shipEntities[i])) continue;

      (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, shipEntities[i]);

      if (LibVector.withinPolygon(firingRange, aft)) {
        LibCombat.damageEnemy(components, entity, shipEntities[i], aft);
      } else if (LibVector.withinPolygon(firingRange, stern)) {
        LibCombat.damageEnemy(components, entity, shipEntities[i], stern);
      }
    }
  }

  function raiseSail(IUint256Component components, uint256 entity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(entity);

    if (!(currentSailPosition > 0 && currentSailPosition < 3)) return;

    sailPositionComponent.set(entity, currentSailPosition + 1);
  }

  function lowerSail(IUint256Component components, uint256 entity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(entity);

    if (!(currentSailPosition > 1 && currentSailPosition <= 4)) return;

    sailPositionComponent.set(entity, currentSailPosition - 1);
  }

  function extinguishFire(IUint256Component components, uint256 entity) public {
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));

    if (!onFireComponent.has(entity)) return;
    uint32 fireAmount = onFireComponent.getValue(entity);
    if (fireAmount <= 1) onFireComponent.remove(entity);
    else onFireComponent.set(entity, fireAmount - 1);
  }

  function repairLeak(IUint256Component components, uint256 entity) public {
    LeakComponent leakComponent = LeakComponent(getAddressById(components, LeakComponentID));

    if (!leakComponent.has(entity)) return;

    leakComponent.remove(entity);
  }

  function repairMast(IUint256Component components, uint256 entity) public {
    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    if (!sailPositionComponent.has(entity)) return;
    if (sailPositionComponent.getValue(entity) != 0) return;

    sailPositionComponent.set(entity, 1);
  }

  function repairSail(IUint256Component components, uint256 entity) public {
    DamagedSailComponent damagedSailComponent = DamagedSailComponent(
      getAddressById(components, DamagedSailComponentID)
    );

    if (!damagedSailComponent.has(entity)) return;

    damagedSailComponent.remove(entity);
  }
}
