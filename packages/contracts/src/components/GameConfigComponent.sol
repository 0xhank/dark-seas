// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

uint256 constant GodID = uint256(0x060D);
uint256 constant ID = uint256(keccak256("ds.component.GameConfig"));

import { GameConfig } from "../libraries/DSTypes.sol";

contract GameConfigComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](5);
    values = new LibTypes.SchemaValue[](5);

    keys[0] = "startTime";
    values[0] = LibTypes.SchemaValue.UINT256;

    keys[1] = "commitPhaseLength";
    values[1] = LibTypes.SchemaValue.UINT32;

    keys[2] = "revealPhaseLength";
    values[2] = LibTypes.SchemaValue.UINT32;

    keys[3] = "actionPhaseLength";
    values[3] = LibTypes.SchemaValue.UINT32;

    keys[4] = "worldRadius";
    values[4] = LibTypes.SchemaValue.UINT32;
  }

  function set(uint256 entity, GameConfig calldata config) public {
    set(entity, encodedValue(config));
  }

  function getValue(uint256 entity) public view returns (GameConfig memory) {
    (
      uint256 startTime,
      uint32 commitPhaseLength,
      uint32 revealPhaseLength,
      uint32 actionPhaseLength,
      uint32 worldRadius
    ) = abi.decode(getRawValue(entity), (uint256, uint32, uint32, uint32, uint32));
    return GameConfig(startTime, commitPhaseLength, revealPhaseLength, actionPhaseLength, worldRadius);
  }

  function getEntitiesWithValue(GameConfig calldata config) public view returns (uint256[] memory) {
    return getEntitiesWithValue(encodedValue(config));
  }

  function encodedValue(GameConfig calldata config) private pure returns (bytes memory) {
    return
      abi.encode(
        config.startTime,
        config.commitPhaseLength,
        config.revealPhaseLength,
        config.actionPhaseLength,
        config.worldRadius
      );
  }
}
