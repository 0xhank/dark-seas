// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

struct Wind {
  // Block timestamp when the game started
  uint32 speed;
  uint32 direction;
}

uint256 constant GodID = uint256(0x060D);
uint256 constant ID = uint256(keccak256("ds.component.Wind"));

contract WindComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](4);
    values = new LibTypes.SchemaValue[](4);

    keys[0] = "speed";
    values[0] = LibTypes.SchemaValue.UINT32;

    keys[1] = "direction";
    values[1] = LibTypes.SchemaValue.UINT32;
  }

  function set(uint256 entity, Wind calldata wind) public {
    set(entity, encodedValue(wind));
  }

  function getValue(uint256 entity) public view returns (Wind memory) {
    (uint32 speed, uint32 direction) = abi.decode(getRawValue(entity), (uint32, uint32));
    return Wind(speed, direction);
  }

  function getEntitiesWithValue(Wind calldata wind) public view returns (uint256[] memory) {
    return getEntitiesWithValue(encodedValue(wind));
  }

  function encodedValue(Wind calldata wind) private pure returns (bytes memory) {
    return abi.encode(wind.speed, wind.direction);
  }
}
