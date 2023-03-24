import { Browser as ECSBrowser } from "@latticexyz/ecs-browser";
import { Layer } from "@latticexyz/recs";
import { useState } from "react";
import { useMUD } from "../../../mud/providers/MUDProvider";

export const ComponentBrowser = () => {
  const { world, components, dev } = useMUD();
  const layer: Layer = { world, components };

  const [shown, setShown] = useState(true);
  (window as any).showBrowser = () => setShown(!shown);

  return (
    <div style={{ position: "fixed", right: 0, top: "10%", width: "25%", height: "90%", zIndex: -1 }}>
      {shown ? (
        <ECSBrowser
          world={world}
          layers={{ react: layer }}
          devHighlightComponent={dev.DevHighlightComponent}
          hoverHighlightComponent={dev.HoverHighlightComponent}
          setContractComponentValue={dev.setContractComponentValue}
        />
      ) : null}
    </div>
  );
};
