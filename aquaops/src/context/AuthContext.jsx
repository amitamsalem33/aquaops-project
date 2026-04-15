import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { users as fallbackUsers } from "../data/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem("aquaops_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState(fallbackUsers);

  // Load users from Supabase on mount
  useEffect(() => {
    supabase
      .from("users")
      .select("data")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setUsers(data.map((row) => row.data));
        }
      });
  }, []);

  function login(username, password) {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      const token = btoa(
        JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 3600000 })
      );
      const userWithToken = { ...user, token };
      sessionStorage.setItem("aquaops_user", JSON.stringify(userWithToken));
      setCurrentUser(userWithToken);
      return { success: true, user: userWithToken };
    }
    return { success: false, error: "שם משתמש או סיסמה שגויים" };
  }

  function logout() {
    sessionStorage.removeItem("aquaops_user");
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
