// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

// External

// Components
import { PositionComponent, ID as PositionComponentID } from "../../components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "../../components/RotationComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "../../components/HealthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "../../components/RangeComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "../../components/FirepowerComponent.sol";

// Systems
import { ShipSpawnSystem, ID as ShipSpawnSystemID } from "../../systems/ShipSpawnSystem.sol";
import { MoveSystem, ID as MoveSystemID } from "../../systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "../../systems/ActionSystem.sol";
// Internal
import "../../libraries/LibVector.sol";
import "../../libraries/LibCombat.sol";
import "../MudTest.t.sol";
import { addressToEntity } from "solecs/utils.sol";
import { Side, Coord, Action } from "../../libraries/DSTypes.sol";

contract AttackActionTest is MudTest {
  uint256 entityId;
  PositionComponent positionComponent;
  RotationComponent rotationComponent;
  ActionSystem actionSystem;
  ShipSpawnSystem shipSpawnSystem;

  uint256[] shipEntities = new uint256[](0);
  uint256[] moveEntities = new uint256[](0);
  Action[] actions = new Action[](0);

  function testAttackAction() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint32 rotation = 0;
    uint256 attackerId = shipSpawnSystem.executeTyped(startingPosition, 350, 50, 50);

    startingPosition = Coord({ x: -25, y: -25 });
    uint256 defender2Id = shipSpawnSystem.executeTyped(startingPosition, rotation, 50, 50);

    startingPosition = Coord({ x: 25, y: 25 });
    uint256 defenderId = shipSpawnSystem.executeTyped(startingPosition, rotation, 50, 50);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 orig2Health = healthComponent.getValue(defender2Id);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    actions.push(Action.FireRight);
    actionSystem.executeTyped(actions, attackerId);

    uint32 newHealth = healthComponent.getValue(defenderId);

    assertGe(newHealth, origHealth - 1);

    newHealth = healthComponent.getValue(defender2Id);
    assertEq(newHealth, orig2Health);

    newHealth = healthComponent.getValue(attackerId);
    assertEq(newHealth, attackerHealth);
  }

  function testCombatAfterMove() public prank(deployer) {
    setup();
    HealthComponent healthComponent = HealthComponent(component(HealthComponentID));
    MoveSystem moveSystem = MoveSystem(system(MoveSystemID));

    Coord memory startingPosition = Coord({ x: 0, y: 0 });
    uint256 attackerId = shipSpawnSystem.executeTyped(startingPosition, 0, 10, 30);

    uint256 moveStraightEntityId = uint256(keccak256("ds.prototype.moveEntity1"));

    shipEntities.push(attackerId);
    moveEntities.push(moveStraightEntityId);
    moveSystem.executeTyped(shipEntities, moveEntities);

    uint256 defenderId = shipSpawnSystem.executeTyped(startingPosition, 0, 10, 30);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    delete actions;
    actions.push(Action.FireRight);
    actionSystem.executeTyped(actions, attackerId);

    uint32 newHealth = healthComponent.getValue(attackerId);
    assertEq(newHealth, attackerHealth);

    newHealth = healthComponent.getValue(defenderId);
    assertEq(newHealth, origHealth);
  }

  function testCombatPrecise() public prank(deployer) {
    setup();

    HealthComponent healthComponent = HealthComponent(getAddressById(components, HealthComponentID));

    uint256 attackerId = shipSpawnSystem.executeTyped(Coord({ x: 0, y: 0 }), 350, 50, 50);
    uint256 defenderId = shipSpawnSystem.executeTyped(Coord({ x: 25, y: 25 }), 0, 50, 50);

    uint32 origHealth = healthComponent.getValue(defenderId);
    uint32 attackerHealth = healthComponent.getValue(attackerId);

    delete actions;
    actions.push(Action.FireRight);
    actionSystem.executeTyped(actions, attackerId);

    uint32 newHealth = healthComponent.getValue(defenderId);

    uint32 ehd = expectedHealthDecrease(attackerId, defenderId, Side.Right);
    console.log("expected health decrease:", ehd);
    assertEq(newHealth, origHealth - ehd);
  }

  /**
   * Helpers
   */

  function setup() internal {
    shipSpawnSystem = ShipSpawnSystem(system(ShipSpawnSystemID));
    actionSystem = ActionSystem(system(ActionSystemID));
    entityId = addressToEntity(deployer);
    positionComponent = PositionComponent(getAddressById(components, PositionComponentID));
    rotationComponent = RotationComponent(getAddressById(components, RotationComponentID));
  }

  function expectedHealthDecrease(
    uint256 attackerId,
    uint256 defenderId,
    Side side
  ) public returns (uint32) {
    uint32 firepower = FirepowerComponent(getAddressById(components, FirepowerComponentID)).getValue(attackerId);
    Coord memory attackerPosition = positionComponent.getValue(attackerId);
    (Coord memory aft, Coord memory stern) = LibVector.getShipBowAndSternLocation(components, defenderId);
    Coord[4] memory firingRange = LibCombat.getFiringArea(components, attackerId, side);

    uint256 distance;
    if (LibVector.withinPolygon(firingRange, aft)) {
      distance = LibVector.distance(attackerPosition, aft);
    } else {
      distance = LibVector.distance(attackerPosition, stern);
    }
    return
      LibCombat.getHullDamage(
        LibCombat.getBaseHitChance(distance, firepower),
        LibCombat.randomness(attackerId, defenderId)
      );
  }
}