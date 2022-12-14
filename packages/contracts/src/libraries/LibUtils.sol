// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { World, WorldQueryFragment } from "solecs/World.sol";
import { QueryFragment, QueryType, LibQuery } from "solecs/LibQuery.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { getAddressById } from "solecs/utils.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { PositionComponent, ID as PositionComponentID, Coord } from "../components/PositionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

library LibUtils {
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
}
