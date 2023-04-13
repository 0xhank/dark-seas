import { useComponentValue } from "@latticexyz/react";
import { EntityID, EntityIndex, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { ShipImages, cap, getHash, getShipSprite } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { BoxImage, Button, OptionButton, colors } from "../../styles/global";
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
  disabled = false,
  active = false,
  showName = false,
  showPrice = false,
  hidePrototypeName = false,
  showCurrentGame = false,
  onClick = () => {},
}: {
  shipEntity: EntityIndex;
  disabled?: boolean;
  active?: boolean;
  showName?: boolean;
  showPrice?: boolean;
  hidePrototypeName?: boolean;
  showCurrentGame?: boolean;
  onClick?: () => void;
}) {
  const {
    components: { Name, Length, Page, Price, CurrentGame },
    singletonEntity,
  } = useNetwork();
  const name = useComponentValue(Name, shipEntity, { value: "" }).value;
  const price = useComponentValue(Price, shipEntity, { value: 0 }).value;
  const length = useComponentValue(Length, shipEntity, { value: 0 }).value;
  const currentGame = useComponentValue(CurrentGame, shipEntity)?.value as EntityID | undefined;
  const currentGameEntity = currentGame ? world.entityToIndex.get(currentGame) : undefined;
  return (
    <OptionButton
      disabled={disabled}
      isSelected={active}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: `${7 * length}px`,
        padding: "1rem",
        direction: "ltr",
        position: "relative",
        minWidth: "200px",
        width: "100%",
      }}
      onClick={onClick}
    >
      <BoxContainer>
        <BoxImage length={length}>
          <img
            src={ShipImages[getShipSprite(0 as EntityIndex, 1, 1, true)]}
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
        {showPrice && (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "end" }}>
            <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>price</p>
            <p style={{ fontSize: "3rem", lineHeight: "3.5rem" }}>{price}</p>
          </div>
        )}
        {showName && <p style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>{getShipName(shipEntity)}</p>}
        {showCurrentGame && currentGameEntity !== undefined && (
          <Button onClick={() => setComponent(Page, singletonEntity, { page: "game", gameEntity: currentGameEntity })}>
            Go to current game
          </Button>
        )}
        {!hidePrototypeName && <p style={{ fontStyle: "italic" }}>{name}</p>}
      </div>
    </OptionButton>
  );
}

const BoxContainer = styled.div`
  display: flex;
  position: relative;
`;
