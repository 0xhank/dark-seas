// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "std-contracts/test/MudTest.t.sol";

import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { Coord } from "std-contracts/components/CoordComponent.sol";
import { Deploy } from "./Deploy.sol";

// Components
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "../components/OwnedByComponent.sol";

import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";
import "../libraries/LibUtils.sol";

contract DarkSeasTest is MudTest {
  constructor(IDeploy deploy) MudTest(deploy) {}

  modifier prank(address prankster) {
    vm.startPrank(prankster);
    _;
    vm.stopPrank();
  }

  function spawnBattleship(
    IUint256Component components,
    IWorld world,
    uint256 playerEntity,
    Coord memory location,
    uint32 rotation
  ) private returns (uint256 shipEntity) {
    shipEntity = world.getUniqueEntityId();
    ShipComponent(getAddressById(components, ShipComponentID)).set(shipEntity);

    uint32 maxHealth = 10;
    PositionComponent(getAddressById(components, PositionComponentID)).set(shipEntity, location);
    RotationComponent(getAddressById(components, RotationComponentID)).set(shipEntity, rotation);
    LengthComponent(getAddressById(components, LengthComponentID)).set(shipEntity, 10);
    HealthComponent(getAddressById(components, HealthComponentID)).set(shipEntity, maxHealth);
    MaxHealthComponent(getAddressById(components, MaxHealthComponentID)).set(shipEntity, maxHealth);
    SailPositionComponent(getAddressById(components, SailPositionComponentID)).set(shipEntity, 2);
    OwnedByComponent(getAddressById(components, OwnedByComponentID)).set(shipEntity, playerEntity);
    SpeedComponent(getAddressById(components, SpeedComponentID)).set(shipEntity, 110);
    KillsComponent(getAddressById(components, KillsComponentID)).set(shipEntity, 0);
    BootyComponent(getAddressById(components, BootyComponentID)).set(shipEntity, 500);
    LastHitComponent(getAddressById(components, LastHitComponentID)).set(shipEntity, GodID);
    LibSpawn.spawnCannon(components, world, shipEntity, 90, 40, 100);
    LibSpawn.spawnCannon(components, world, shipEntity, 270, 40, 100);
    LibSpawn.spawnCannon(components, world, shipEntity, 0, 40, 100);
  }

  function spawnShip(
    Coord memory position,
    uint32 rotation,
    address spawner
  ) internal returns (uint256 shipEntity) {
    uint256 playerEntity = addressToEntity(spawner);

    if (!LibUtils.playerIdExists(components, playerEntity)) LibSpawn.createPlayerEntity(components, spawner);

    shipEntity = spawnBattleship(components, world, playerEntity, position, rotation);

    LastActionComponent(getAddressById(components, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(getAddressById(components, LastMoveComponentID)).set(playerEntity, 0);
  }

  function assertCoordEq(Coord memory a, Coord memory b) internal {
    assertEq(a.x, b.x, "different x value");
    assertEq(a.y, b.y, "different y value");
  }

  function assertCoordNotEq(Coord memory a, Coord memory b) internal {
    assertTrue(a.x != b.x || a.y != b.y);
  }

  function assertFalse(bool falseAssertion, string memory err) internal {
    assertTrue(!falseAssertion, err);
  }

  function assertFalse(bool falseAssertion) internal {
    assertTrue(!falseAssertion);
  }

  function logCoord(string memory name, Coord memory coord) internal {
    console.log(name);
    console.log("x:");
    console.logInt(coord.x);
    console.log("y:");
    console.logInt(coord.y);
  }

  function logCoord(Coord memory coord) internal {
    console.log("x:");
    console.logInt(coord.x);
    console.log("y:");
    console.logInt(coord.y);
  }

  function assertApproxEqAbs(
    uint256 a,
    uint256 b,
    uint256 maxDelta
  ) internal {
    uint256 delta = a > b ? a - b : b - a;

    if (delta > maxDelta) {
      emit log("Error: a ~= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max Delta", maxDelta);
      emit log_named_uint("     Delta", delta);
      fail();
    }
  }

  function assertApproxEqAbs(
    uint256 a,
    uint256 b,
    uint256 maxDelta,
    string memory err
  ) internal {
    uint256 delta = a > b ? a - b : b - a;

    if (delta > maxDelta) {
      emit log_named_string("Error", err);
      assertApproxEqAbs(a, b, maxDelta);
    }
  }

  function assertApproxEqAbs(
    int256 a,
    int256 b,
    uint256 maxDelta
  ) internal {
    uint256 delta = uint256(a > b ? a - b : b - a);

    if (delta > maxDelta) {
      emit log("Error: a ~= b not satisfied [int]");
      emit log_named_int("  Expected", b);
      emit log_named_int("    Actual", a);
      emit log_named_uint(" Max Delta", maxDelta);
      emit log_named_uint("     Delta", delta);
      fail();
    }
  }

  function assertApproxEqAbs(
    int256 a,
    int256 b,
    uint256 maxDelta,
    string memory err
  ) internal {
    uint256 delta = uint256(a > b ? a - b : b - a);

    if (delta > maxDelta) {
      emit log_named_string("Error", err);
      assertApproxEqAbs(a, b, maxDelta);
    }
  }
}
