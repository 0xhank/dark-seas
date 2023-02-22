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
    utils: { decodeShipPrototype },
    api: { spawnPlayer },
    godEntity,
  } = useMUD();

  useObservableValue(merge(ShipPrototype.update$, SelectedShip.update$, Action.update$));

  const name = useComponentValue(Name, godEntity, { value: "" }).value;
  const stagedShips = useComponentValue(StagedShips, godEntity, { value: [] }).value.map((ship) => ({
    entity: ship as EntityIndex,
    ...decodeShipPrototype(ship as EntityIndex),
  }));
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

  let button = (
    <Button
      disabled={spawnDisabled}
      style={{
        fontSize: "1.5rem",
        flex: 1,
      }}
      onClick={spawn}
    >
      Register
    </Button>
  );
  if (spawning) {
    button = (
      <Button
        disabled
        style={{
          fontSize: "1.5rem",
          flex: 1,
        }}
      >
        Spawning...
      </Button>
    );
  } else if (txFailed) {
    button = (
      <Button
        disabled={spawnDisabled}
        onClick={spawn}
        style={{
          fontSize: "1.5rem",
          flex: 1,
          background: colors.red,
        }}
      >
        Spawn failed! Try again.
      </Button>
    );
  }
  return (
    <Container style={{ flex }}>
      <Title>Your Fleet</Title>
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", width: "100%", flexDirection: "column" }}>
          {stagedShips.map((ship) => (
            <ShipButton prototypeEntity={ship.entity} />
          ))}
        </div>
        <div style={{ maxHeight: "100px" }}>{button}</div>
      </div>
    </Container>
  );
}

const Title = styled.p`
  font-size: 3rem;
  line-height: 4rem;
`;
