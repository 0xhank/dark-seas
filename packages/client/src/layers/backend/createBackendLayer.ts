import { GodID } from "@latticexyz/network";

import { EntityIndex, namespaceWorld } from "@latticexyz/recs";
import { createActionSystem } from "@latticexyz/std-client";

import { Action, Move } from "../../types";
import { NetworkLayer } from "../network";
import { commitMove } from "./api/commitMove";
import { revealMove } from "./api/revealMove";
import { spawnPlayer } from "./api/spawnPlayer";
import { submitActions } from "./api/submitActions";
import { createBackendComponents } from "./createBackendComponents";
import { createBackendSystems } from "./systems";
import { createBackendUtilities } from "./utilities";
/**
 * The Network layer is the lowest layer in the client architecture.
 * Its purpose is to synchronize the client components with the contract components.
 */
export async function createBackendLayer(network: NetworkLayer) {
  // --- WORLD ----------------------------------------------------------------------
  const world = namespaceWorld(network.world, "backend");

  const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

  // --- COMPONENTS -----------------------------------------------------------------
  const components = createBackendComponents(world);

  // --- SETUP ----------------------------------------------------------------------

  // UTILITIES

  const utils = await createBackendUtilities(network, components, GodEntityIndex);

  // --- SYSTEMS --------------------------------------------------------------
  const actions = createActionSystem(world, network.txReduced$);

  // --- API ------------------------------------------------------------------------
  const api = {
    spawnPlayer: (name: string) => spawnPlayer(network, actions, name),
    commitMove: (moves: Move[]) => commitMove(network, actions, moves),
    revealMove: (encoding: string) => revealMove(network, actions, encoding),
    submitActions: (actionsToSubmit: Action[]) =>
      submitActions(network, actions, utils.getTargetedShips, actionsToSubmit),
  };
  // --- CONTEXT --------------------------------------------------------------------
  const context = {
    world,
    actions,
    api,
    parentLayers: { network },
    utils,
    components,
    godIndex: GodEntityIndex,
  };

  // --- SYSTEMS --------------------------------------------------------------------

  createBackendSystems(context);
  return context;
}
