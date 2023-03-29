import { createContext, ReactNode, useContext } from "react";
import { NetworkLayer } from "..";

const HomeContext = createContext<NetworkLayer | null>(null);

type Props = NetworkLayer & {
  children: ReactNode;
};

export const HomeProvider = ({ children, ...value }: Props) => {
  const currentValue = useContext(HomeContext);
  if (currentValue) throw new Error("GameProvider can only be used once");
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
};

export const useHome = (): NetworkLayer => {
  const value = useContext(HomeContext);
  if (!value) throw new Error("Must be used within a GameProvider");
  return value;
};
