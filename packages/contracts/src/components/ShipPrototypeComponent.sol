// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

uint256 constant ID = uint256(keccak256("ds.component.ShipPrototype"));

contract ShipPrototypeComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](1);
    values = new LibTypes.SchemaValue[](1);

    keys[0] = "value";
    values[0] = LibTypes.SchemaValue.BYTES;
  }

  function getValue(uint256 entity) public view returns (bytes memory) {
    bytes memory value = getRawValue(entity);
    return value;
  }

  function encodedValue(bytes memory value) private pure returns (bytes memory) {
    return value;
  }
}
