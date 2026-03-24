import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import CollectorPanel from "./pages/CollectorPanel";
import MeterReaderPanel from "./pages/MeterReaderPanel";
import TechnicianPanel from "./pages/TechnicianPanel";
import "./App.css";

const roleRoutes = {
  admin: "/admin",
  collector: "/collector",
  meter_reader: "/meter",
  technician: "/technician",
};

function ProtectedRoute({ children, allowedRole }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={roleRoutes[currentUser.role] || "/login"} />;
  }
  return children;
}

function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return <Navigate to={roleRoutes[currentUser.role] || "/login"} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminPanel /></ProtectedRoute>} />
      <Route path="/collector" element={<ProtectedRoute allowedRole="collector"><CollectorPanel /></ProtectedRoute>} />
      <Route path="/meter" element={<ProtectedRoute allowedRole="meter_reader"><MeterReaderPanel /></ProtectedRoute>} />
      <Route path="/technician" element={<ProtectedRoute allowedRole="technician"><TechnicianPanel /></ProtectedRoute>} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
