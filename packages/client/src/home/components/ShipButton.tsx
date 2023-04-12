import { useComponentValue } from "@latticexyz/react";
import { EntityID, EntityIndex, getComponentValueStrict } from "@latticexyz/recs";
import styled from "styled-components";
import { ShipImages, cap, getHash, getShipSprite } from "../../game/utils/ships";
import { adjectives, nouns } from "../../game/utils/wordlist";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { BoxImage, Link, OptionButton, colors } from "../../styles/global";
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
  active = false,
  showName = false,
  showPrice = false,
  showCurrentGame = false,
  onClick = () => {},
}: {
  shipEntity: EntityIndex;
  active?: boolean;
  showName?: boolean;
  showPrice?: boolean;
  showCurrentGame?: boolean;
  onClick?: () => void;
}) {
  const {
    gameEntity,
    components: { Name, Length, Price, CurrentGame, GameConfig },
    worldAddress,
  } = useNetwork();
  const name = useComponentValue(Name, shipEntity, { value: "" }).value;
  const price = useComponentValue(Price, shipEntity, { value: 0 }).value;
  const length = useComponentValue(Length, shipEntity, { value: 0 }).value;
  const currentGame = useComponentValue(CurrentGame, shipEntity)?.value as EntityID | undefined;
  let gameConfig = undefined;
  if (currentGame) {
    const gameEntity = world.entityToIndex.get(currentGame);
    if (gameEntity) {
      gameConfig = getComponentValueStrict(GameConfig, gameEntity);
    }
  }
  return (
    <OptionButton
      isSelected={active}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        minHeight: `${7 * length}px`,
        padding: "18px",
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
        {showCurrentGame && gameConfig && (
          <Link to={"/game"} state={{ worldAddress, gameId: currentGame, block: gameConfig.startBlock }}></Link>
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
