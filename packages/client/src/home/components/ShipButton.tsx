import { EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { ShipPrototype } from "../../game/types";
import { ShipImages, cap, getHash, getShipSprite } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useHome } from "../../mud/providers/HomeProvider";
import { BoxImage, OptionButton } from "../../styles/global";
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

export function ShipButton({ prototype }: { prototype: { entity: EntityIndex } & ShipPrototype }) {
  const {
    components: { Length, Name },
    gameEntity,
  } = useHome();

  console.log("image:", ShipImages[getShipSprite(gameEntity, 1, 1, true)]);
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
        width: "100%",
      }}
    >
      <BoxContainer>
        <BoxImage length={prototype.length}>
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
              maxWidth: `${3.5 * prototype.length}px`,
            }}
          />
        </BoxImage>
      </BoxContainer>
      <div style={{ display: "flex", flexDirection: "column", textAlign: "right", marginRight: "6px" }}>
        <p style={{ fontSize: "14px" }}>{getShipName(prototype.entity)}</p>
        <p style={{ fontStyle: "italic" }}>{prototype.name}</p>
      </div>
    </OptionButton>
  );
}

const Title = styled.p`
  font-size: 3rem;
  line-height: 4rem;
`;

const BoxContainer = styled.div`
  display: flex;
  position: relative;
`;
