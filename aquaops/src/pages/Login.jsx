import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleRoutes = {
  admin: "/admin",
  collector: "/collector",
  meter_reader: "/meter",
  technician: "/technician",
};

const demoUsers = [
  { label: "מנהל", username: "manager1", role: "admin" },
  { label: "גובה חובות", username: "collector1", role: "collector" },
  { label: "קורא מונים", username: "meter1", role: "meter_reader" },
  { label: "טכנאי", username: "tech1", role: "technician" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const result = login(username, password);
      if (result.success) {
        navigate(roleRoutes[result.user.role] || "/");
      } else {
        setError(result.error);
      }
      setLoading(false);
    }, 500);
  }

  function fillDemo(u) {
    setUsername(u.username);
    setPassword("1234");
    setError("");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">💧</div>
          <h1>AquaOps</h1>
          <p>מערכת ניהול שטח לחברות מים</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="הזן שם משתמש"
              required
            />
          </div>
          <div className="form-group">
            <label>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="הזן סיסמה"
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>

        <div className="demo-section">
          <p className="demo-title">כניסה מהירה לדמו:</p>
          <div className="demo-buttons">
            {demoUsers.map(u => (
              <button key={u.username} className={`demo-btn role-${u.role}`} onClick={() => fillDemo(u)}>
                {u.label}
              </button>
            ))}
          </div>
          <p className="demo-hint">סיסמה לכולם: <strong>1234</strong></p>
        </div>
      </div>
    </div>
  );
}
