// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

import { Upgrade } from "../libraries/DSTypes.sol";
uint256 constant ID = uint256(keccak256("ds.component.Upgrade"));

// The upgrade must be a UInt32Component
contract UpgradeComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](2);
    values = new LibTypes.SchemaValue[](2);

    keys[0] = "componentId";
    values[0] = LibTypes.SchemaValue.UINT256;

    keys[1] = "amount";
    values[1] = LibTypes.SchemaValue.UINT32;
  }

  function set(uint256 entity, Upgrade calldata upgrade) public {
    set(entity, encodedValue(upgrade));
  }

  function getValue(uint256 entity) public view returns (Upgrade memory) {
    (uint256 componentId, uint32 amount) = abi.decode(getRawValue(entity), (uint256, uint32));
    return Upgrade(componentId, amount);
  }

  function getEntitiesWithValue(Upgrade calldata upgrade) public view returns (uint256[] memory) {
    return getEntitiesWithValue(encodedValue(upgrade));
  }

  function encodedValue(Upgrade calldata upgrade) private pure returns (bytes memory) {
    return abi.encode(upgrade.componentId, upgrade.amount);
  }
}
