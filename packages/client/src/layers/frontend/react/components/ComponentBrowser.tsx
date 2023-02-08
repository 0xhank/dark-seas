import { Browser } from "@latticexyz/ecs-browser";
import { of } from "rxjs";
import { registerUIComponent } from "../engine";
export function registerComponentBrowser() {
  registerUIComponent(
    "ComponentBrowser",
    {
      colStart: 10,
      colEnd: 13,
      rowStart: 1,
      rowEnd: 8,
    },
    (layers) => of({ layers }),
    ({ layers }) => {
      const {
        network: { world, dev },
      } = layers;
      return (
        <Browser
          world={world}
          entities={world.entities}
          layers={layers}
          devHighlightComponent={dev.DevHighlightComponent}
          hoverHighlightComponent={dev.HoverHighlightComponent}
          setContractComponentValue={dev.setContractComponentValue}
        />
      );
    }
  );
}
