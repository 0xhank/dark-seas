import { EntityIndex } from "@latticexyz/recs";
import { createContext, ReactNode, useContext } from "react";

const PlayerContext = createContext<EntityIndex | null>(null);

type Props = {
  value: EntityIndex;
  children: ReactNode;
};

export const PlayerProvider = ({ children, value }: Props) => {
  const currentValue = useContext(PlayerContext);
  if (currentValue) throw new Error("MUDProvider can only be used once");
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): EntityIndex => {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("Must be used within a MUDProvider");
  return value;
};
