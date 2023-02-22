import { getComponentEntities } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { Container } from "../../styles/global";
import { ShipButton } from "./ShipButton";

export function AvailableShips({ flex }: { flex: number }) {
  const {
    components: { ShipPrototype },
  } = useMUD();

  const prototypeEntities = [...getComponentEntities(ShipPrototype)];

  return (
    <Container style={{ flex, overflow: "none" }}>
      <Title>Available Ships</Title>
      <ShipButtons>
        {prototypeEntities.map((prototypeEntity) => (
          <ShipButton prototypeEntity={prototypeEntity} />
        ))}
      </ShipButtons>
    </Container>
  );
}

const ShipButtons = styled.div`
  direction: rtl;

  display: flex;
  flex-direction: column;
  overflow-y: scroll;
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
  font-size: 3rem;
  line-height: 4rem;
`;
