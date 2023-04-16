import { defineRxSystem, EntityIndex, getComponentEntities, getComponentValue } from "@latticexyz/recs";
import { Phase, SetupResult } from "../types";

export function turnResetSystems(MUD: SetupResult) {
  const {
    world,
    gameEntity,
    components: {
      SelectedMove,
      SelectedActions,
      EncodedCommitment,
      CommittedMove,
      HoveredAction,
      Targeted,
      ExecutedActions,
      ExecutedCannon,
      LastAction,
      MoveCard,
      SelectedShip,
    },
    api: { commitMove, revealMove, submitActions },
    network: { clock },
    utils: {
      destroySpriteObject,
      destroyGroupObject,
      getOwnerEntity,
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
      getTargetedShips,
    },
  } = MUD;

  defineRxSystem(world, clock.time$, (time) => {
    const phase = getPhase(time);
    const turn = getTurn(time);
    const gameConfig = getGameConfig();

    if (phase == undefined || !gameConfig) return;

    const timeToNextPhase = secondsUntilNextPhase(time);

    const ownerEntity = getOwnerEntity();
    if (!ownerEntity) return;

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
        const encodedCommitment = getComponentValue(EncodedCommitment, gameEntity)?.value;
        if (encodedCommitment) return;
        const shipsAndMoves = getPlayerShipsWithMoves();
        if (!shipsAndMoves) return;
        commitMove(gameEntity, shipsAndMoves);
      }

      if (timeToNextPhase == gameConfig.revealPhaseLength - 3) {
        const encoding = getComponentValue(EncodedCommitment, gameEntity)?.value;
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
        const selectedShip = getComponentValue(SelectedShip, gameEntity)?.value as EntityIndex | undefined;
        if (selectedShip) renderShipFiringAreas(selectedShip, "activeShip");
      }
      // END OF PHASE
      if (timeToNextPhase == 1) {
        const playerEntity = getPlayerEntity(ownerEntity);
        if (!playerEntity) return;
        const lastAction = getComponentValue(LastAction, playerEntity)?.value;
        if (lastAction == turn) return;
        const shipsAndActions = getPlayerShipsWithActions();

        if (shipsAndActions) submitActions(gameEntity, shipsAndActions, getTargetedShips);
      }
    }
  });
}
