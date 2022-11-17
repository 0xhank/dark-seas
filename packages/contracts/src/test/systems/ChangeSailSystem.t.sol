// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { Coord } from "../../components/PositionComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "../../components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
// Systems
import { ChangeSailSystem, ID as ChangeSailSystemID } from "../../systems/ChangeSailSystem.sol";
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";

// Internal
import "../../libraries/LibPolygon.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";

contract ChangeSailSystemTest is MudTest {
  uint256 entityId;
  SailPositionComponent sailPositionComponent;
  ChangeSailSystem changeSailSystem;
  ShipSpawnSystem shipSpawnSystem;

  function testExecute() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    changeSailSystem.executeTyped(shipEntityId, 2);

    uint32 newSailPosition = sailPositionComponent.getValue(shipEntityId);

    assertEq(newSailPosition, 2);
  }

  function testReversions() public prank(deployer) {
    setup();
    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 startingRotation = 45;
    uint256 shipEntityId = shipSpawnSystem.executeTyped(startingPosition, startingRotation, 5, 50);

    vm.expectRevert(abi.encodePacked("ChangeSailSystem: invalid sail position"));
    changeSailSystem.executeTyped(shipEntityId, 4);

    vm.expectRevert(abi.encodePacked("ChangeSailSystem: invalid sail position"));
    changeSailSystem.executeTyped(shipEntityId, 0);

    vm.expectRevert(abi.encodePacked("ChangeSailSystem: sails can only change one level at a time"));
    changeSailSystem.executeTyped(shipEntityId, 1);
  }

  /**
   * Helpers
   */

  function setup() internal {
    changeSailSystem = ChangeSailSystem(system(ChangeSailSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));

    entityId = addressToEntity(deployer);
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
  }
}
