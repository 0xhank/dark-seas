import { useComponentValue } from "@latticexyz/react";
import styled from "styled-components";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { usePhaser } from "../../../../mud/providers/PhaserProvider";
import { ShipContainer } from "../../../../styles/global";
import { FleetPage } from "./FleetPage";
import { SpectatePage } from "./SpectatePage";

export function Registration() {
  const {
    components: { Name },
  } = usePhaser();
  const ownerEntity = useOwner();
  const name = useComponentValue(Name, ownerEntity)?.value;

  return <RegisterContainer>{!name ? <SpectatePage /> : <FleetPage />}</RegisterContainer>;
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
