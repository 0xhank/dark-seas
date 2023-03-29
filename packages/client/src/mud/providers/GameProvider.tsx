import { createContext, ReactNode, useContext } from "react";
import { SetupResult } from "../../game/types";

const GameContext = createContext<SetupResult | null>(null);

type Props = SetupResult & {
  children: ReactNode;
};

export const GameProvider = ({ children, ...value }: Props) => {
  const currentValue = useContext(GameContext);
  if (currentValue) throw new Error("GameProvider can only be used once");
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): SetupResult => {
  const value = useContext(GameContext);
  if (!value) throw new Error("Must be used within a GameProvider");
  return value;
};
