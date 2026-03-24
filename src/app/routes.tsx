import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { Home } from "./pages/Home";

// Lazy-loaded route components for code splitting and faster initial load
const Browse = lazy(() => import("./pages/Browse").then(m => ({ default: m.Browse })));
const Radio = lazy(() => import("./pages/Radio").then(m => ({ default: m.Radio })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));

// Minimal loading fallback
const RouteLoader = () => null;

const LazyRoute = ({ Component }: { Component: React.LazyExoticComponent<() => JSX.Element> }) => (
  <Suspense fallback={<RouteLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "browse", Component: () => <LazyRoute Component={Browse} /> },
      { path: "radio", Component: () => <LazyRoute Component={Radio} /> },
      { path: "settings", Component: () => <LazyRoute Component={Settings} /> },
    ],
  },
]);
