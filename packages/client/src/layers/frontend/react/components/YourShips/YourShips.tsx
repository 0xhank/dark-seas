import { GodID } from "@latticexyz/network";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  removeComponent,
  runQuery,
} from "@latticexyz/recs";
import { ActionState } from "@latticexyz/std-client";
import { map, merge } from "rxjs";
import styled from "styled-components";
import { Phase } from "../../../../../types";
import { DELAY } from "../../../constants";
import { registerUIComponent } from "../../engine";
import { Button, colors, ConfirmButton, Container, InternalContainer } from "../../styles/global";
import { YourShip } from "./YourShip";

export function registerYourShips() {
  registerUIComponent(
    // name
    "YourShips",
    // grid location
    {
      rowStart: 9,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: {
            Rotation,
            MoveCard,
            SailPosition,
            Position,
            Player,
            Health,
            CrewCount,
            DamagedMast,
            Firepower,
            Leak,
            OnFire,
            Ship,
            OwnedBy,
            LastMove,
            LastAction,
          },
          network: { connectedAddress, clock },
          utils: { getPlayerEntity, getPhase, getTurn },
        },
        backend: {
          actions: { Action },
          components: { SelectedShip, SelectedMove, SelectedActions, CommittedMoves },
          api: { commitMove, revealMove, submitActions },
          utils: { getPlayerShipsWithMoves, getPlayerShipsWithActions },
        },
      } = layers;

      return merge(
        clock.time$,
        MoveCard.update$,
        SelectedMove.update$,
        SelectedShip.update$,
        Rotation.update$,
        SailPosition.update$,
        Position.update$,
        Player.update$,
        Health.update$,
        CrewCount.update$,
        DamagedMast.update$,
        Firepower.update$,
        Leak.update$,
        OnFire.update$,
        Ship.update$,
        SelectedActions.update$,
        OwnedBy.update$,
        LastMove.update$,
        LastAction.update$,
        CommittedMoves.update$,
        Action.update$
      ).pipe(
        map(() => {
          return {
            layers,
            Position,
            SelectedMove,
            MoveCard,
            Rotation,
            SelectedShip,
            SailPosition,
            Player,
            Ship,
            Health,
            CrewCount,
            Firepower,
            Leak,
            OnFire,
            DamagedMast,
            SelectedActions,
            OwnedBy,
            LastMove,
            LastAction,
            CommittedMoves,
            Action,
            world,
            connectedAddress,
            revealMove,
            getPlayerEntity,
            getPhase,
            submitActions,
            getTurn,
            commitMove,
            getPlayerShipsWithMoves,
            getPlayerShipsWithActions,
          };
        })
      );
    },
    // render
    (props) => {
      const {
        layers,
        SelectedMove,
        SelectedShip,
        Ship,
        Player,
        OwnedBy,
        SelectedActions,
        LastMove,
        LastAction,
        CommittedMoves,
        Action,
        world,
        connectedAddress,
        getPlayerEntity,
        getPhase,
        revealMove,
        submitActions,
        getTurn,
        commitMove,
        getPlayerShipsWithMoves,
        getPlayerShipsWithActions,
      } = props;

      const phase: Phase | undefined = getPhase(DELAY);
      const currentTurn = getTurn();

      if (phase == undefined || currentTurn == undefined) return null;

      const playerEntity = getPlayerEntity(connectedAddress.get());
      if (!playerEntity || !getComponentValue(Player, playerEntity)) return null;

      const lastMove = getComponentValue(LastMove, playerEntity)?.value;
      const lastAction = getComponentValue(LastAction, playerEntity)?.value;

      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const selectedShip = getComponentValue(SelectedShip, GodEntityIndex)?.value as EntityIndex | undefined;

      const yourShips = [...runQuery([Has(Ship), HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

      const selectedMoves = [...getComponentEntities(SelectedMove)];
      const selectedActions = [...getComponentEntities(SelectedActions)].map(
        (entity) => getComponentValue(SelectedActions, entity)?.value
      );

      const disabled =
        phase == Phase.Commit
          ? selectedMoves.length == 0
          : selectedActions.length == 0 || selectedActions?.every((arr) => arr?.every((elem) => elem == -1));

      const handleSubmitActions = () => {
        const shipsAndActions = getPlayerShipsWithActions();
        if (!shipsAndActions) return;
        submitActions(shipsAndActions.ships, shipsAndActions.actions);
      };

      const handleSubmitCommitment = () => {
        const shipsAndMoves = getPlayerShipsWithMoves();
        if (!shipsAndMoves) return;
        commitMove(shipsAndMoves.ships, shipsAndMoves.moves);
      };

      const handleSubmitExecute = () => {
        const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
        if (encoding) revealMove(encoding);
      };

      const RevealButtons = () => {
        const committedMoves = getComponentValue(CommittedMoves, GodEntityIndex)?.value;

        if (lastMove == currentTurn) return <Success background={colors.confirmed}>Move execution successful!</Success>;
        if (!committedMoves) return <Success background={colors.glass}>"No moves to execute"</Success>;
        return (
          <ConfirmButton style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }} onClick={handleSubmitExecute}>
            Execute Moves
          </ConfirmButton>
        );
      };

      const CommitButtons = () => {
        const committedMoves = getComponentValue(CommittedMoves, GodEntityIndex)?.value;

        const msg = committedMoves ? "Update Prepared Moves" : "Confirm Prepared Moves";
        return (
          <>
            <ConfirmButton
              disabled={disabled}
              style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
              onClick={handleSubmitCommitment}
            >
              {msg}
            </ConfirmButton>
            <Button
              disabled={disabled}
              noGoldBorder
              onClick={() => {
                yourShips.map((entity) => removeComponent(SelectedMove, entity));
                removeComponent(SelectedShip, GodEntityIndex);
              }}
              style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
            >
              Clear
            </Button>
          </>
        );
      };

      const ActionButtons = () => {
        if (lastAction == currentTurn) {
          return <Success background="hsla(120, 100%, 50%, .5)">Actions Successful</Success>;
        } else {
          return (
            <>
              <ConfirmButton
                disabled={disabled}
                style={{ flex: 3, fontSize: "1rem", lineHeight: "1.25rem" }}
                onClick={handleSubmitActions}
              >
                Submit Actions
              </ConfirmButton>
              <Button
                disabled={disabled}
                noGoldBorder
                onClick={() => {
                  yourShips.map((entity) => removeComponent(SelectedActions, entity));
                  removeComponent(SelectedShip, GodEntityIndex);
                }}
                style={{ flex: 2, fontSize: "1rem", lineHeight: "1.25rem" }}
              >
                Clear
              </Button>
            </>
          );
        }
      };

      const ConfirmButtons = () => {
        let content: JSX.Element | null = null;
        const actionExecuting = !![...runQuery([Has(Action)])].find((entity) => {
          const state = getComponentValueStrict(Action, entity).state;
          return [ActionState.Requested, ActionState.Executing, ActionState.WaitingForTxEvents].includes(state);
        });
        if (actionExecuting) content = <Success background={colors.waiting}>Executing...</Success>;
        else if (phase == Phase.Reveal) content = <RevealButtons />;
        else if (phase == Phase.Commit) content = <CommitButtons />;
        else if (phase == Phase.Action) content = <ActionButtons />;

        return <ConfirmButtonsContainer>{content}</ConfirmButtonsContainer>;
      };

      const helpMessage =
        phase == Phase.Commit
          ? "Submit one move per ship"
          : phase == Phase.Action
          ? "Select up to two actions per ship"
          : "Execute selected moves";
      return (
        <Container style={{ justifyContent: "flex-end" }}>
          <InternalContainer
            style={{ height: "auto", flexDirection: "column", justifyContent: "space-between", gap: "12px" }}
          >
            <Instructions> {helpMessage}</Instructions>
            <InternalContainer style={{ gap: "24px", padding: "0", background: "transparent" }}>
              <MoveButtons>
                {yourShips.map((ship) => (
                  <YourShip
                    key={`ship-${ship}`}
                    layers={layers}
                    ship={ship}
                    selectedShip={selectedShip}
                    phase={phase}
                  />
                ))}
              </MoveButtons>
              <ConfirmButtons />
            </InternalContainer>
          </InternalContainer>
        </Container>
      );
    }
  );
}

const Success = styled.div<{ background: string }>`
  background: ${({ background }) => background};
  color: ${colors.white};
  border-radius: 6px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const MoveButtons = styled.div`
  flex: 5;
  display: flex;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  max-width: 90%;
`;

const ConfirmButtonsContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
`;

const Instructions = styled.div`
  font-size: 1.25rem;
  line-height: 1.25rem;
  text-align: left;
`;
