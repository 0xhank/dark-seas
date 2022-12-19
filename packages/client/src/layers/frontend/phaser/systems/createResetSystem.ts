import { GodID } from "@latticexyz/network";
import {
  defineRxSystem,
  EntityID,
  EntityIndex,
  getComponentValue,
  HasValue,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";
import { Action, Phase } from "../../../types";
import { NetworkLayer } from "../../network";
import { PhaserLayer } from "../types";

export function createResetSystem(network: NetworkLayer, phaser: PhaserLayer) {
  const {
    components: { OwnedBy },
    utils: { getPlayerEntity, getPhase, getGameConfig },
    api: { revealMove, commitMove, submitActions },
    world,
  } = network;

  const {
    components: { SelectedMove, SelectedActions, CommittedMoves },
    scenes: {
      Main: { objectPool },
    },
    polygonRegistry,
    utils: { secondsUntilNextPhase },
  } = phaser;

  defineRxSystem(world, network.network.clock.time$, (currentTime) => {
    const phase = getPhase();
    const gameConfig = getGameConfig();

    if (phase == undefined || gameConfig == undefined) return;

    const secondsUntilPhase = secondsUntilNextPhase(currentTime);
    console.log("reset system: ", secondsUntilPhase, "seconds left");

    const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

    const playerEntity = getPlayerEntity();
    if (!playerEntity) return;

    const yourShips = [...runQuery([HasValue(OwnedBy, { value: world.entities[playerEntity] })])];

    if (phase == Phase.Commit) {
      if (secondsUntilPhase == 5) {
        const shipsAndMoves = yourShips.reduce(
          (prev: { ships: EntityID[]; moves: EntityID[] }, curr: EntityIndex) => {
            const shipMove = getComponentValue(SelectedMove, curr)?.value;
            if (!shipMove) return prev;
            return {
              ships: [...prev.ships, world.entities[curr]],
              moves: [...prev.moves, world.entities[shipMove]],
            };
          },
          { ships: [], moves: [] }
        );
        if (shipsAndMoves.ships.length != 0) {
          const encodedMove = abi.encode(
            ["uint256[]", "uint256[]", "uint256"],
            [shipsAndMoves.ships, shipsAndMoves.moves, 0]
          );
          commitMove(encodedMove);
          setComponent(CommittedMoves, GodEntityIndex, { value: encodedMove });
        }
      }
      if (secondsUntilPhase !== gameConfig.commitPhaseLength - 1) return;
      yourShips.map((ship) => {
        removeComponent(SelectedMove, ship);
      });
    }

    if (phase == Phase.Reveal) {
      if (secondsUntilPhase !== gameConfig.revealPhaseLength - 5) return;
      const encoding = getComponentValue(CommittedMoves, GodEntityIndex)?.value;
      if (encoding) revealMove(encoding);
    }

    if (phase == Phase.Action) {
      if (secondsUntilPhase == 5) {
        const shipsAndActions = yourShips.reduce(
          (prev: { ships: EntityID[]; actions: Action[][] }, curr: EntityIndex) => {
            const actions = getComponentValue(SelectedActions, curr)?.value;
            if (!actions) return prev;
            const filteredActions = actions.filter((action) => action !== -1);
            return {
              ships: [...prev.ships, world.entities[curr]],
              actions: [...prev.actions, filteredActions],
            };
          },
          { ships: [], actions: [] }
        );
        if (shipsAndActions.ships.length == 0) return;
        submitActions(shipsAndActions.ships, shipsAndActions.actions);
      }
      if (secondsUntilPhase !== gameConfig.actionPhaseLength - 1) return;
      removeComponent(CommittedMoves, GodEntityIndex);
      yourShips.map((ship) => {
        objectPool.remove(`projection-${ship}`);
        polygonRegistry.get(`rangeGroup-${ship}`)?.clear(true, true);
        removeComponent(SelectedActions, ship);
      });
    }
  });
}