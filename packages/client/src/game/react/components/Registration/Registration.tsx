import { removeComponent } from "@latticexyz/recs";
import { useState } from "react";
import styled from "styled-components";
import { useGame } from "../../../../mud/providers/GameProvider";
import { ShipContainer } from "../../../../styles/global";
import { FleetPage } from "./FleetPage";
import { NamePage } from "./NamePage";

type RegisterState = "Name" | "Fleet";

export function Registration() {
  const {
    components: { ActiveShip },
    godEntity,
  } = useGame();
  const [state, setState] = useState<RegisterState>("Name");

  return (
    <RegisterContainer>
      {state == "Name" ? (
        <NamePage selectFleet={() => setState("Fleet")} />
      ) : (
        <FleetPage
          back={() => {
            removeComponent(ActiveShip, godEntity);
            setState("Name");
          }}
        />
      )}
    </RegisterContainer>
  );
}

const RegisterContainer = styled(ShipContainer)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  cursor: auto;
  pointer-events: all;
`;
