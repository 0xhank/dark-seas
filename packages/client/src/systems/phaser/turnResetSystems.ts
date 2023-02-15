import { defineRxSystem, EntityIndex, getComponentEntities, getComponentValue } from "@latticexyz/recs";
import { SetupResult } from "../../setupMUD";
import { Phase } from "../../types";

export function turnResetSystems(MUD: SetupResult) {
  const {
    world,
    godEntity,
    components: {
      SelectedMove,
      SelectedActions,
      EncodedCommitment,
      CommittedMove,
      HoveredMove,
      HoveredAction,
      Targeted,
      ExecutedActions,
      ExecutedCannon,
      LastMove,
      LastAction,
      MoveCard,
      SelectedShip,
    },
    api: { commitMove, revealMove, submitActions },
    network: { clock },
    utils: {
      destroySpriteObject,
      destroyGroupObject,
      getPlayerEntity,
      getPhase,
      getGameConfig,
      getTurn,
      secondsUntilNextPhase,
      getPlayerShipsWithMoves,
      getPlayerShipsWithActions,
      getPlayerShips,
      renderShipFiringAreas,
      clearComponent,
    },
  } = MUD;

  defineRxSystem(world, clock.time$, () => {
    const phase = getPhase(clock.currentTime);
    const turn = getTurn(clock.currentTime);
    const gameConfig = getGameConfig();

    if (phase == undefined || !gameConfig) return;

    const timeToNextPhase = secondsUntilNextPhase(clock.currentTime);

    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;

    // START OF PHASE: clear previous turn's actions
    // END OF PHASE: submit moves
    if (phase == Phase.Commit) {
      // START OF PHASE
      if (timeToNextPhase == gameConfig.commitPhaseLength) {
        getPlayerShips()?.map((ship) => {
          destroySpriteObject(`projection-${ship}`);
          destroyGroupObject(`projection-${ship}`);
        });
        destroyGroupObject("activeShip");
        destroyGroupObject("hoveredFiringArea");
        clearComponent(SelectedActions);
        clearComponent(HoveredAction);
        clearComponent(ExecutedActions);
        clearComponent(ExecutedCannon);
        clearComponent(Targeted);
      }
    }

    // START OF PHASE: reveal moves
    // note: contract-side this occurs during the commit phase
    if (phase == Phase.Reveal) {
      if (timeToNextPhase == gameConfig.revealPhaseLength) {
        //cleanup
        [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
          const objectId = `optionGhost-${moveCardEntity}`;
          destroySpriteObject(objectId);
        });

        destroyGroupObject("activeShip");
        destroySpriteObject("hoverGhost");
        //commit move
        const encodedCommitment = getComponentValue(EncodedCommitment, godEntity)?.value;
        if (encodedCommitment) return;
        const shipsAndMoves = getPlayerShipsWithMoves();
        if (!shipsAndMoves) return;
        commitMove(shipsAndMoves);
      }

      if (timeToNextPhase == gameConfig.revealPhaseLength - 3) {
        const encoding = getComponentValue(EncodedCommitment, godEntity)?.value;
        if (encoding) revealMove(encoding);
      }
    }

    // START OF PHASE: clear move commitments
    // END OF PHASE: submit actions
    if (phase == Phase.Action) {
      // START OF PHASE
      if (timeToNextPhase == gameConfig.actionPhaseLength) {
        clearComponent(EncodedCommitment);
        clearComponent(CommittedMove);
        clearComponent(SelectedMove);
        const selectedShip = getComponentValue(SelectedShip, godEntity)?.value as EntityIndex | undefined;
        if (selectedShip) renderShipFiringAreas(selectedShip, "activeShip");
      }
      // END OF PHASE
      if (timeToNextPhase == 1) {
        const lastAction = getComponentValue(LastAction, playerEntity)?.value;
        if (lastAction == turn) return;
        const shipsAndActions = getPlayerShipsWithActions();

        if (shipsAndActions) submitActions(shipsAndActions);
      }
    }
  });
}
