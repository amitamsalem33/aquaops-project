import { createContext, useContext, useState } from "react";
import { users as initialUsers } from "../data/mockData";

const AuthContext = createContext(null);

function getUsers() {
  try {
    const saved = localStorage.getItem("aquaops_users");
    return saved ? JSON.parse(saved) : initialUsers;
  } catch {
    return initialUsers;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("aquaops_user");
    return saved ? JSON.parse(saved) : null;
  });

  function login(username, password) {
    const users = getUsers();
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
