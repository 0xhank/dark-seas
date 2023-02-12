import { useComponentValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import { useMUD } from "../MUDContext";
import { Cell } from "./components/Cell";
import { ShipCard } from "./components/ShipStatus/ShipCard";
import { Container, InternalContainer } from "./styles/global";

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
