import { useComponentValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import { useMUD } from "../../mud/providers/MUDProvider";
import { ShipContainer } from "../styles/global";
import { Cell } from "./Cell";
import { ShipCard } from "./ShipStatus/ShipCard";

const gridConfig = { gridRowStart: 2, gridRowEnd: 5, gridColumnStart: 11, gridColumnEnd: 13 };
export function HoveredShip() {
  const {
    components: { HoveredShip },
    godEntity,
  } = useMUD();

  const shipEntity = useComponentValue(HoveredShip, godEntity)?.value as EntityIndex | undefined;
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
