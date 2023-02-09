import { defineRxSystem, EntityID, setComponent } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";

export function createSuccessfulRespawnSystem() {
  const {
    world,
    components: { HealthLocal, HealthBackend, Health },
    systemCallStreams,
  } = useMUD();

  defineRxSystem(world, systemCallStreams["ds.system.Respawn"], (systemCall) => {
    const { args, systemId, updates } = systemCall;
    const { shipEntities } = args as {
      shipEntities: EntityID[];
    };

    shipEntities.forEach((shipID) => {
      const shipEntity = world.entityToIndex.get(shipID);
      if (!shipEntity) return;

      const newHealth = updates.find((update) => update.component == Health && update.entity == shipEntity)?.value
        ?.value as number | undefined;
      if (newHealth == undefined) return;

      setComponent(HealthLocal, shipEntity, { value: newHealth });
      setComponent(HealthBackend, shipEntity, { value: newHealth });
    });
  });
}
