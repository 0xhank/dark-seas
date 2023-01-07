import { createBackendLayer } from "./createBackendLayer";

export type BackendLayer = Awaited<ReturnType<typeof createBackendLayer>>;

export enum TxType {
  Action,
  Commit,
  Reveal,
}
