import { createContext, ReactNode, useContext } from "react";
import { PhaserLayer } from "../../game/phaser";

const PhaserContext = createContext<PhaserLayer | null>(null);

type Props = PhaserLayer & {
  children: ReactNode;
};

export const PhaserProvider = ({ children, ...value }: Props) => {
  const currentValue = useContext(PhaserContext);
  if (currentValue) throw new Error("PhaserProvider can only be used once");
  return <PhaserContext.Provider value={value}>{children}</PhaserContext.Provider>;
};

export const usePhaser = (): PhaserLayer => {
  const value = useContext(PhaserContext);
  if (!value) throw new Error("Must be used within a PhaserProvider");
  return value;
};
