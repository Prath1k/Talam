import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { name: string; isGuest: boolean } | null;
  login: (name: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; isGuest: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("talam_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsAuthenticated(true);
        setUser(parsed);
      } catch (e) {
        // invalid JSON
      }
    }
    setIsLoading(false);
  }, []);

  const login = (name: string) => {
    setIsAuthenticated(true);
    const userData = { name, isGuest: false };
    setUser(userData);
    localStorage.setItem("talam_auth", JSON.stringify(userData));
  };

  const loginAsGuest = () => {
    setIsAuthenticated(true);
    const userData = { name: "Guest", isGuest: true };
    setUser(userData);
    localStorage.setItem("talam_auth", JSON.stringify(userData));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("talam_auth");
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
