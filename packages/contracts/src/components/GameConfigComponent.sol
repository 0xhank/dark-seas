// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/Component.sol";

uint256 constant GodID = uint256(0x060D);
uint256 constant ID = uint256(keccak256("ds.component.GameConfig"));

import { GameConfig } from "../libraries/DSTypes.sol";

contract GameConfigComponent is Component {
  constructor(address world) Component(world, ID) {}

  function getSchema() public pure override returns (string[] memory keys, LibTypes.SchemaValue[] memory values) {
    keys = new string[](11);
    values = new LibTypes.SchemaValue[](11);

    keys[0] = "startTime";
    values[0] = LibTypes.SchemaValue.UINT256;

    keys[1] = "commitPhaseLength";
    values[1] = LibTypes.SchemaValue.UINT32;

    keys[2] = "revealPhaseLength";
    values[2] = LibTypes.SchemaValue.UINT32;

    keys[3] = "actionPhaseLength";
    values[3] = LibTypes.SchemaValue.UINT32;

    keys[4] = "worldSize";
    values[4] = LibTypes.SchemaValue.UINT32;

    keys[5] = "perlinSeed";
    values[5] = LibTypes.SchemaValue.INT128;

    keys[6] = "entryCutoffTurns";
    values[6] = LibTypes.SchemaValue.UINT32;

    keys[7] = "buyin";
    values[7] = LibTypes.SchemaValue.UINT256;

    keys[8] = "respawnAllowed";
    values[8] = LibTypes.SchemaValue.BOOL;

    keys[9] = "shrinkRate";
    values[9] = LibTypes.SchemaValue.UINT32;

    keys[10] = "budget";
    values[10] = LibTypes.SchemaValue.UINT32;
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
      uint32 worldSize,
      int128 perlinSeed,
      uint32 entryCutoffTurns,
      uint256 buyin,
      bool respawnAllowed,
      uint32 shrinkRate,
      uint32 budget
    ) = abi.decode(
        getRawValue(entity),
        (uint256, uint32, uint32, uint32, uint32, int128, uint32, uint256, bool, uint32, uint32)
      );
    return
      GameConfig({
        startTime: startTime,
        commitPhaseLength: commitPhaseLength,
        revealPhaseLength: revealPhaseLength,
        actionPhaseLength: actionPhaseLength,
        worldSize: worldSize,
        perlinSeed: perlinSeed,
        entryCutoffTurns: entryCutoffTurns,
        buyin: buyin,
        respawnAllowed: respawnAllowed,
        shrinkRate: shrinkRate,
        budget: budget
      });
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
        config.worldSize,
        config.perlinSeed,
        config.entryCutoffTurns,
        config.buyin,
        config.respawnAllowed,
        config.shrinkRate,
        config.budget
      );
  }
}
