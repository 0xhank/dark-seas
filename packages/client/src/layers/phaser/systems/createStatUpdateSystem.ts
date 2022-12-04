import { GodID } from "@latticexyz/network";
import { tileCoordToPixelCoord, tween } from "@latticexyz/phaserx";
import { defineSystem, defineUpdateSystem, getComponentValueStrict, Has, Type, UpdateType } from "@latticexyz/recs";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createStatUpdateSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    world,
    components: { Health, OnFire, Leak, DamagedMast, SailPosition, CrewCount, Position, Ship },
    utils: { getGameConfig },
  } = network;

  const {
    polygonRegistry,
    scenes: {
      Main: { phaserScene },
    },
    positions,
  } = phaser;

  defineSystem(world, [Has(Health), Has(CrewCount)], (update) => {
    const position = getComponentValueStrict(Position, update.entity);
    const barHeightOffset = 50;
    const text = [];
    if (update.component == Health && update.type == UpdateType.Update) {
      text.push("Lost Health!");
    } else if (update.component == CrewCount && update.type == UpdateType.Update) {
      text.push("Lost Crew!");
    } else if (update.component == OnFire) {
      if (getComponentValueStrict(OnFire, update.entity).value != 0) return;
      text.push("Caught Fire!");
    } else if (update.component == Leak) {
      text.push("Sprang a Leak!");
    } else if (update.component == DamagedMast) {
      if (getComponentValueStrict(DamagedMast, update.entity).value != 0) return;
      text.push("Damaged Mast!");
    } else if (update.component == SailPosition) {
      text.push("Tore Sails!");
    } else {
      return;
    }

    let updateGroup = polygonRegistry.get(`update-${update.entity}`) || phaserScene.add.group();
    updateGroup = updateGroup.clear(true, true);

    console.log("position:", position);
    const pixelPosition = tileCoordToPixelCoord(position, positions.posWidth, positions.posHeight);

    const interval = 3000;
    for (let i = 0; i < text.length; i++) {
      const msg = text[i];
      const start = i * interval;
      const end = start + interval;
      phaserScene.time.delayedCall(
        start,
        () => {
          const textObject = phaserScene.add.text(pixelPosition.x + 3, pixelPosition.y - barHeightOffset, msg, {
            fontFamily: "sans-serif",
          });
          textObject.setTint(0xffffff);
          textObject.setScale(2);
          updateGroup.add(textObject);
        },
        [],
        phaserScene
      );

      phaserScene.time.delayedCall(
        end,
        () => {
          updateGroup?.clear(true, true);
        },
        [],
        phaserScene
      );
    }
  });
}
