// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { World, WorldQueryFragment } from "solecs/World.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { ABDKMath64x64 as Math } from "./ABDKMath64x64.sol";

import { console } from "forge-std/console.sol";
import { Side } from "../systems/CombatSystem.sol";
import { RangeComponent, ID as RangeComponentID } from "../components/RangeComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "../components/LengthComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../components/RotationComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../components/FirepowerComponent.sol";

import "./LibVector.sol";

library LibCombat {
  /**
   * @notice  masks a bit string based on length and shift
   * @param   _b  bit string to mask
   * @param   length  length in bits of return bit string
   * @param   shift  starting location of mask
   * @return  _byteUInt masked bit string
   */
  function getByteUInt(
    uint256 _b,
    uint256 length,
    uint256 shift
  ) public view returns (uint256 _byteUInt) {
    uint256 mask = ((1 << length) - 1) << shift;
    _byteUInt = (_b & mask) >> shift;
  }

  // 50 * e^(-.03 * distance) * (firepower / 100), multiplied by 100 for precision
  function getBaseHitChance(uint256 distance, uint256 firepower) public returns (uint256 ret) {
    int128 _scaleInv = Math.exp(Math.divu(distance * 3, 100));
    int128 firepowerDebuff = Math.divu(firepower, 100);
    int128 beforeDebuff = Math.div(Math.fromUInt(5000), _scaleInv);
    ret = Math.toUInt(Math.mul(beforeDebuff, firepowerDebuff));
  }

  function getHullDamage(uint256 baseHitChance, uint256 randomSeed) public view returns (uint32) {
    // use first 14 bits for hull damage (log_2(10000) = ~13.2)
    uint256 odds = getByteUInt(randomSeed, 14, 0) % 10000;
    if (odds <= baseHitChance) return 3;
    if (odds <= (baseHitChance * 270) / 100) return 2;
    if (odds <= (baseHitChance * 550) / 100) return 1;
    return 0;
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
    uint32 topRange = side == Side.Right ? 80 : 280;
    uint32 bottomRange = side == Side.Right ? 100 : 260;
    Coord memory sternLocation = LibVector.getSternLocation(position, rotation, length);
    Coord memory topCorner = LibVector.getPositionByVector(position, rotation, range, topRange);
    Coord memory bottomCorner = LibVector.getPositionByVector(sternLocation, rotation, range, bottomRange);

    return ([position, sternLocation, bottomCorner, topCorner]);
  }

  function damageEnemy(
    IUint256Component components,
    uint256 attackerEntity,
    uint256 defenderEntity,
    Coord memory defenderPosition
  ) public {
    Coord memory attackerPosition = PositionComponent(getAddressById(components, PositionComponentID)).getValue(
      attackerEntity
    );
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(attackerEntity);
    uint256 distance = LibVector.distance(attackerPosition, defenderPosition);

    uint256 baseHitChance = getBaseHitChance(distance, firepower);
    uint256 randomness = randomness(attackerEntity, defenderEntity);

    bool dead = damageHull(components, getHullDamage(baseHitChance, randomness), defenderEntity);
    if (dead) return;
    // uint32 crewDamage = getCrewDamage(baseHitChance, randomness);
  }

  function damageHull(
    IUint256Component components,
    uint32 damage,
    uint256 entity
  ) public returns (bool) {
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint32 health = healthComponent.getValue(entity);

    if (health <= damage) {
      healthComponent.set(entity, 0);
      return false;
    }

    healthComponent.set(entity, health - damage);
    return true;
  }

  function randomness(uint256 r1, uint256 r2) public view returns (uint256 r) {
    r = uint256(keccak256(abi.encodePacked(r1, r2, block.timestamp, r1)));
  }
}
