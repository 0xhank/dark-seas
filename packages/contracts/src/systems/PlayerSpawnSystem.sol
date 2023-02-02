// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
// Components
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { Coord, GameConfig, GodID } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.PlayerSpawn"));

contract PlayerSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    require(
      block.timestamp < gameConfig.startTime + gameConfig.entryCutoff,
      "PlayerSpawnSystem: entry period has ended"
    );
    require(!LibUtils.playerAddrExists(components, msg.sender), "PlayerSpawnSystem: player has already spawned");

    (string memory name, Coord memory location) = abi.decode(arguments, (string, Coord));
    require(bytes(name).length > 0, "PlayerSpawnSystem: name is blank");

    // create entity for player and name it
    uint256 playerEntity = LibSpawn.createPlayerEntity(components, msg.sender);
    NameComponent(getAddressById(components, NameComponentID)).set(playerEntity, name);

    LibSpawn.spawn(world, components, playerEntity, location);
  }

  function executeTyped(string calldata name, Coord calldata location) public returns (bytes memory) {
    return execute(abi.encode(name, location));
  }
}
