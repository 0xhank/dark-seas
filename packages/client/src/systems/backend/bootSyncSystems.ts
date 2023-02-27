import { defineComponentSystem, defineEnterSystem, defineSystem, Has, Not, setComponent } from "@latticexyz/recs";
import { world } from "../../mud/world";
import { SetupResult } from "../../setupMUD";

export function bootSyncSystems(MUD: SetupResult) {
  const {
    components: {
      HealthBackend,
      HealthLocal,
      Health,
      OnFire,
      OnFireLocal,
      DamagedCannons,
      DamagedCannonsLocal,
      SailPosition,
      SailPositionLocal,
      ShipPrototype,
      Length,
      Speed,
      MaxHealth,
      Firepower,
      Range,
      Rotation,
      OwnedBy,
      Name,
      Booty,
      Cannon,
    },
    utils: { decodeShipPrototype, destroySpriteObject },
  } = MUD;
  defineSystem(world, [Has(Health)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    const oldHealth = value[1]?.value as number | undefined;
    if (health == undefined || !!oldHealth) return;
    setComponent(HealthLocal, entity, { value: health });
    setComponent(HealthBackend, entity, { value: health });
  });

  defineEnterSystem(world, [Has(OnFire), Not(OnFireLocal)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(OnFireLocal, entity, { value: health });
  });

  defineEnterSystem(world, [Has(DamagedCannons), Not(DamagedCannonsLocal)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(DamagedCannonsLocal, entity, { value: health });
  });

  defineEnterSystem(world, [Has(SailPosition), Not(SailPositionLocal)], ({ entity, value }) => {
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(SailPositionLocal, entity, { value: health });
  });

  defineComponentSystem(world, ShipPrototype, ({ entity: prototypeEntity, value: [newVal] }) => {
    const prototype = decodeShipPrototype(prototypeEntity);

    setComponent(Length, prototypeEntity, { value: prototype.length });
    setComponent(Speed, prototypeEntity, { value: prototype.speed });
    setComponent(MaxHealth, prototypeEntity, { value: prototype.maxHealth });
    setComponent(Name, prototypeEntity, { value: prototype.name });
    setComponent(Booty, prototypeEntity, { value: prototype.price.toString() });
    prototype.cannons.map((cannon) => {
      const cannonEntity = world.registerEntity();
      setComponent(Cannon, cannonEntity, { value: true });
      setComponent(Rotation, cannonEntity, { value: cannon.rotation });
      setComponent(Firepower, cannonEntity, { value: cannon.firepower });
      setComponent(Range, cannonEntity, { value: cannon.range });
      setComponent(OwnedBy, cannonEntity, { value: world.entities[prototypeEntity] });
    });

    destroySpriteObject(prototypeEntity);
  });
}
