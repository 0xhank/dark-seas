// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
// Components
import { NameComponent, ID as NameComponentID } from "../components/NameComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";

// Types
import { Coord, GameConfig } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";
import "../libraries/LibTurn.sol";

uint256 constant ID = uint256(keccak256("ds.system.JoinGame"));

contract JoinGameSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 gameId, string memory name, uint256[] memory ships) = abi.decode(arguments, (uint256, string, uint256[]));
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );

    require(
      LibTurn.getCurrentTurn(world, gameId) <= gameConfig.entryCutoffTurns,
      "JoinGameSystem: entry period has ended"
    );

    uint256 playerEntity = uint256(keccak256((abi.encode(gameId, msg.sender))));
    require(!LibUtils.playerIdExists(world, playerEntity), "JoinGameSystem: player has already spawned");

    require(
      !PlayerComponent(LibUtils.addressById(world, PlayerComponentID)).has(playerEntity),
      "JoinGameSystem: player has already spawned"
    );

    LibSpawn.createPlayerEntity(world, playerEntity);
    require(bytes(name).length > 0, "JoinGameSystem: name is blank");
    require(ships.length > 0, "JoinGameSystem: no ships spawned");

    // create entity for player and name it
    uint256 ownerEntity = addressToEntity(msg.sender);
    NameComponent(LibUtils.addressById(world, NameComponentID)).set(ownerEntity, name);

    LibSpawn.spawn(world, gameId, playerEntity, ownerEntity, ships);
  }

  function executeTyped(
    uint256 gameId,
    string calldata name,
    uint256[] calldata shipPrototypes
  ) public returns (bytes memory) {
    return execute(abi.encode(gameId, name, shipPrototypes));
  }
}
