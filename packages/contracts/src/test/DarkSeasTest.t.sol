// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;

import "std-contracts/test/MudTest.t.sol";

import { getAddressById, addressToEntity } from "solecs/utils.sol";
import { Coord } from "std-contracts/components/CoordComponent.sol";
import { Deploy } from "./Deploy.sol";

// Components
import { LastActionComponent, ID as LastActionComponentID } from "../components/LastActionComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "../components/LastMoveComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "../components/GameConfigComponent.sol";
import { CurrentGameComponent, ID as CurrentGameComponentID } from "../components/CurrentGameComponent.sol";
import { CreateGameSystem, ID as CreateGameSystemID } from "../systems/CreateGameSystem.sol";

import "../libraries/LibTurn.sol";
import "../libraries/LibSpawn.sol";
import "../libraries/LibUtils.sol";

import { CannonPrototype, ShipPrototype } from "../libraries/DSTypes.sol";

contract DarkSeasTest is MudTest {
  constructor(IDeploy deploy) MudTest(deploy) {}

  GameConfig baseGameConfig =
    GameConfig({
      startTime: block.timestamp,
      commitPhaseLength: 24,
      revealPhaseLength: 9,
      actionPhaseLength: 25,
      worldSize: 100,
      perlinSeed: 69,
      entryCutoffTurns: 3,
      buyin: 0,
      shrinkRate: 400,
      budget: 10,
      islandThreshold: 33
    });
  bytes none = abi.encode(0);
  modifier prank(address prankster) {
    vm.startPrank(prankster);
    _;
    vm.stopPrank();
  }

  function spawnBattleship(
    IWorld world,
    uint256 gameId,
    uint256 playerEntity,
    Coord memory position,
    uint32 rotation
  ) private returns (uint256 shipEntity) {
    shipEntity = world.getUniqueEntityId();
    ShipComponent(LibUtils.addressById(world, ShipComponentID)).set(shipEntity);

    uint32 maxHealth = 10;
    PositionComponent(LibUtils.addressById(world, PositionComponentID)).set(shipEntity, position);
    RotationComponent(LibUtils.addressById(world, RotationComponentID)).set(shipEntity, rotation);
    LengthComponent(LibUtils.addressById(world, LengthComponentID)).set(shipEntity, 10);
    HealthComponent(LibUtils.addressById(world, HealthComponentID)).set(shipEntity, maxHealth);
    MaxHealthComponent(LibUtils.addressById(world, MaxHealthComponentID)).set(shipEntity, maxHealth);
    SailPositionComponent(LibUtils.addressById(world, SailPositionComponentID)).set(shipEntity, 2);
    OwnedByComponent(LibUtils.addressById(world, OwnedByComponentID)).set(shipEntity, playerEntity);
    SpeedComponent(LibUtils.addressById(world, SpeedComponentID)).set(shipEntity, 10);
    LastHitComponent(LibUtils.addressById(world, LastHitComponentID)).set(shipEntity, GodID);
    FirepowerComponent(LibUtils.addressById(world, FirepowerComponentID)).set(shipEntity, 0);
    CurrentGameComponent(LibUtils.addressById(world, CurrentGameComponentID)).set(shipEntity, gameId);
    LibSpawn.spawnCannon(world, shipEntity, 90, 8, 100);
    LibSpawn.spawnCannon(world, shipEntity, 270, 8, 100);
    LibSpawn.spawnCannon(world, shipEntity, 0, 8, 100);
  }

  function spawnShip(
    uint256 gameId,
    Coord memory position,
    uint32 rotation,
    address spawner
  ) internal returns (uint256 shipEntity) {
    uint256 playerEntity = addressToEntity(spawner);

    if (!LibUtils.playerIdExists(world, playerEntity)) LibSpawn.createPlayerEntity(world, spawner);

    shipEntity = spawnBattleship(world, gameId, playerEntity, position, rotation);

    LastActionComponent(LibUtils.addressById(world, LastActionComponentID)).set(playerEntity, 0);
    LastMoveComponent(LibUtils.addressById(world, LastMoveComponentID)).set(playerEntity, 0);
  }

  function createShipPrototype(uint32 price) internal returns (uint256) {
    ShipPrototypeComponent shipPrototypeComponent = ShipPrototypeComponent(
      LibUtils.addressById(world, ShipPrototypeComponentID)
    );

    CannonPrototype[] memory cannon4 = new CannonPrototype[](4);
    cannon4[0] = CannonPrototype({ rotation: 90, firepower: 12, range: 60 });
    cannon4[1] = CannonPrototype({ rotation: 270, firepower: 12, range: 60 });
    cannon4[2] = CannonPrototype({ rotation: 345, firepower: 10, range: 50 });
    cannon4[3] = CannonPrototype({ rotation: 15, firepower: 10, range: 50 });
    ShipPrototype memory shipPrototype = ShipPrototype({
      price: price,
      length: 13,
      maxHealth: 10,
      speed: 9,
      cannons: cannon4,
      name: "Johnson"
    });

    bytes memory packedShipPrototype = abi.encode(shipPrototype);
    uint256 shipEntity = uint256(keccak256(packedShipPrototype));
    if (shipPrototypeComponent.has(shipEntity)) return shipEntity;
    ShipPrototypeComponent(LibUtils.addressById(world, ShipPrototypeComponentID)).set(
      shipEntity,
      string(packedShipPrototype)
    );
    return shipEntity;
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

  function logCoord(string memory name, Coord memory coord) internal view {
    console.log(name);
    console.log("x:");
    console.logInt(coord.x);
    console.log("y:");
    console.logInt(coord.y);
  }

  function logCoord(Coord memory coord) internal view {
    console.log("x:");
    console.logInt(coord.x);
    console.log("y:");
    console.logInt(coord.y);
  }

  function assertApproxEqAbs(uint256 a, uint256 b, uint256 maxDelta) internal {
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

  function assertApproxEqAbs(uint256 a, uint256 b, uint256 maxDelta, string memory err) internal {
    uint256 delta = a > b ? a - b : b - a;

    if (delta > maxDelta) {
      emit log_named_string("Error", err);
      assertApproxEqAbs(a, b, maxDelta);
    }
  }

  function assertApproxEqAbs(int256 a, int256 b, uint256 maxDelta) internal {
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

  function assertApproxEqAbs(int256 a, int256 b, uint256 maxDelta, string memory err) internal {
    uint256 delta = uint256(a > b ? a - b : b - a);

    if (delta > maxDelta) {
      emit log_named_string("Error", err);
      assertApproxEqAbs(a, b, maxDelta);
    }
  }

  function getTurnAndPhaseTime(IWorld world, uint256 gameId, uint32 turn, Phase phase) internal view returns (uint256) {
    GameConfig memory gameConfig = GameConfigComponent(LibUtils.addressById(world, GameConfigComponentID)).getValue(
      gameId
    );
    uint32 turnLength = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength;
    uint256 startOffset = gameConfig.startTime;

    uint32 phaseOffset = 0;
    if (phase == Phase.Reveal) phaseOffset = gameConfig.commitPhaseLength;
    else if (phase == Phase.Action) phaseOffset = gameConfig.commitPhaseLength + gameConfig.revealPhaseLength;

    uint32 turnOffset = turn * turnLength;

    return startOffset + phaseOffset + turnOffset;
  }
}
