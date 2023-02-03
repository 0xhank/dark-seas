import { EntityIndex, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { Layers } from "../../../../../types";

export const MoveSelection = ({ layers, ship }: { layers: Layers; ship: EntityIndex }) => {
  const {
    components: { SailPosition },
  } = layers.network;

  const sailPosition = getComponentValueStrict(SailPosition, ship).value;

  if (sailPosition == 0) {
    return <SpecialText>Cannot move with torn sails!</SpecialText>;
  } else return <SpecialText>Select a move</SpecialText>;
};

const SpecialText = styled.span`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
`;
