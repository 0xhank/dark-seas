import { useComponentValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import { useMUD } from "../../MUDContext";
import { Container, InternalContainer } from "../styles/global";
import { Cell } from "./Cell";
import { ShipCard } from "./OverviewComponents/ShipCard";

const gridConfig = { gridRowStart: 2, gridRowEnd: 5, gridColumnStart: 10, gridColumnEnd: 13 };
export function HoveredShip() {
  const {
    components: { HoveredShip },
    godEntity,
  } = useMUD();

  const shipEntity = useComponentValue(HoveredShip, godEntity)?.value as EntityIndex | undefined;
  if (!shipEntity) return null;

  return (
    <Cell style={gridConfig}>
      <Container style={{ justifyContent: "flex-start" }}>
        <InternalContainer style={{ gap: "24px", height: "auto" }}>
          <ShipCard shipEntity={shipEntity} />
        </InternalContainer>
      </Container>
    </Cell>
  );
}
