import { createContext, ReactNode, useContext } from "react";
import { gameLayer } from "../../game/phaser";

const PhaserContext = createContext<gameLayer | null>(null);

type Props = gameLayer & {
  children: ReactNode;
};

export const GameProvider = ({ children, ...value }: Props) => {
  const currentValue = useContext(PhaserContext);
  if (currentValue) throw new Error("GameProvider can only be used once");
  return <PhaserContext.Provider value={value}>{children}</PhaserContext.Provider>;
};

export const useGame = (): gameLayer => {
  const value = useContext(PhaserContext);
  if (!value) throw new Error("Must be used within a GameProvider");
  return value;
};
