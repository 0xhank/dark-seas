import { useState } from "react";
import styled from "styled-components";
import { ShipContainer } from "../../styles/global";
import { NameCaptain } from "./NameCaptain";
import { SelectFleet } from "./SelectFleet";

type RegisterState = "Name" | "Fleet";

export function Registration() {
  const [state, setState] = useState<RegisterState>("Fleet");

  return (
    <RegisterContainer>
      {state == "Name" ? (
        <NameCaptain selectFleet={() => setState("Fleet")} />
      ) : (
        <SelectFleet back={() => setState("Name")} />
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
