// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { World, WorldQueryFragment } from "solecs/World.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { ABDKMath64x64 as Math } from "./ABDKMath64x64.sol";

import { console } from "forge-std/console.sol";

library LibCombat {
  function getRandomness(uint256 seed) public returns (uint256) {
    return block.timestamp * seed;
  }

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

  function getBaseHitChance(uint256 distance, uint256 firepower) public returns (uint256 ret) {
    int128 _scaleInv = Math.exp(Math.divu(distance * 3, 100));

    int128 firepowerDebuff = Math.divu(firepower, 100);

    console.logInt(_scaleInv);

    int128 beforeDebuff = Math.div(Math.fromUInt(50), _scaleInv);

    console.logInt(beforeDebuff);

    ret = Math.toUInt(Math.mul(beforeDebuff, firepowerDebuff));

    console.log("ret:", ret);
  }
}
