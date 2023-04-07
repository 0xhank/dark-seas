import { useEntityQuery } from "@latticexyz/react";
import { Has, HasValue } from "@latticexyz/recs";
import { Fragment } from "react";
import styled from "styled-components";
import { useHome } from "../../mud/providers/HomeProvider";
import { useOwner } from "../../mud/providers/OwnerProvider";
import { Container } from "../../styles/global";
import { world } from "../../world";
import { ShipButton } from "./ShipButton";

export function YourPort() {
  const {
    components: { Ship, OwnedBy },
  } = useHome();
  const ownerEntity = useOwner();
  const ownerId = world.entities[ownerEntity];
  const shipEntities = useEntityQuery([Has(Ship), HasValue(OwnedBy, { value: ownerId })]);

  return (
    <Container style={{ width: "auto", flex: 1 }}>
      <div style={{ fontSize: "1.5rem" }}>Your Port</div>
      <ShipButtons>
        {shipEntities.map((shipEntity, i) => (
          <Fragment key={`your-port-ship-${i}`}>
            <ShipButton shipEntity={shipEntity} />
          </Fragment>
        ))}
      </ShipButtons>
    </Container>
  );
}
const ShipButtons = styled.div`
  direction: rtl;

  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
  width: 100%;
  height: 100%;
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;
