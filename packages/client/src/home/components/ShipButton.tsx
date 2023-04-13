import { useComponentValue } from "@latticexyz/react";
import { EntityID, EntityIndex, setComponent } from "@latticexyz/recs";
import styled from "styled-components";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { BoxImage, Button, OptionButton, colors } from "../../styles/global";
import { ShipImages, getShipSprite } from "../../utils/ships";
import { world } from "../../world";

export function ShipButton({
  shipEntity,
  disabled = false,
  active = false,
  showName = false,
  showPrice = false,
  hidePrototypeName = false,
  showCurrentGame = false,
  showCount = false,
  onClick = () => {},
}: {
  shipEntity: EntityIndex;
  disabled?: boolean;
  active?: boolean;
  showName?: boolean;
  showPrice?: boolean;
  hidePrototypeName?: boolean;
  showCurrentGame?: boolean;
  showCount?: boolean;
  onClick?: () => void;
}) {
  const {
    components: { Name, Length, Page, Price, Health, CurrentGame },
    utils: { getShipName },
    singletonEntity,
  } = useNetwork();
  const name = useComponentValue(Name, shipEntity, { value: "" }).value;
  const price = useComponentValue(Price, shipEntity, { value: 0 }).value;
  const length = useComponentValue(Length, shipEntity, { value: 0 }).value;
  const health = useComponentValue(Health, shipEntity, { value: 0 }).value;
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
      <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
        {showPrice && (
          <div style={{ display: "flex", flexDirection: "column", textAlign: "end" }}>
            <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>value</p>
            <p style={{ fontSize: "3rem", lineHeight: "3rem" }}>{price}</p>
            <br style={{ lineHeight: "0.75rem" }} />
          </div>
        )}
        {showName && <p style={{ fontSize: "1.5rem", lineHeight: "2rem" }}>{getShipName(shipEntity)}</p>}
        {showCurrentGame && currentGameEntity !== undefined && (
          <Button onClick={() => setComponent(Page, singletonEntity, { page: "game", gameEntity: currentGameEntity })}>
            Go to current game
          </Button>
        )}
        {!hidePrototypeName && <p style={{ lineHeight: "1.25rem" }}>{name}</p>}
        {showCount && (
          <p style={{ fontStyle: "italic", lineHeight: "1.25rem", color: colors.brown }}>{health} left for purchase</p>
        )}
      </div>
    </OptionButton>
  );
}

const BoxContainer = styled.div`
  display: flex;
  position: relative;
`;
