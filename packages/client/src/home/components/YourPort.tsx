import { useEntityQuery } from "@latticexyz/react";
import { Has, HasValue } from "@latticexyz/recs";
import { Fragment } from "react";
import styled from "styled-components";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { useOwner } from "../../mud/providers/OwnerProvider";
import { world } from "../../world";
import { ShipButton } from "./ShipButton";

export function YourPort() {
  const {
    components: { Ship, OwnedBy },
  } = useNetwork();
  const ownerEntity = useOwner();
  const ownerId = world.entities[ownerEntity];
  const shipEntities = useEntityQuery([Has(Ship), HasValue(OwnedBy, { value: ownerId })]);

  return (
    <ShipButtons>
      {shipEntities.map((shipEntity, i) => (
        <Fragment key={`your-port-ship-${i}`}>
          <ShipButton shipEntity={shipEntity} showName showCurrentGame />
        </Fragment>
      ))}
    </ShipButtons>
  );
}
export const ShipButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  overflow-y: auto;
  gap: 8px;
  width: 100%;
  height: 100%;
`;
