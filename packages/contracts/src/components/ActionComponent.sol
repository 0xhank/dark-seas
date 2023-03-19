// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "std-contracts/components/FunctionBareComponent.sol";

uint256 constant ID = uint256(keccak256("ds.component.Action"));

contract ActionComponent is FunctionBareComponent {
  constructor(address world) FunctionBareComponent(world, ID) {}
}
