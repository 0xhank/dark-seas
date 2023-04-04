import { EntityIndex } from "@latticexyz/recs";
import { createContext, ReactNode, useContext } from "react";

const OwnerContext = createContext<EntityIndex | null>(null);

type Props = {
  value: EntityIndex;
  children: ReactNode;
};

export const OwnerProvider = ({ children, value }: Props) => {
  const currentValue = useContext(OwnerContext);
  if (currentValue) throw new Error("MUDProvider can only be used once");
  return <OwnerContext.Provider value={value}>{children}</OwnerContext.Provider>;
};

export const useOwner = (): EntityIndex => {
  const value = useContext(OwnerContext);
  if (!value) throw new Error("Must be used within a MUDProvider");
  return value;
};
