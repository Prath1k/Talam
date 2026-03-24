import { Home, LayoutGrid, Radio, Settings as SettingsIcon, Mic } from "lucide-react";
import clsx from "clsx";

import { NavLink } from "react-router";

const navItems = [
  { icon: Home, label: "Listen Now", path: "/" },
  { icon: LayoutGrid, label: "Browse", path: "/browse" },
  { icon: Radio, label: "Radio", path: "/radio" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  return (
    <div className="hidden md:flex w-64 h-full flex-col bg-white/40 dark:bg-black/40 backdrop-blur-3xl border-r border-zinc-200/50 dark:border-zinc-800/50 pt-8 pb-4 flex-shrink-0 z-20">
      <div className="px-6 mb-8 flex items-center gap-2 text-rose-500 font-bold text-xl tracking-tight">
        <Mic className="w-6 h-6" />
        <span>Talam</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-8">
        <div>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => clsx(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-black/5 dark:bg-white/10 text-rose-500"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
