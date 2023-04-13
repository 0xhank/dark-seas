import { createGameLayer } from "./createGameLayer";

export { createGameLayer };
export type gameLayer = Awaited<ReturnType<typeof createGameLayer>>;
