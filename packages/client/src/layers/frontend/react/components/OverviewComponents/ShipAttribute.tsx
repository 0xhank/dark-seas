import styled from "styled-components";
import { colors, Container } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";

export default function ShipAttribute({
  attributeType,
  attribute,
}: {
  attributeType: ShipAttributeTypes;
  attribute: number | string;
}) {
  const source =
    attributeType == ShipAttributeTypes.Crew
      ? "/icons/backup.svg"
      : attributeType == ShipAttributeTypes.Sails
      ? "/icons/sail.svg"
      : "/icons/gunshot.svg";
  const attributeString = attribute.toString();
  return (
    <AttributeContainer>
      <LeftSide>
        <AttributeImg src={source} alt={`attribute-${attributeType}`} />
      </LeftSide>
      <RightSide style={{ fontSize: `${attributeString.length > 2 ? "1rem" : "1.25rem"}` }}>{attribute}</RightSide>
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

const RightSide = styled.div`
  background: ${colors.thickGlass};
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
