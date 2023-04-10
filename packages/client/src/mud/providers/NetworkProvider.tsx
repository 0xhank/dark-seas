import { createContext, ReactNode, useContext } from "react";
import { NetworkLayer } from "..";

const NetworkContext = createContext<NetworkLayer | null>(null);

type Props = NetworkLayer & {
  children: ReactNode;
};

export const NetworkProvider = ({ children, ...value }: Props) => {
  const currentValue = useContext(NetworkContext);
  if (currentValue) throw new Error("NetworkProvider can only be used once");
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkLayer => {
  const value = useContext(NetworkContext);
  if (!value) throw new Error("Must be used within a NetworkProvider");
  return value;
};
