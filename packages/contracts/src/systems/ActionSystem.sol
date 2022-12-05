// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById, addressToEntity } from "solecs/utils.sol";

// Components
import { PositionComponent, ID as PositionComponentID } from "../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../components/HealthComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

import { Coord, Action, Phase } from "../libraries/DSTypes.sol";

import "../libraries/LibAction.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";

uint256 constant ID = uint256(keccak256("ds.system.Action"));

contract ActionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256[] memory entities, Action[][] memory actions) = abi.decode(arguments, (uint256[], Action[][]));

    require(entities.length == actions.length, "ActionSystem: array length mismatch");

    uint256 playerEntity = addressToEntity(msg.sender);

    require(LibSpawn.playerIdExists(components, playerEntity), "ActionSystem: player does not exist");

    LastActionComponent lastActionComponent = LastActionComponent(getAddressById(components, LastActionComponentID));
    require(LibTurn.getCurrentPhase(components) == Phase.Action, "ActionSystem: incorrect turn phase");

    uint32 currentTurn = LibTurn.getCurrentTurn(components);
    require(
      lastActionComponent.getValue(addressToEntity(msg.sender)) < currentTurn,
      "ActionSystem: already acted this turn"
    );
    lastActionComponent.set(playerEntity, currentTurn);

    for (uint256 i = 0; i < entities.length; i++) {
      Action[] memory shipActions = actions[i];
      uint256 shipEntity = entities[i];

      require(shipActions.length <= 3, "ActionSystem: too many actions");

      require(
        OwnedByComponent(getAddressById(components, OwnedByComponentID)).getValue(shipEntity) ==
          addressToEntity(msg.sender),
        "ActionSystem: you don't own this ship"
      );

      require(
        ShipComponent(getAddressById(components, ShipComponentID)).has(shipEntity),
        "ActionSystem: Entity must be a ship"
      );

      for (uint256 j = 0; j < shipActions.length; j++) {
        Action action = shipActions[j];

        if (j == 1) {
          require(shipActions[0] != action, "ActionSystem: action already used");
        } else if (j == 2) {
          require(shipActions[0] != action && shipActions[1] != action, "ActionSystem: action already used");
        }

        if (action == Action.FireRight) {
          LibAction.attack(components, shipEntity, Side.Right);
        } else if (action == Action.FireLeft) {
          LibAction.attack(components, shipEntity, Side.Left);
        } else if (action == Action.RaiseSail) {
          LibAction.raiseSail(components, shipEntity);
        } else if (action == Action.LowerSail) {
          LibAction.lowerSail(components, shipEntity);
        } else if (action == Action.ExtinguishFire) {
          LibAction.extinguishFire(components, shipEntity);
        } else if (action == Action.RepairLeak) {
          LibAction.repairLeak(components, shipEntity);
        } else if (action == Action.RepairMast) {
          LibAction.repairMast(components, shipEntity);
        } else if (action == Action.RepairSail) {
          LibAction.repairSail(components, shipEntity);
        } else {
          revert("ActionSystem: invalid action");
        }
      }

      // todo: apply damage to all ships every turn instead of only if they act
      LibAction.applyDamage(components, shipEntity);
    }
  }

  function executeTyped(uint256[] calldata shipEntity, Action[][] calldata actions) public returns (bytes memory) {
    return execute(abi.encode(shipEntity, actions));
  }
}
