import { useEntityQuery } from "@latticexyz/react";
import { Has, Not } from "@latticexyz/recs";
import { Fragment } from "react";
import styled from "styled-components";
import { useHome } from "../../mud/providers/HomeProvider";
import { Container } from "../../styles/global";
import { ShipButton } from "./ShipButton";

export function ShipShop() {
  const {
    components: { ShipPrototype, OwnedBy },
    singletonEntity,
  } = useHome();

  const shipEntities = useEntityQuery([Has(ShipPrototype), Not(OwnedBy)]).filter(
    (entity) => entity !== singletonEntity
  );

  return (
    <Container style={{ width: "auto", flex: 1 }}>
      <div style={{ fontSize: "1.5rem" }}>Available Ships</div>
      <ShipButtons>
        {shipEntities.map((shipEntity, index) => (
          <Fragment key={index}>
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
