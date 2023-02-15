import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID, EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { usePlayer } from "../../../mud/providers/PlayerProvider";
import { ActionType } from "../../../types";
import { getShipSprite, ShipImages } from "../../../utils/ships";
import { BoxImage, colors } from "../../styles/global";
import { ShipAttributeTypes } from "../../types";
import HealthBar from "./HealthBar";
import ShipAttribute from "./ShipAttribute";
import ShipDamage from "./ShipDamage";

export const ShipCard = ({ shipEntity }: { shipEntity: EntityIndex }) => {
  const {
    utils: { getPlayerEntity, getTurn, getShipName },
    components: {
      MaxHealth,
      Rotation,
      OwnedBy,
      Name,
      Length,
      LastAction,
      Booty,
      SelectedActions,
      HealthLocal,
      OnFireLocal,
      SailPositionLocal,
      DamagedCannonsLocal,
    },
    network: { clock },
  } = useMUD();

  const playerEntity = usePlayer();
  const fakeOwner = "0" as EntityID;
  const ownerId = useComponentValue(OwnedBy, shipEntity, { value: fakeOwner }).value;
  const ownerEntity = getPlayerEntity(ownerId);
  const sailPosition = useComponentValue(SailPositionLocal, shipEntity, { value: 2 }).value;
  const rotation = useComponentValue(Rotation, shipEntity, { value: 0 }).value;
  const health = useComponentValue(HealthLocal, shipEntity, { value: 0 })?.value || 0;
  const maxHealth = useComponentValue(MaxHealth, shipEntity, { value: 0 })?.value || 0;
  const onFire = useComponentValue(OnFireLocal, shipEntity, { value: 0 })?.value;
  const damagedCannons = useComponentValue(DamagedCannonsLocal, shipEntity, { value: 0 })?.value;
  const ownerName = useComponentValue(Name, ownerEntity, { value: fakeOwner })?.value;
  const selectedActions = useComponentValue(SelectedActions, shipEntity);
  const length = useComponentValue(Length, shipEntity)?.value || 10;

  const time = useObservableValue(clock.time$) || 0;
  const currentTurn = getTurn(time);
  const lastAction = useComponentValue(LastAction, playerEntity)?.value;
  const actionsExecuted = currentTurn == lastAction;
  const updates = actionsExecuted ? undefined : selectedActions?.actionTypes;

  const updatedSailPosition = updates?.includes(ActionType.LowerSail)
    ? sailPosition - 1
    : updates?.includes(ActionType.RaiseSail)
    ? sailPosition + 1
    : sailPosition;

  const name = getShipName(shipEntity);
  if (!ownerEntity) return null;
  return (
    <BoxContainer>
      <span style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>{ownerName}'s</span>
      <span style={{ fontSize: "1.25rem", lineHeight: "2rem" }}>{name}</span>
      <HealthBar health={health} maxHealth={maxHealth} />
      <BoxImage length={length}>
        <img
          src={ShipImages[getShipSprite(ownerEntity, health, maxHealth, ownerEntity == playerEntity)]}
          style={{
            objectFit: "scale-down",
            left: "50%",
            position: "absolute",
            top: "50%",
            margin: "auto",
            transform: `rotate(${rotation - 90}deg) translate(-50%,-50%)`,
            transformOrigin: `top left`,
            maxWidth: `${3.5 * length}px`,
          }}
        />
      </BoxImage>
      <div style={{ flex: 3, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: "3px" }}>
        <div style={{ display: "flex", width: "100%", flexWrap: "wrap" }}>
          <ShipAttribute
            attributeType={ShipAttributeTypes.Sails}
            attribute={updatedSailPosition}
            updating={updatedSailPosition !== sailPosition}
          />
        </div>
        {health !== 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            {damagedCannons !== undefined && (
              <ShipDamage
                message="cannons broken"
                amountLeft={damagedCannons}
                fixing={updates?.includes(ActionType.RepairCannons)}
              />
            )}
            {onFire !== undefined && (
              <ShipDamage message="on fire" amountLeft={onFire} fixing={updates?.includes(ActionType.ExtinguishFire)} />
            )}
            {sailPosition == 0 && <ShipDamage message="sails torn" fixing={updates?.includes(ActionType.RepairSail)} />}
          </div>
        )}
      </div>
    </BoxContainer>
  );
};

const BoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;
