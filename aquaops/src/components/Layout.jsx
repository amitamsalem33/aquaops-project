import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const roleLabels = {
  admin: "מנהל משרד",
  collector: "גובה חובות",
  meter_reader: "קורא מונים",
  technician: "טכנאי",
};

const roleColors = {
  admin: "#1e40af",
  collector: "#065f46",
  meter_reader: "#92400e",
  technician: "#6b21a8",
};

export default function Layout({ children, title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-layout" dir="rtl">
      <header className="app-header" style={{ background: roleColors[currentUser?.role] }}>
        <div className="header-content">
          <div className="header-left">
            <span className="header-logo">💧 AquaOps</span>
            <span className="header-title">{title}</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-role">{roleLabels[currentUser?.role]}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>יציאה</button>
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
