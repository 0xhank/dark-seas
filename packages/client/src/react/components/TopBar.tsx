import { useComponentValue } from "@latticexyz/react";
import styled from "styled-components";
import { useMUD } from "../../MUDContext";
import { ShipAttributeTypes } from "../types";
import { Cell } from "./Cell";
import ShipAttribute from "./OverviewComponents/ShipAttribute";

const gridConfig = { gridRowStart: 1, gridRowEnd: 3, gridColumnStart: 1, gridColumnEnd: 5 };

export function TopBar() {
  const {
    components: { Name, Booty },
    utils: { getPlayerEntity },
  } = useMUD();

  const playerEntity = getPlayerEntity();
  if (!playerEntity) return null;
  const booty = useComponentValue(Booty, playerEntity)?.value;
  const name = useComponentValue(Name, playerEntity)?.value;

  if (!name) return null;

  return (
    <Cell style={gridConfig}>
      <TopBarContainer>
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "12px" }}>
          <span style={{ fontWeight: "bolder", fontSize: "1.5rem", lineHeight: "2rem" }}>Captain {name}</span>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "6px" }}>
            {booty !== undefined && !isNaN(Number(booty)) && (
              <ShipAttribute attributeType={ShipAttributeTypes.Booty} attribute={Number(booty)} />
            )}
          </div>
        </div>
      </TopBarContainer>
    </Cell>
  );
}

const TopBarContainer = styled.div`
  position: absolute;
  left: 12;
  top: 12;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  height: fit-content;
  // margin-top: auto;
  // margin-bottom: auto;
`;
