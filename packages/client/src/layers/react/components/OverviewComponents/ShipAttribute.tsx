import styled from "styled-components";
import { colors, Container } from "../../styles/global";

import { ShipAttributeTypes } from "../../../phaser/constants";

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
        <img
          src={source}
          alt="Icon"
          style={{
            height: "30px",
            filter: `invert(81%) sepia(24%) saturate(2269%) hue-rotate(344deg) brightness(104%) contrast(103%)`,
          }}
        />
      </LeftSide>
      <RightSide style={{ fontSize: `${attributeString.length > 2 ? "14px" : "20px"}` }}>{attribute}</RightSide>
    </AttributeContainer>
  );
}

const AttributeContainer = styled(Container)`
  height: auto;
  color: ${colors.darkBrown};
  flex-direction: row;
  padding: 6px;
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
  background: ${colors.gold};
  border-radius: 0 12px 12px 0;
  padding: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: ${colors.darkBrown};
  line-height: 30px;
`;
