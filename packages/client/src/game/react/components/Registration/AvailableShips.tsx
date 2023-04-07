import { useEntityQuery } from "@latticexyz/react";
import { Has, HasValue } from "@latticexyz/recs";
import { Fragment } from "react";
import styled from "styled-components";
import { useGame } from "../../../../mud/providers/GameProvider";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { Container } from "../../../../styles/global";
import { world } from "../../../../world";
import { ShipButton } from "./ShipButton";

export function AvailableShips({ flex }: { flex: number }) {
  const {
    components: { Ship, OwnedBy, Price },
  } = useGame();
  const ownerEntity = useOwner();
  const yourShips = [...useEntityQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[ownerEntity] })])];

  return (
    <Container style={{ flex, overflow: "none" }}>
      <Title>Available Ships</Title>
      <ShipButtons>
        {yourShips.map((shipEntity) => (
          <Fragment key={`available-ship-${shipEntity}`}>
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

const Title = styled.p`
  font-size: 2.5rem;
  line-height: 3rem;
`;
