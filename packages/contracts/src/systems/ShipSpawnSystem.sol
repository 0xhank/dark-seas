// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";

// Libraries
import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.ShipSpawn"));

// NOTE: this contract is only used for testing and must be removed from deploy.json in prod
contract ShipSpawnSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (Coord memory location, uint32 rotation) = abi.decode(arguments, (Coord, uint32));

    uint256 playerEntity = addressToEntity(msg.sender);

    if (!LibUtils.playerIdExists(components, playerEntity)) LibSpawn.createPlayerEntity(components, msg.sender);
    uint256 shipEntity = LibSpawn.spawnShip(components, world, playerEntity, location, rotation);

    LastActionComponent(getAddressById(components, LastActionComponentID)).set(addressToEntity(msg.sender), 0);
    LastMoveComponent(getAddressById(components, LastMoveComponentID)).set(addressToEntity(msg.sender), 0);

    return abi.encode(shipEntity);
  }

  function executeTyped(Coord memory location, uint32 rotation) public returns (uint256) {
    return abi.decode(execute(abi.encode(location, rotation)), (uint256));
  }
}
