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
  // inclusive on both ends
  function getByteUInt(
    bytes memory _b,
    uint256 _startByte,
    uint256 _endByte
  ) public pure returns (uint256 _byteUInt) {
    for (uint256 i = _startByte; i <= _endByte; i++) {
      _byteUInt += uint256(uint8(_b[i])) * (256**(_endByte - i));
    }
  }

  // 50 * e^(-.03 * distance) * (firepower / 100), multiplied by 100 for precision
  function getBaseHitChance(uint256 distance, uint256 firepower) public returns (uint256 ret) {
    int128 _scaleInv = Math.exp(Math.divu(distance * 3, 100));
    int128 firepowerDebuff = Math.divu(firepower, 100);
    int128 beforeDebuff = Math.div(Math.fromUInt(5000), _scaleInv);
    ret = Math.toUInt(Math.mul(beforeDebuff, firepowerDebuff));
  }

  function getHullDamage(uint256 baseHitChance, uint256 randomSeed) public returns (uint256) {
    uint256 odds = randomSeed % 10000;

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
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    FirepowerComponent firepowerComponent = FirepowerComponent(getAddressById(components, FirepowerComponentID));

    Coord memory attackerPosition = positionComponent.getValue(attackerEntity);
    uint32 firepower = firepowerComponent.getValue(attackerEntity);
    uint256 distance = LibVector.distance(attackerPosition, defenderPosition);

    uint256 baseHitChance = getBaseHitChance(distance, firepower);
    uint32 damage = getHullDamage(baseHitChance, randomness(attackerEntity, defenderEntity));

    uint32 defenderHealth = healthComponent.getValue(defenderEntity);

    if (defenderHealth <= damage) {
      healthComponent.set(defenderEntity, 0);
    } else {
      healthComponent.set(defenderEntity, defenderHealth - damage);
    }
  }

  function randomness(uint256 r1, uint256 r2) public view returns (uint256 r) {
    r = uint256(keccak256(abi.encodePacked(r1, r2, block.timestamp, r1)));
  }
}
