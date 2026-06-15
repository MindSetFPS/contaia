import { createContext, useContext, useState, type ReactNode } from "react";

type User = {
  id: number;
  email: string;
  name: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = (t: string, u: User) => {
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
