import { Outlet, NavLink } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Controls } from "../components/Controls";
import { usePlayer } from "../context/PlayerContext";
import { Home as HomeIcon, LayoutGrid, Radio as RadioIcon, Settings as SettingsIcon } from "lucide-react";
import clsx from "clsx";

export function RootLayout() {
  const { currentTrack, isPlaying, progress, handlePlayPause, handleNext, handlePrev } = usePlayer();

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-50 relative selection:bg-rose-500/30">
      
      {/* Blurred background corresponding to the current album cover */}
      <div className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out scale-110 blur-[100px] opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen">
         <img 
           src={currentTrack.coverUrl} 
           alt="Background blur" 
           className="w-full h-full object-cover"
         />
      </div>

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 z-10 relative shadow-[inset_1px_0_0_rgba(0,0,0,0.1)]">
        {/* Main Content Area via Router */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </div>

        {/* Fixed Bottom Controls */}
        <Controls 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
        />

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex items-center justify-around bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 pb-4 pt-2 px-2 h-[4.5rem] shrink-0 z-40">
          {[
            { icon: HomeIcon, label: "Listen", path: "/" },
            { icon: LayoutGrid, label: "Browse", path: "/browse" },
            { icon: RadioIcon, label: "Radio", path: "/radio" },
            { icon: SettingsIcon, label: "Settings", path: "/settings" },
          ].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-rose-500" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </main>
    </div>
  );
}
