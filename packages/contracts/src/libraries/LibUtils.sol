// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";

// Components
import { PlayerComponent, ID as PlayerComponentID } from "../components/PlayerComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

library LibUtils {
  function getSenderOwner(IUint256Component components) internal view returns (uint256) {
    OwnedByComponent ownedByComponent = OwnedByComponent(getAddressById(components, OwnedByComponentID));
    uint256 controllerEntity = addressToEntity(msg.sender);
    require(ownedByComponent.has(controllerEntity), "player not owned by anyone");
    return ownedByComponent.getValue(controllerEntity);
  }

  /**
   * @notice  retrieves an entity with a given component
   * @param   components   holds all components in the world
   * @param   componentID  the id of the query component
   * @return  entity the entityId of the entity that matches the query
   * @return  found whether the query is successful
   */
  function getEntityWith(IUint256Component components, uint256 componentID)
    internal
    view
    returns (uint256[] memory entity, bool found)
  {
    QueryFragment[] memory fragments = new QueryFragment[](1);

    fragments[0] = QueryFragment(QueryType.Has, IComponent(getAddressById(components, componentID)), new bytes(0));
    uint256[] memory entities = LibQuery.query(fragments);
    if (entities.length == 0) {
      return (entity, false);
    }
    return (entities, true);
  }

  /**
   * @notice  masks a bit string based on length and shift
   * @param   _b  bit string to mask
   * @param   length  length in bits of return bit string
   * @param   shift  starting location of mask
   * @return  _byteUInt masked bit string
   */
  function getByteUInt(
    uint256 _b,
    uint256 length,
    uint256 shift
  ) public pure returns (uint256 _byteUInt) {
    uint256 mask = ((1 << length) - 1) << shift;
    _byteUInt = (_b & mask) >> shift;
  }

  /**
   * @notice simple rng calculation
   * @dev     complexity needs to be increased in prod
   * @param   r1  first source of randomness
   * @param   r2  second source of randomness
   * @return  r  random value
   */
  function randomness(uint256 r1, uint256 r2) public view returns (uint256 r) {
    r = uint256(
      keccak256(abi.encodePacked(r1, r2, block.timestamp, blockhash(block.number - 1), block.difficulty, block.number))
    );
  }

  /**
   * @notice  checks if a player with this id exists
   * @param   components  world components
   * @param   playerEntity  player's entity Id
   * @return  bool  does player with this Id exist?
   */
  function playerIdExists(IUint256Component components, uint256 playerEntity) internal view returns (bool) {
    PlayerComponent playerComponent = PlayerComponent(getAddressById(components, PlayerComponentID));
    return playerComponent.has(playerEntity);
  }

  /**
   * @notice  checks if player with this address exists
   * @param   components  world components
   * @param   playerAddress  player's address
   * @return  bool  does player with this address exist?
   */
  function playerAddrExists(IUint256Component components, address playerAddress) internal view returns (bool) {
    PlayerComponent playerComponent = PlayerComponent(getAddressById(components, PlayerComponentID));
    return playerComponent.has(addressToEntity(playerAddress));
  }

  /**
   * @notice  get all existing players
   * @param   components  world components
   * @return  uint256[]  all existing players
   */
  function getExistingPlayers(IUint256Component components) internal view returns (uint256[] memory) {
    QueryFragment[] memory fragments = new QueryFragment[](1);
    fragments[0] = QueryFragment(
      QueryType.Has,
      PlayerComponent(getAddressById(components, PlayerComponentID)),
      new bytes(0)
    );

    return LibQuery.query(fragments);
  }
}
