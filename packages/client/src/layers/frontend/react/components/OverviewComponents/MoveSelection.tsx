import { useComponentValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../../../MUDContext";

export const MoveSelection = ({ shipEntity }: { shipEntity: EntityIndex }) => {
  const {
    components: { SailPosition },
  } = useMUD();

  const sailPosition = useComponentValue(SailPosition, shipEntity, { value: 0 }).value;

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
