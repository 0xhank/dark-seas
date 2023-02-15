import styled from "styled-components";
import { SailPositions } from "../../../types";
import { colors } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";

export default function ShipAttribute({
  attributeType,
  attribute,
  updating,
}: {
  attributeType: ShipAttributeTypes;
  attribute: number | undefined;
  updating?: boolean;
}) {
  if (attribute == undefined) return null;
  let source = "";
  if (attributeType == ShipAttributeTypes.Sails) {
    if (attribute == SailPositions.Torn) source = "/icons/broken-sail.svg";
    else source = "/icons/sail.svg";
  } else if (attributeType == ShipAttributeTypes.Booty) {
    source = "/icons/booty.svg";
  }

  return (
    <AttributeContainer>
      <LeftSide>
        <AttributeImg src={source} alt={`attribute-${attributeType}`} />
      </LeftSide>
      <RightSide updating={updating}>
        {attributeType == ShipAttributeTypes.Sails ? SailPositions[attribute] : attribute}
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
const AttributeContainer = styled.div`
  color: ${colors.darkBrown};
  border-radius: 6px;
  display: flex;
  flex-direction: row;
  gap: 0;
`;

const LeftSide = styled.div`
  background: ${colors.lightBrown};
  border-radius: 6px 0 0 6px;
  padding-inline: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 2rem;
`;

const RightSide = styled.div<{ updating?: boolean }>`
  background: ${({ updating }) => (updating ? colors.greenGlass : colors.thickGlass)};
  border-radius: 0 6px 6px 0;
  padding: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${colors.darkBrown};
  border-left: none;

  @media (max-width: 1500px) {
    line-height: 1.5rem;
  }
  height: 2rem;
`;
