import { createPhaserLayer } from "./createPhaserLayer";

export { createPhaserLayer };
export type PhaserLayer = Awaited<ReturnType<typeof createPhaserLayer>>;
