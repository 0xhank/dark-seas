import { boot } from "./boot";
import { NetworkLayer } from "./layers/network";
import { PhaserLayer } from "./layers/phaser";

export type DSWindow = Awaited<ReturnType<typeof boot>>;

export type Layers = { network: NetworkLayer; phaser: PhaserLayer };
