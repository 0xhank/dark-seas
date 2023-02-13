import { SetupResult } from "../../setupMUD";
import { borderSystems } from "./borderSystems";
import { cannonFireSystems } from "./cannonFireSystems";
import { firingAreaSystems } from "./firingAreaSystems";
import { inputSystems } from "./inputSystems";
import { localHealthSystems } from "./localHealthSystems";
import { moveOptionsSystems } from "./moveOptionsSystems";
import { shipCircleSystems } from "./shipCircleSystems";
import { shipTextureSystems } from "./shipTextureSystems";
import { stagedMoveSystems } from "./stagedMoveSystems";
import { statAnimationSystems } from "./statAnimationSystems";
import { targetedShipSystems } from "./targetedShipSystems";
import { tilemapSystems } from "./tilemapSystems";
import { turnResetSystems } from "./turnResetSystems";

export function createPhaserSystems(MUD: SetupResult) {
  borderSystems(MUD);
  cannonFireSystems(MUD);
  firingAreaSystems(MUD);
  inputSystems(MUD);
  localHealthSystems(MUD);
  moveOptionsSystems(MUD);
  shipCircleSystems(MUD);
  shipTextureSystems(MUD);
  stagedMoveSystems(MUD);
  statAnimationSystems(MUD);
  targetedShipSystems(MUD);
  tilemapSystems(MUD);
  turnResetSystems(MUD);
}
