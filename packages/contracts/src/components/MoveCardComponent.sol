// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

struct MoveCard {
  uint32 distance;
  uint32 direction;
  uint32 rotation;
}

uint256 constant ID = uint256(keccak256("ds.component.MoveCard"));

contract MoveCardComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](3);
    values = new LibTypes.SchemaValue[](3);

    keys[0] = "distance";
    values[0] = LibTypes.SchemaValue.UINT32;

    keys[1] = "direction";
    values[1] = LibTypes.SchemaValue.UINT32;

    keys[2] = "rotation";
    values[2] = LibTypes.SchemaValue.UINT32;
  }

  function set(uint256 entity, MoveCard calldata moveCard) public {
    set(entity, encodedValue(moveCard));
  }

  function getValue(uint256 entity) public view returns (MoveCard memory) {
    (uint32 distance, uint32 direction, uint32 rotation) = abi.decode(getRawValue(entity), (uint32, uint32, uint32));
    return MoveCard(distance, direction, rotation);
  }

  function getEntitiesWithValue(MoveCard calldata moveCard) public view returns (uint256[] memory) {
    return getEntitiesWithValue(encodedValue(moveCard));
  }

  function encodedValue(MoveCard calldata moveCard) private pure returns (bytes memory) {
    return abi.encode(moveCard.distance, moveCard.direction, moveCard.rotation);
  }
}
