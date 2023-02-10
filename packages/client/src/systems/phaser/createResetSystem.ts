import { defineRxSystem, getComponentEntities, getComponentValue } from "@latticexyz/recs";
import { SetupResult } from "../../setupMUD";
import { DELAY, Phase } from "../../types";

export function createResetSystem(MUD: SetupResult) {
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
      clearComponent,
    },
  } = MUD;

  defineRxSystem(world, clock.time$, () => {
    const phase = getPhase(DELAY);
    const turn = getTurn(DELAY);
    const gameConfig = getGameConfig();

    if (phase == undefined || !gameConfig) return;

    const timeToNextPhase = secondsUntilNextPhase(DELAY);

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
        destroyGroupObject("selectedActions");
        destroyGroupObject("hoveredFiringArea");
        clearComponent(SelectedActions);
        clearComponent(HoveredAction);
        clearComponent(ExecutedActions);
        clearComponent(ExecutedCannon);
        clearComponent(Targeted);
      }

      // END OF PHASE
      if (timeToNextPhase == 1) {
        const encodedCommitment = getComponentValue(EncodedCommitment, godEntity)?.value;
        if (encodedCommitment) return;
        const shipsAndMoves = getPlayerShipsWithMoves();
        if (!shipsAndMoves) return;
        commitMove(shipsAndMoves);
      }
    }

    // START OF PHASE: reveal moves
    // note: contract-side this occurs during the commit phase
    if (phase == Phase.Reveal) {
      if (timeToNextPhase == gameConfig.revealPhaseLength - 3) {
        const encoding = getComponentValue(EncodedCommitment, godEntity)?.value;
        if (encoding) revealMove(encoding);
      }
      if (timeToNextPhase !== gameConfig.revealPhaseLength) return;

      [...getComponentEntities(MoveCard)].forEach((moveCardEntity) => {
        const objectId = `optionGhost-${moveCardEntity}`;
        destroySpriteObject(objectId);
      });
      const lastMove = getComponentValue(LastMove, playerEntity)?.value;
      if (lastMove == turn) return;

      // clear projected ship
      const hoveredShip = getComponentValue(HoveredMove, godEntity)?.shipEntity;
      if (hoveredShip) {
        const hoverId = `hoverGhost-${hoveredShip}`;

        destroySpriteObject(hoverId);
        destroyGroupObject(hoverId);
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
