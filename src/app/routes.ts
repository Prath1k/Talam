import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Home } from "./pages/Home";
import { Browse } from "./pages/Browse";
import { Radio } from "./pages/Radio";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "browse", Component: Browse },
      { path: "radio", Component: Radio },
      { path: "settings", Component: Settings },
      { path: "library/:type", Component: Browse }, // Fallback to Browse for unbuilt library sections
    ],
  },
]);
