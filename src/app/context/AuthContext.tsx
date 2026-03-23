import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { projectId } from '/utils/supabase/info';

interface User {
  id?: string;
  name: string;
  email?: string;
  isGuest: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loginAsGuest: () => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for guest status first
      const storedGuest = localStorage.getItem("talam_guest_auth");
      if (storedGuest) {
        setIsAuthenticated(true);
        setUser(JSON.parse(storedGuest));
        setIsLoading(false);
        return;
      }

      // Check real Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "User",
          email: session.user.email,
          isGuest: false,
        });
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setIsAuthenticated(true);
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "User",
            email: session.user.email,
            isGuest: false,
          });
          // Remove guest flag if they log in for real
          localStorage.removeItem("talam_guest_auth");
        } else {
          // Only log out if not a guest
          if (!localStorage.getItem("talam_guest_auth")) {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginAsGuest = () => {
    setIsAuthenticated(true);
    const guestUser = { name: "Guest", isGuest: true };
    setUser(guestUser);
    localStorage.setItem("talam_guest_auth", JSON.stringify(guestUser));
  };

  const logout = async () => {
    try {
      if (user?.isGuest) {
        localStorage.removeItem("talam_guest_auth");
      } else {
        await supabase.auth.signOut();
      }
      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  if (isLoading) return null;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loginAsGuest, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
