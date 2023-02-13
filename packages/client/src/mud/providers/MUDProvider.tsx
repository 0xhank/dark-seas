import { createContext, ReactNode, useContext } from "react";
import { SetupResult } from "../../setupMUD";

const MUDContext = createContext<SetupResult | null>(null);

type Props = SetupResult & {
  children: ReactNode;
};

export const MUDProvider = ({ children, ...value }: Props) => {
  const currentValue = useContext(MUDContext);
  if (currentValue) throw new Error("MUDProvider can only be used once");
  return <MUDContext.Provider value={value}>{children}</MUDContext.Provider>;
};

export const useMUD = (): SetupResult => {
  const value = useContext(MUDContext);
  if (!value) throw new Error("Must be used within a MUDProvider");
  return value;
};
