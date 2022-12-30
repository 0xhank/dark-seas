// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External
import "../MudTest.t.sol";

// Systems
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "../../systems/ComponentDevSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "../../systems/CommitSystem.sol";

// Components
import { OnFireComponent, ID as OnFireComponentID } from "../../components/OnFireComponent.sol";
import { DamagedMastComponent, ID as DamagedMastComponentID } from "../../components/DamagedMastComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "../../components/SailPositionComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";

// Types
import { Action, ActionType, Coord, Move } from "../../libraries/DSTypes.sol";

// Libraries
import "../../libraries/LibTurn.sol";

contract DamageTest is MudTest {
  SailPositionComponent sailPositionComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;
  ComponentDevSystem componentDevSystem;

  Action[] actions;
  Move[] moves;

  function testFireEffect() public prank(deployer) {
    setup();
    OnFireComponent onFireComponent = OnFireComponent(getAddressById(components, OnFireComponentID));
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));
    uint256 attackerEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);
    uint256 defenderEntity = shipSpawnSystem.executeTyped(Coord({ x: 9, y: 25 }), 0);
    uint32 origHealth = healthComponent.getValue(defenderEntity);

    componentDevSystem.executeTyped(OnFireComponentID, attackerEntity, abi.encode(2));
    assertEq(onFireComponent.getValue(attackerEntity), 2);

    Action memory action = Action({
      shipEntity: attackerEntity,
      actionTypes: [ActionType.ExtinguishFire, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(actions);
    assertTrue(onFireComponent.has(attackerEntity));
    assertEq(onFireComponent.getValue(attackerEntity), 1);

    // delete actions;

    // shipEntities.push(attackerEntity);
    // actions.push(Action.FireRight);
    // allActions.push(actions);

    // uint256 gas = gasleft();
    // actionSystem.executeTyped(shipEntities, allActions);

    // console.log("gas:", gas - gasleft());

    // uint32 newHealth = healthComponent.getValue(defenderEntity);
    // assertEq(newHealth, origHealth);
  }

  function testDamagedMastEffect() public prank(deployer) {
    setup();
    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    DamagedMastComponent damagedMastComponent = DamagedMastComponent(
      getAddressById(components, DamagedMastComponentID)
    );
    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    componentDevSystem.executeTyped(DamagedMastComponentID, shipEntity, abi.encode(2));

    assertTrue(damagedMastComponent.has(shipEntity));

    uint32 health = healthComponent.getValue(shipEntity);

    delete actions;

    Action memory action = Action({
      shipEntity: shipEntity,
      actionTypes: [ActionType.RepairMast, ActionType.None],
      specialEntities: [uint256(0), uint256(0)]
    });
    actions.push(action);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 1, Phase.Action));

    actionSystem.executeTyped(actions);
    assertTrue(damagedMastComponent.has(shipEntity));
    assertEq(healthComponent.getValue(shipEntity), health - 1);
  }

  function testDamagedSailEffect() public prank(deployer) {
    setup();

    PositionComponent positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    RotationComponent rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));

    uint256 moveStraightEntity = uint256(keccak256("ds.prototype.moveEntity1"));

    uint256 shipEntity = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350);

    Coord memory position = positionComponent.getValue(shipEntity);
    uint32 rotation = rotationComponent.getValue(shipEntity);
    componentDevSystem.executeTyped(SailPositionComponentID, shipEntity, abi.encode(0));
    Move memory move = Move({ shipEntity: shipEntity, moveCardEntity: moveStraightEntity });

    moves.push(move);
    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Commit));
    uint256 commitment = uint256(keccak256(abi.encode(moves, 69)));
    CommitSystem(system(CommitSystemID)).executeTyped(commitment);

    vm.warp(LibTurn.getTurnAndPhaseTime(components, 2, Phase.Reveal));
    MoveSystem(system(MoveSystemID)).executeTyped(moves, 69);

    assertCoordEq(positionComponent.getValue(shipEntity), position);
    assertEq(rotationComponent.getValue(shipEntity), rotation);
  }

  /**
   * Helpers
   */

  function setup() internal {
    actionSystem = ActionSystem(system(ActionSystemID));
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    componentDevSystem = ComponentDevSystem(system(ComponentDevSystemID));
    sailPositionComponent = SailPositionComponent(getAddressById(components, SailPositionComponentID));
    delete moves;
    delete actions;
  }
}
