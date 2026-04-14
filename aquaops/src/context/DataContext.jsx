import { createContext, useContext } from "react";
import { useAppData } from "../hooks/useLocalData";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const data = useAppData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
