// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { getAddressById, getSystemAddressById } from "solecs/utils.sol";

// Components
import { ShipComponent, ID as ShipComponentID } from "../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../components/SailPositionComponent.sol";

uint256 constant ID = uint256(keccak256("ds.system.ChangeSail"));

/*
  There are four possible states of a sail:
    0: Broken
    1: Closed
    2: Battle
    3: Full
  You can only cycle between 1, 2, and 3. Sails only break when someone attacks you. Fin.
*/

contract ChangeSailSystem is System {
  constructor(IWorld _world, address _components) System(_world, _components) {}

  function execute(bytes memory arguments) public returns (bytes memory) {
    (uint256 entity, uint32 newSailPosition) = abi.decode(arguments, (uint256, uint32));

    SailPositionComponent sailPositionComponent = SailPositionComponent(
      getAddressById(components, SailPositionComponentID)
    );

    require(newSailPosition > 0 && newSailPosition < 4, "ChangeSailSystem: invalid sail position");

    require(
      ShipComponent(getAddressById(components, ShipComponentID)).has(entity),
      "ChangeSailSystem: Entity must be a ship"
    );

    uint32 currentSailPosition = sailPositionComponent.getValue(entity);

    require(
      1 ==
        (
          currentSailPosition > newSailPosition
            ? currentSailPosition - newSailPosition
            : newSailPosition - currentSailPosition
        ),
      "ChangeSailSystem: sails can only change one level at a time"
    );

    sailPositionComponent.set(entity, newSailPosition);
  }

  function executeTyped(uint256 entity, uint32 newSailPosition) public returns (bytes memory) {
    return execute(abi.encode(entity, newSailPosition));
  }
}
