// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { addressToEntity } from "solecs/utils.sol";
// Components
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";

// Types
import { Action, Phase } from "../libraries/DSTypes.sol";

// Libraries
import "../libraries/LibAction.sol";
import "../libraries/LibTurn.sol";
import "../libraries/LibUtils.sol";
import "../libraries/LibCombat.sol";
import "../libraries/LibCrate.sol";

uint256 constant ID = uint256(keccak256("ds.system.Action"));

contract ActionSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    Action[] memory actions = abi.decode(arguments, (Action[]));

    uint256 playerEntity = addressToEntity(msg.sender);

    require(LibUtils.playerIdExists(world, playerEntity), "ActionSystem: player does not exist");

    LastActionComponent lastActionComponent = LastActionComponent(LibUtils.addressById(world, LastActionComponentID));
    require(LibTurn.getCurrentPhase(world) == Phase.Action, "ActionSystem: incorrect turn phase");

    uint32 currentTurn = LibTurn.getCurrentTurn(world);
    require(
      lastActionComponent.getValue(addressToEntity(msg.sender)) < currentTurn,
      "ActionSystem: already acted this turn"
    );
    lastActionComponent.set(playerEntity, currentTurn);
    // iterate through each ship
    for (uint256 i = 0; i < actions.length; i++) {
      LibAction.executeActions(world, actions[i]);
    }
  }

  function executeTyped(Action[] calldata actions) public returns (bytes memory) {
    return execute(abi.encode(actions));
  }

  function load(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "load: can only be called by ActionSystem");
    uint256 cannonEntity = abi.decode(metadata, (uint256));
    LibCombat.load(world, shipEntity, cannonEntity);
  }

  function fire(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "fire: can only be called by ActionSystem");
    (uint256 cannonEntity, uint256[] memory targetEntities) = abi.decode(metadata, (uint256, uint256[]));
    LibCombat.attack(world, shipEntity, cannonEntity, targetEntities);
  }

  function raiseSail(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "raiseSail: can only be called by ActionSystem");
    LibAction.raiseSail(world, shipEntity);
  }

  function lowerSail(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "lowerSail: can only be called by ActionSystem");
    LibAction.lowerSail(world, shipEntity);
  }

  function repairSail(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "repairSail: can only be called by ActionSystem");
    LibAction.repairSail(world, shipEntity);
  }

  function extinguishFire(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "extinguishFire: can only be called by ActionSystem");
    LibAction.extinguishFire(world, shipEntity);
  }

  function repairCannons(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "repairCannons: can only be called by ActionSystem");
    LibAction.repairCannons(world, shipEntity);
  }

  function claimCrate(uint256 shipEntity, bytes memory metadata) public {
    require(msg.sender == address(this), "repairCannons: can only be called by ActionSystem");
    uint256 crateEntity = abi.decode(metadata, (uint256));
    LibCrate.claimCrate(world, shipEntity, crateEntity);
  }
}
