// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { ActionComponent, ID as ActionComponentID, FunctionSelector } from "../components/ActionComponent.sol";

// Types
import { Action, Phase } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibAction.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibUtils.sol";
import "../libraries/LibCombat.sol";

uint256 constant ID = uint256(keccak256("ds.system.Action"));

contract ActionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    Action[] memory actions = abi.decode(arguments, (Action[]));

    uint256 playerEntity = addressToEntity(msg.sender);

    require(LibUtils.playerIdExists(components, playerEntity), "ActionSystem: player does not exist");

    LastActionComponent lastActionComponent = LastActionComponent(getAddressById(components, LastActionComponentID));
    ActionComponent actionComponent = ActionComponent(getAddressById(components, ActionComponentID));
    require(LibTurn.getCurrentPhase(components) == Phase.Action, "ActionSystem: incorrect turn phase");

    uint32 currentTurn = LibTurn.getCurrentTurn(components);
    require(
      lastActionComponent.getValue(addressToEntity(msg.sender)) < currentTurn,
      "ActionSystem: already acted this turn"
    );
    lastActionComponent.set(playerEntity, currentTurn);
    // iterate through each ship
    for (uint256 i = 0; i < actions.length; i++) {
      for (uint256 j = 0; j < i; j++) {
        require(actions[i].shipEntity != actions[j].shipEntity, "ActionSystem: duplicated ships");
      }
      for (uint256 k = 0; k < 2; k++) {
        uint256 actionEntity = actions[i].actionEntities[k];
        bytes memory metadata = actions[i].metadata[k];
        console.log("action entity:", actionEntity);
        if (actionEntity == 0) continue;
        FunctionSelector memory functionSelector = actionComponent.getValue(actionEntity);

        (bool success, bytes memory content) = functionSelector.contr.call(
          bytes.concat(functionSelector.func, abi.encode(actions[i].shipEntity, metadata))
        );
        require(success, "action failed");
      }
    }
  }

  function executeTyped(Action[] calldata actions) public returns (bytes memory) {
    return execute(abi.encode(actions));
  }

  function load(uint256 shipEntity, bytes memory metadata) public {
    uint256 cannonEntity = abi.decode(metadata, (uint256));
    LibCombat.load(components, shipEntity, cannonEntity);
  }

  function fire(uint256 shipEntity, bytes memory metadata) public {
    (uint256 cannonEntity, uint256[] memory targetEntities) = abi.decode(metadata, (uint256, uint256[]));
    LibCombat.attack(components, shipEntity, cannonEntity, targetEntities);
  }

  function raiseSail(uint256 shipEntity, bytes memory metadata) public {
    LibAction.raiseSail(components, shipEntity);
  }

  function lowerSail(uint256 shipEntity, bytes memory metadata) public {
    LibAction.lowerSail(components, shipEntity);
  }

  function repairSail(uint256 shipEntity, bytes memory metadata) public {
    LibAction.repairSail(components, shipEntity);
  }

  function extinguishFire(uint256 shipEntity, bytes memory metadata) public {
    LibAction.extinguishFire(components, shipEntity);
  }

  function repairCannons(uint256 shipEntity, bytes memory metadata) public {
    LibAction.repairCannons(components, shipEntity);
  }
}
