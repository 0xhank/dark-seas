import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityIndex, getComponentValueStrict, Has, runQuery } from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { merge } from "rxjs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { world } from "../../../mud/world";
import { Button, colors, Container } from "../../styles/global";
import { ShipButton } from "./ShipButton";

export function YourFleet({ flex }: { flex: number }) {
  const {
    components: { SelectedShip, ShipPrototype, Name, StagedShips },
    actions: { Action },
    utils: { decodeShipPrototype, getGameConfig },
    api: { spawnPlayer },
    godEntity,
  } = useMUD();

  useObservableValue(merge(ShipPrototype.update$, SelectedShip.update$, Action.update$));

  const budget = getGameConfig()?.budget || 0;
  const name = useComponentValue(Name, godEntity, { value: "" }).value;
  const stagedShips = useComponentValue(StagedShips, godEntity, { value: [] }).value.map((ship) => ({
    entity: ship as EntityIndex,
    ...decodeShipPrototype(ship as EntityIndex),
  }));

  const moneySpent = stagedShips.reduce((prev, curr) => prev + curr.price, 0);
  const registrationClosed = false;
  const spawnActions = [...runQuery([Has(Action)])];

  const spawning = !!spawnActions.find((action) => {
    const state = getComponentValueStrict(Action, action).state;
    return state !== ActionState.Complete && state !== ActionState.Failed;
  });
  const txFailed =
    !spawning &&
    !!spawnActions.find((action) => {
      const state = getComponentValueStrict(Action, action).state;
      return state == ActionState.Complete || state == ActionState.Failed;
    });

  const spawnDisabled = name.length == 0 || stagedShips.length == 0 || registrationClosed;

  const spawn = () => {
    if (stagedShips.length == 0 || name.length == 0) return;
    spawnPlayer(
      name,
      stagedShips.map((ship) => world.entities[ship.entity])
    );
  };

  const onClick = spawning || txFailed ? () => {} : spawn;
  const content = spawning ? "Spawning..." : txFailed ? "Spawn failed! Try again." : "Register";
  const background = txFailed ? colors.red : "auto";

  return (
    <Container style={{ flex }}>
      <Title>Your Fleet</Title>

      <ShipButtons>
        {stagedShips.map((ship) => (
          <ShipButton prototypeEntity={ship.entity} />
        ))}
      </ShipButtons>
      <div style={{ display: "flex", gap: "6px", width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3px",
            textAlign: "left",
            background: colors.lightTan,
            padding: "6px",
            borderRadius: "6px",
            minWidth: "70px",
            flex: 2,
          }}
        >
          <p style={{ lineHeight: "0.75rem", fontSize: ".75rem", color: colors.lightBrown }}>budget</p>
          <Title>
            {moneySpent} / {budget}
          </Title>
        </div>
        <Button
          disabled={spawnDisabled}
          onClick={onClick}
          style={{
            fontSize: "1.5rem",
            width: "100%",
            background: background,
            flex: 3,
          }}
        >
          {content}
        </Button>
      </div>
    </Container>
  );
}

const ShipButtons = styled.div`
  direction: rtl;

  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: 8px;
  width: 100%;
  height: 100%;
  ::-webkit-scrollbar {
    width: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const Title = styled.p`
  font-size: 2.5rem;
  line-height: 3rem;
  text-align: center;
`;
