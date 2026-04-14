import { createContext, useContext } from "react";
import { useAppData } from "../hooks/useSupabaseData";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const data = useAppData();

  if (data.loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        color: "white",
        fontFamily: "Segoe UI, Arial, sans-serif",
        direction: "rtl",
        gap: "20px",
      }}>
        <div style={{
          width: "60px",
          height: "60px",
          border: "4px solid rgba(255,255,255,0.2)",
          borderTopColor: "#4fc3f7",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: "1.3rem", fontWeight: "600" }}>AquaOps</div>
        <div style={{ fontSize: "0.95rem", opacity: 0.7 }}>מתחבר למערכת...</div>
      </div>
    );
  }

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
