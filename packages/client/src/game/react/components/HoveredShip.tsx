import { useComponentValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import { usePhaser } from "../../../mud/providers/PhaserProvider";
import { ShipContainer } from "../../../styles/global";
import { HoverType } from "../..//types";
import { Cell } from "./Cell";
import { ShipCard } from "./ShipStatus/ShipCard";

const gridConfig = { gridRowStart: 2, gridRowEnd: 5, gridColumnStart: 11, gridColumnEnd: 13 };
export function HoveredShip() {
  const {
    components: { HoveredSprite },
    gameEntity,
  } = usePhaser();

  const shipEntity = useComponentValue(HoveredSprite, HoverType.SHIP)?.value as EntityIndex | undefined;
  if (!shipEntity) return null;

  return (
    <Cell style={gridConfig}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px" }}>
        <ShipContainer style={{ width: "fix-content", alignSelf: "flex-end" }}>
          <ShipCard shipEntity={shipEntity} />
        </ShipContainer>
      </div>
    </Cell>
  );
}
