import { createContext, useContext, useState } from "react";
import { users } from "../data/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("aquaops_user");
    return saved ? JSON.parse(saved) : null;
  });

  function login(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 3600000 }));
      const userWithToken = { ...user, token };
      localStorage.setItem("aquaops_user", JSON.stringify(userWithToken));
      setCurrentUser(userWithToken);
      return { success: true, user: userWithToken };
    }
    return { success: false, error: "שם משתמש או סיסמה שגויים" };
  }

  function logout() {
    localStorage.removeItem("aquaops_user");
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
