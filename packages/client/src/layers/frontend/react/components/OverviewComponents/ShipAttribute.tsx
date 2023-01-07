import styled from "styled-components";
import { SailPositions } from "../../../../../types";
import { colors, Container } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";

export default function ShipAttribute({
  attributeType,
  attribute,
  updating,
}: {
  attributeType: ShipAttributeTypes;
  attribute: number;
  updating?: boolean;
}) {
  let source = "";
  if (attributeType == ShipAttributeTypes.Sails) {
    if (attribute == SailPositions.Torn) source = "/icons/broken-sail.svg";
    else source = "/icons/sail.svg";
  }

  return (
    <AttributeContainer>
      <LeftSide>
        <AttributeImg src={source} alt={`attribute-${attributeType}`} />
      </LeftSide>
      <RightSide updating={updating} style={{ fontSize: `${attribute.toString().length > 2 ? "1rem" : "1.25rem"}` }}>
        {SailPositions[attribute]}
      </RightSide>
    </AttributeContainer>
  );
}

const AttributeImg = styled.img`
  height: 2.5rem;
  filter: invert(81%) sepia(24%) saturate(2269%) hue-rotate(344deg) brightness(104%) contrast(103%);

  @media (max-width: 1500px) {
    height: 1.5rem;
  }
`;
const AttributeContainer = styled(Container)`
  height: auto;
  color: ${colors.darkBrown};
  flex-direction: row;
  padding: 3px;
  border-radius: 6px;
  gap: 0;
  width: auto;
`;

const LeftSide = styled.div`
  background: ${colors.lightBrown};
  border-radius: 12px 0 0 12px;
  padding: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RightSide = styled.div<{ updating?: boolean }>`
  background: ${({ updating }) => (updating ? colors.green : colors.thickGlass)};
  border-radius: 0 12px 12px 0;
  padding: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  color: ${colors.darkBrown};
  line-height: 2.5rem;

  @media (max-width: 1500px) {
    line-height: 1.5rem;
  }
`;
