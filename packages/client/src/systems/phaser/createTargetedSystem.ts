import { defineComponentSystem } from "@latticexyz/recs";
import { colors } from "../../layers/frontend/react/styles/global";
import { useMUD } from "../../MUDContext";

export function createTargetedSystem() {
  const {
    world,
    components: { Targeted },

    utils: { getSpriteObject },
  } = useMUD();

  defineComponentSystem(world, Targeted, (update) => {
    const targetedShip = getSpriteObject(update.entity);

    const value = update.value[0]?.value;
    if (!value) {
      targetedShip.clearTint();
    } else {
      targetedShip.setTint(colors.redHex);
    }
  });
}
