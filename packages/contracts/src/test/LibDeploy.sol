// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

// NOTE: This file is autogenerated via `mud codegen-libdeploy` from `deploy.json`. Do not edit manually.

// Foundry
import { console } from "forge-std/console.sol";

// Solecs
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { World } from "solecs/World.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById } from "solecs/utils.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { ISystem } from "solecs/interfaces/ISystem.sol";
import { SystemStorage } from "solecs/SystemStorage.sol";

// Components (requires 'components=...' remapping in project's remappings.txt)
import { PositionComponent, ID as PositionComponentID } from "components/PositionComponent.sol";
import { RotationComponent, ID as RotationComponentID } from "components/RotationComponent.sol";
import { MoveCardComponent, ID as MoveCardComponentID } from "components/MoveCardComponent.sol";
import { LengthComponent, ID as LengthComponentID } from "components/LengthComponent.sol";
import { RangeComponent, ID as RangeComponentID } from "components/RangeComponent.sol";
import { HealthComponent, ID as HealthComponentID } from "components/HealthComponent.sol";
import { MaxHealthComponent, ID as MaxHealthComponentID } from "components/MaxHealthComponent.sol";
import { ShipComponent, ID as ShipComponentID } from "components/ShipComponent.sol";
import { SailPositionComponent, ID as SailPositionComponentID } from "components/SailPositionComponent.sol";
import { OnFireComponent, ID as OnFireComponentID } from "components/OnFireComponent.sol";
import { DamagedCannonsComponent, ID as DamagedCannonsComponentID } from "components/DamagedCannonsComponent.sol";
import { FirepowerComponent, ID as FirepowerComponentID } from "components/FirepowerComponent.sol";
import { GameConfigComponent, ID as GameConfigComponentID } from "components/GameConfigComponent.sol";
import { LastMoveComponent, ID as LastMoveComponentID } from "components/LastMoveComponent.sol";
import { LastActionComponent, ID as LastActionComponentID } from "components/LastActionComponent.sol";
import { OwnedByComponent, ID as OwnedByComponentID } from "components/OwnedByComponent.sol";
import { NameComponent, ID as NameComponentID } from "components/NameComponent.sol";
import { PlayerComponent, ID as PlayerComponentID } from "components/PlayerComponent.sol";
import { CommitmentComponent, ID as CommitmentComponentID } from "components/CommitmentComponent.sol";
import { LoadedComponent, ID as LoadedComponentID } from "components/LoadedComponent.sol";
import { CannonComponent, ID as CannonComponentID } from "components/CannonComponent.sol";
import { SpeedComponent, ID as SpeedComponentID } from "components/SpeedComponent.sol";
import { ShipPrototypeComponent, ID as ShipPrototypeComponentID } from "components/ShipPrototypeComponent.sol";
import { KillsComponent, ID as KillsComponentID } from "components/KillsComponent.sol";
import { LastHitComponent, ID as LastHitComponentID } from "components/LastHitComponent.sol";
import { BootyComponent, ID as BootyComponentID } from "components/BootyComponent.sol";
import { ActionComponent, ID as ActionComponentID } from "components/ActionComponent.sol";

// Systems (requires 'systems=...' remapping in project's remappings.txt)
import { MoveSystem, ID as MoveSystemID } from "systems/MoveSystem.sol";
import { ActionSystem, ID as ActionSystemID } from "systems/ActionSystem.sol";
import { ComponentDevSystem, ID as ComponentDevSystemID } from "systems/ComponentDevSystem.sol";
import { PlayerSpawnSystem, ID as PlayerSpawnSystemID } from "systems/PlayerSpawnSystem.sol";
import { RespawnSystem, ID as RespawnSystemID } from "systems/RespawnSystem.sol";
import { CommitSystem, ID as CommitSystemID } from "systems/CommitSystem.sol";
import { InitSystem, ID as InitSystemID } from "systems/InitSystem.sol";

struct DeployResult {
  IWorld world;
  address deployer;
}

library LibDeploy {
  function deploy(
    address _deployer,
    address _world,
    bool _reuseComponents
  ) internal returns (DeployResult memory result) {
    result.deployer = _deployer;

    // ------------------------
    // Deploy
    // ------------------------

    // Deploy world
    result.world = _world == address(0) ? new World() : IWorld(_world);
    if (_world == address(0)) result.world.init(); // Init if it's a fresh world

    // Deploy components
    if (!_reuseComponents) {
      IComponent comp;

      console.log("Deploying PositionComponent");
      comp = new PositionComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying RotationComponent");
      comp = new RotationComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying MoveCardComponent");
      comp = new MoveCardComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying LengthComponent");
      comp = new LengthComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying RangeComponent");
      comp = new RangeComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying HealthComponent");
      comp = new HealthComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying MaxHealthComponent");
      comp = new MaxHealthComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying ShipComponent");
      comp = new ShipComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying SailPositionComponent");
      comp = new SailPositionComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying OnFireComponent");
      comp = new OnFireComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying DamagedCannonsComponent");
      comp = new DamagedCannonsComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying FirepowerComponent");
      comp = new FirepowerComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying GameConfigComponent");
      comp = new GameConfigComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying LastMoveComponent");
      comp = new LastMoveComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying LastActionComponent");
      comp = new LastActionComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying OwnedByComponent");
      comp = new OwnedByComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying NameComponent");
      comp = new NameComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying PlayerComponent");
      comp = new PlayerComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying CommitmentComponent");
      comp = new CommitmentComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying LoadedComponent");
      comp = new LoadedComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying CannonComponent");
      comp = new CannonComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying SpeedComponent");
      comp = new SpeedComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying ShipPrototypeComponent");
      comp = new ShipPrototypeComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying KillsComponent");
      comp = new KillsComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying LastHitComponent");
      comp = new LastHitComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying BootyComponent");
      comp = new BootyComponent(address(result.world));
      console.log(address(comp));

      console.log("Deploying ActionComponent");
      comp = new ActionComponent(address(result.world));
      console.log(address(comp));
    }

    // Deploy systems
    deploySystems(address(result.world), true);

    // Call initializer libraries
    if (!_reuseComponents) {
      // Allow initializers to utilize SystemStorage
      SystemStorage.init(result.world, result.world.components());
    }
  }

  function authorizeWriter(
    IUint256Component components,
    uint256 componentId,
    address writer
  ) internal {
    IComponent(getAddressById(components, componentId)).authorizeWriter(writer);
  }

  /**
   * Deploy systems to the given world.
   * If `init` flag is set, systems with `initialize` setting in `deploy.json` will be executed.
   */
  function deploySystems(address _world, bool init) internal {
    IWorld world = IWorld(_world);
    // Deploy systems
    ISystem system;
    IUint256Component components = world.components();

    console.log("Deploying MoveSystem");
    system = new MoveSystem(world, address(components));
    world.registerSystem(address(system), MoveSystemID);
    authorizeWriter(components, PositionComponentID, address(system));
    authorizeWriter(components, RotationComponentID, address(system));
    authorizeWriter(components, LastMoveComponentID, address(system));
    authorizeWriter(components, HealthComponentID, address(system));
    authorizeWriter(components, SailPositionComponentID, address(system));
    authorizeWriter(components, BootyComponentID, address(system));
    authorizeWriter(components, LengthComponentID, address(system));
    console.log(address(system));

    console.log("Deploying ActionSystem");
    system = new ActionSystem(world, address(components));
    world.registerSystem(address(system), ActionSystemID);
    authorizeWriter(components, HealthComponentID, address(system));
    authorizeWriter(components, OnFireComponentID, address(system));
    authorizeWriter(components, DamagedCannonsComponentID, address(system));
    authorizeWriter(components, SailPositionComponentID, address(system));
    authorizeWriter(components, LastActionComponentID, address(system));
    authorizeWriter(components, LoadedComponentID, address(system));
    authorizeWriter(components, KillsComponentID, address(system));
    authorizeWriter(components, LastHitComponentID, address(system));
    authorizeWriter(components, BootyComponentID, address(system));
    authorizeWriter(components, LengthComponentID, address(system));
    console.log(address(system));

    console.log("Deploying ComponentDevSystem");
    system = new ComponentDevSystem(world, address(components));
    world.registerSystem(address(system), ComponentDevSystemID);
    authorizeWriter(components, PositionComponentID, address(system));
    authorizeWriter(components, RotationComponentID, address(system));
    authorizeWriter(components, MoveCardComponentID, address(system));
    authorizeWriter(components, LengthComponentID, address(system));
    authorizeWriter(components, RangeComponentID, address(system));
    authorizeWriter(components, HealthComponentID, address(system));
    authorizeWriter(components, MaxHealthComponentID, address(system));
    authorizeWriter(components, ShipComponentID, address(system));
    authorizeWriter(components, SailPositionComponentID, address(system));
    authorizeWriter(components, OnFireComponentID, address(system));
    authorizeWriter(components, DamagedCannonsComponentID, address(system));
    authorizeWriter(components, FirepowerComponentID, address(system));
    authorizeWriter(components, GameConfigComponentID, address(system));
    authorizeWriter(components, LastMoveComponentID, address(system));
    authorizeWriter(components, LastActionComponentID, address(system));
    authorizeWriter(components, OwnedByComponentID, address(system));
    authorizeWriter(components, NameComponentID, address(system));
    authorizeWriter(components, PlayerComponentID, address(system));
    authorizeWriter(components, CommitmentComponentID, address(system));
    authorizeWriter(components, LoadedComponentID, address(system));
    authorizeWriter(components, CannonComponentID, address(system));
    authorizeWriter(components, SpeedComponentID, address(system));
    authorizeWriter(components, ShipPrototypeComponentID, address(system));
    authorizeWriter(components, KillsComponentID, address(system));
    authorizeWriter(components, LastHitComponentID, address(system));
    authorizeWriter(components, BootyComponentID, address(system));
    authorizeWriter(components, ActionComponentID, address(system));
    console.log(address(system));

    console.log("Deploying PlayerSpawnSystem");
    system = new PlayerSpawnSystem(world, address(components));
    world.registerSystem(address(system), PlayerSpawnSystemID);
    authorizeWriter(components, PositionComponentID, address(system));
    authorizeWriter(components, RotationComponentID, address(system));
    authorizeWriter(components, LengthComponentID, address(system));
    authorizeWriter(components, RangeComponentID, address(system));
    authorizeWriter(components, HealthComponentID, address(system));
    authorizeWriter(components, MaxHealthComponentID, address(system));
    authorizeWriter(components, ShipComponentID, address(system));
    authorizeWriter(components, SailPositionComponentID, address(system));
    authorizeWriter(components, FirepowerComponentID, address(system));
    authorizeWriter(components, LastMoveComponentID, address(system));
    authorizeWriter(components, LastActionComponentID, address(system));
    authorizeWriter(components, LastHitComponentID, address(system));
    authorizeWriter(components, OwnedByComponentID, address(system));
    authorizeWriter(components, PlayerComponentID, address(system));
    authorizeWriter(components, NameComponentID, address(system));
    authorizeWriter(components, CannonComponentID, address(system));
    authorizeWriter(components, SpeedComponentID, address(system));
    authorizeWriter(components, KillsComponentID, address(system));
    authorizeWriter(components, BootyComponentID, address(system));
    console.log(address(system));

    console.log("Deploying RespawnSystem");
    system = new RespawnSystem(world, address(components));
    world.registerSystem(address(system), RespawnSystemID);
    authorizeWriter(components, PositionComponentID, address(system));
    authorizeWriter(components, RotationComponentID, address(system));
    authorizeWriter(components, HealthComponentID, address(system));
    authorizeWriter(components, SailPositionComponentID, address(system));
    authorizeWriter(components, KillsComponentID, address(system));
    authorizeWriter(components, BootyComponentID, address(system));
    authorizeWriter(components, OnFireComponentID, address(system));
    authorizeWriter(components, DamagedCannonsComponentID, address(system));
    authorizeWriter(components, LengthComponentID, address(system));
    console.log(address(system));

    console.log("Deploying CommitSystem");
    system = new CommitSystem(world, address(components));
    world.registerSystem(address(system), CommitSystemID);
    authorizeWriter(components, CommitmentComponentID, address(system));
    console.log(address(system));

    console.log("Deploying InitSystem");
    system = new InitSystem(world, address(components));
    world.registerSystem(address(system), InitSystemID);
    authorizeWriter(components, PositionComponentID, address(system));
    authorizeWriter(components, RotationComponentID, address(system));
    authorizeWriter(components, MoveCardComponentID, address(system));
    authorizeWriter(components, LengthComponentID, address(system));
    authorizeWriter(components, RangeComponentID, address(system));
    authorizeWriter(components, HealthComponentID, address(system));
    authorizeWriter(components, MaxHealthComponentID, address(system));
    authorizeWriter(components, ShipComponentID, address(system));
    authorizeWriter(components, SailPositionComponentID, address(system));
    authorizeWriter(components, OnFireComponentID, address(system));
    authorizeWriter(components, DamagedCannonsComponentID, address(system));
    authorizeWriter(components, FirepowerComponentID, address(system));
    authorizeWriter(components, GameConfigComponentID, address(system));
    authorizeWriter(components, LastMoveComponentID, address(system));
    authorizeWriter(components, LastActionComponentID, address(system));
    authorizeWriter(components, OwnedByComponentID, address(system));
    authorizeWriter(components, NameComponentID, address(system));
    authorizeWriter(components, PlayerComponentID, address(system));
    authorizeWriter(components, CommitmentComponentID, address(system));
    authorizeWriter(components, LoadedComponentID, address(system));
    authorizeWriter(components, CannonComponentID, address(system));
    authorizeWriter(components, SpeedComponentID, address(system));
    authorizeWriter(components, ShipPrototypeComponentID, address(system));
    authorizeWriter(components, KillsComponentID, address(system));
    authorizeWriter(components, LastHitComponentID, address(system));
    authorizeWriter(components, BootyComponentID, address(system));
    authorizeWriter(components, ActionComponentID, address(system));
    if (init) system.execute(abi.encode(block.timestamp, 25, 9, 25, 90, 345676, 3, 9, false, 400, 6));
    console.log(address(system));
  }
}
