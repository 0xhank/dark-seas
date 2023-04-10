import { useEntityQuery } from "@latticexyz/react";
import { Has, HasValue, getComponentValue, removeComponent, setComponent } from "@latticexyz/recs";
import { Fragment } from "react";
import styled from "styled-components";
import { ShipButton } from "../../../../home/components/ShipButton";
import { useOwner } from "../../../../mud/providers/OwnerProvider";
import { usePhaser } from "../../../../mud/providers/PhaserProvider";
import { Container } from "../../../../styles/global";
import { world } from "../../../../world";

export function AvailableShips({ flex }: { flex: number }) {
  const {
    components: { Ship, OwnedBy, ActiveShip },
    gameEntity,
  } = usePhaser();
  const ownerEntity = useOwner();
  const yourShips = [...useEntityQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[ownerEntity] })])];

  return (
    <Container style={{ flex, overflow: "none" }}>
      <Title>Available Ships</Title>
      <ShipButtons>
        {yourShips.map((shipEntity) => {
          const activeShip = getComponentValue(ActiveShip, gameEntity)?.value;
          const handleSelection = () => {
            if (shipEntity == activeShip) {
              removeComponent(ActiveShip, gameEntity);
            } else {
              setComponent(ActiveShip, gameEntity, { value: shipEntity });
            }
          };
          return (
            <Fragment key={`available-ship-${shipEntity}`}>
              <ShipButton
                shipEntity={shipEntity}
                showPrice
                onClick={handleSelection}
                active={shipEntity == activeShip}
              />
            </Fragment>
          );
        })}
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
