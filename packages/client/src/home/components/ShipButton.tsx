import { useComponentValue } from "@latticexyz/react";
import { EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { ShipImages, cap, getHash, getShipSprite } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useHome } from "../../mud/providers/HomeProvider";
import { BoxImage, OptionButton, colors } from "../../styles/global";
import { world } from "../../world";

function getShipName(shipEntity: EntityIndex) {
  const shipId = world.entities[shipEntity];

  const hash = getHash(shipId);
  const adjective = adjectives[hash % adjectives.length];
  const newHash = getHash(`${hash}`);
  const noun = nouns[newHash % nouns.length];

  const name = cap(adjective) + " " + cap(noun);
  return name;
}

export function ShipButton({
  shipEntity,
  showName = false,
  showPrice = false,
}: {
  shipEntity: EntityIndex;
  showName?: boolean;
  showPrice?: boolean;
}) {
  const {
    gameEntity,
    components: { Name, Length, Price },
  } = useHome();
  const name = useComponentValue(Name, shipEntity, { value: "" }).value;
  console.log("name: ", name);
  const price = useComponentValue(Price, shipEntity, { value: 0 }).value;
  const length = useComponentValue(Length, shipEntity, { value: 0 }).value;

  return (
    <OptionButton
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: `${7 * length}px`,
        padding: "18px",
        direction: "ltr",
        marginLeft: "6px",
        position: "relative",
        minWidth: "200px",
        width: "100%",
      }}
    >
      <BoxContainer>
        <BoxImage length={length}>
          <img
            src={ShipImages[getShipSprite(gameEntity, 1, 1, true)]}
            style={{
              objectFit: "scale-down",
              left: "50%",
              position: "absolute",
              top: "50%",
              margin: "auto",
              transform: `rotate(270deg) translate(-50%, 0%)`,
              transformOrigin: `top left`,
              maxWidth: `${3.5 * length}px`,
            }}
          />
        </BoxImage>
      </BoxContainer>
      <div style={{ display: "flex", flexDirection: "column", textAlign: "right", marginRight: "6px" }}>
        {showName && <p style={{ fontSize: "14px" }}>{getShipName(shipEntity)}</p>}
        {showPrice && (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "end" }}>
            <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>price</p>
            <p style={{ fontSize: "3rem", lineHeight: "3.5rem" }}>{price}</p>
          </div>
        )}
        <p style={{ fontStyle: "italic" }}>{name}</p>
      </div>
    </OptionButton>
  );
}

const BoxContainer = styled.div`
  display: flex;
  position: relative;
`;
