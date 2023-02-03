// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { getAddressById } from "solecs/utils.sol";
// Components
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";

// Types
import { Coord, GameConfig, GodID } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibUtils.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.Respawn"));

contract RespawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    GameConfig memory gameConfig = GameConfigComponent(getAddressById(components, GameConfigComponentID)).getValue(
      GodID
    );
    require(block.timestamp < gameConfig.startTime + gameConfig.entryCutoff, "RespawnSystem: entry period has ended");
    require(LibUtils.playerAddrExists(components, msg.sender), "RespawnSystem: player has not already spawned");

    require(gameConfig.respawnAllowed, "RespawnSystem: respawn not activated");

    uint256 playerEntity = addressToEntity(msg.sender);
    uint256[] memory shipEntities = abi.decode(arguments, (uint256[]));
    require(shipEntities.length > 0, "RespawnSystem: no ships to respawn");

    Coord memory position = LibSpawn.getRandomLocation(components, LibUtils.randomness(playerEntity, shipEntities[0]));
    uint32 rotation = LibSpawn.pointKindaTowardsTheCenter(position);

    for (uint256 i = 0; i < shipEntities.length; i++) {
      require(
        OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(shipEntities[i]) == playerEntity,
        "RespawnSystem: you don't own this ship"
      );
      require(
        HealthComponent(getAddressById(components, HealthComponentID)).getValue(shipEntities[i]) == 0,
        "RespawnSystem: ship is not ded"
      );

      position = Coord(position.x + 20, position.y);
      LibSpawn.respawnShip(components, shipEntities[i], position, rotation, gameConfig.buyin);
    }
  }

  function executeTyped(uint256[] calldata shipEntities) public returns (bytes memory) {
    return execute(abi.encode(shipEntities));
  }
}
