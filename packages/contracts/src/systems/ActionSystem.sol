// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";

// Types
import { Action, Phase } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibAction.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibUtils.sol";

uint256 constant ID = uint256(keccak256("ds.system.Action"));

contract ActionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory entities, Action[][] memory actions) = abi.decode(arguments, (uint256[], Action[][]));

    require(entities.length == actions.length, "ActionSystem: array length mismatch");

    uint256 playerEntity = addressToEntity(msg.sender);

    require(LibUtils.playerIdExists(components, playerEntity), "ActionSystem: player does not exist");

    LastActionComponent lastActionComponent = LastActionComponent(getAddressById(components, LastActionComponentID));
    require(LibTurn.getCurrentPhase(components) == Phase.Action, "ActionSystem: incorrect turn phase");

    uint32 currentTurn = LibTurn.getCurrentTurn(components);
    require(
      lastActionComponent.getValue(addressToEntity(msg.sender)) < currentTurn,
      "ActionSystem: already acted this turn"
    );
    lastActionComponent.set(playerEntity, currentTurn);

    // iterate through each ship
    for (uint256 i = 0; i < entities.length; i++) {
      LibAction.executeShipActions(components, entities[i], actions[i]);
    }
  }

  function executeTyped(uint256[] calldata shipEntity, Action[][] calldata actions) public returns (bytes memory) {
    return execute(abi.encode(shipEntity, actions));
  }
}
