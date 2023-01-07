import { Layers } from "@latticexyz/recs";
import React from "react";
import { EngineStore } from "./store";

export const LayerContext = React.createContext<Layers>({} as Layers);
export const EngineContext = React.createContext<typeof EngineStore>(EngineStore);
