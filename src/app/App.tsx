import { RouterProvider } from "react-router";
import { router } from "./routes";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Auth } from "./pages/Auth";

function MainApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <PlayerProvider>
      <RouterProvider router={router} />
    </PlayerProvider>
  );
}

// Main App Entry Point
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
