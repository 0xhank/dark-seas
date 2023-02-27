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
import "../libraries/LibTurn.sol";

uint256 constant ID = uint256(keccak256("ds.system.PlayerSpawn"));

contract PlayerSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );

    require(
      LibTurn.getCurrentTurn(components) <= gameConfig.entryCutoffTurns,
      "PlayerSpawnSystem: entry period has ended"
    );
    require(!LibUtils.playerAddrExists(components, msg.sender), "PlayerSpawnSystem: player has already spawned");

    (string memory name, uint256[] memory ships) = abi.decode(arguments, (string, uint256[]));
    require(bytes(name).length > 0, "PlayerSpawnSystem: name is blank");
    require(ships.length > 0, "PlayerSpawnSystem: no ships spawned");

    // create entity for player and name it
    uint256 playerEntity = LibSpawn.createPlayerEntity(components, msg.sender);
    NameComponent(getAddressById(components, NameComponentID)).set(playerEntity, name);

    LibSpawn.spawn(world, components, playerEntity, ships);
  }

  function executeTyped(string calldata name, uint256[] calldata shipPrototypes) public returns (bytes memory) {
    return execute(abi.encode(name, shipPrototypes));
  }

  function getType(ShipPrototype calldata entry) public pure {}
}
