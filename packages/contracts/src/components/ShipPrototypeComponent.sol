// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

uint256 constant ID = uint256(keccak256("ds.component.ShipPrototype"));

contract ShipPrototypeComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema()
    public
    pure
    virtual
    override
    returns (string[] memory keys, LibTypes.SchemaValue[] memory values)
  {
    keys = new string[](1);
    values = new LibTypes.SchemaValue[](1);

    keys[0] = "value";
    values[0] = LibTypes.SchemaValue.BYTES;
  }

  function set(uint256 entity, string memory value) public virtual {
    set(entity, abi.encode(value));
  }

  function getValue(uint256 entity) public view virtual returns (string memory) {
    string memory value = abi.decode(getRawValue(entity), (string));
    return value;
  }

  function getEntitiesWithValue(string memory value) public view virtual returns (uint256[] memory) {
    return getEntitiesWithValue(abi.encode(value));
  }
}
