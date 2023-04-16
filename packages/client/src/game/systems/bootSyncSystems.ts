import { defineEnterSystem, defineSystem, Has, Not, setComponent } from "@latticexyz/recs";
import { world } from "../../world";
import { SetupResult } from "../types";

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
    },
    utils: { inGame },
  } = MUD;
  defineSystem(world, [Has(Health)], ({ entity, value }) => {
    if (!inGame(entity)) return;
    const health = value[0]?.value as number | undefined;
    const oldHealth = value[1]?.value as number | undefined;
    if (health == undefined || !!oldHealth) return;
    setComponent(HealthLocal, entity, { value: health });
    setComponent(HealthBackend, entity, { value: health });
  });

  defineEnterSystem(world, [Has(OnFire), Not(OnFireLocal)], ({ entity, value }) => {
    if (!inGame(entity)) return;
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(OnFireLocal, entity, { value: health });
  });

  defineEnterSystem(world, [Has(DamagedCannons), Not(DamagedCannonsLocal)], ({ entity, value }) => {
    if (!inGame(entity)) return;
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(DamagedCannonsLocal, entity, { value: health });
  });

  defineEnterSystem(world, [Has(SailPosition), Not(SailPositionLocal)], ({ entity, value }) => {
    if (!inGame(entity)) return;
    const health = value[0]?.value as number | undefined;
    if (!health) return;
    setComponent(SailPositionLocal, entity, { value: health });
  });
}
