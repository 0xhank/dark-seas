import { Browser as ECSBrowser, createBrowserDevComponents } from "@latticexyz/ecs-browser";
import { Layer } from "@latticexyz/recs";
import { useState } from "react";
import { useMUD } from "../../../MUDContext";

export const ComponentBrowser = () => {
  const { world, components } = useMUD();
  const layer: Layer = { world, components };
  const browserComponents = createBrowserDevComponents(world);

  const [shown, setShown] = useState(false);
  (window as any).showBrowser = () => setShown(!shown);

  return (
    <div style={{ position: "fixed", right: 0, top: "10%", width: "25%", height: "50%" }}>
      {shown ? (
        <div>
          <ECSBrowser
            world={world}
            layers={{ react: layer }}
            devHighlightComponent={browserComponents.devHighlightComponent}
            hoverHighlightComponent={browserComponents.hoverHighlightComponent}
          />
        </div>
      ) : null}
    </div>
  );
};
