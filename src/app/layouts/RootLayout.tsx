import { Outlet, NavLink, useLocation } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Controls } from "../components/Controls";
import { usePlayer } from "../context/PlayerContext";
import { Home as HomeIcon, LayoutGrid, Radio as RadioIcon, Settings as SettingsIcon } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";

export function RootLayout() {
  const { 
    currentTrack, isPlaying, progress, duration, volume, 
    handlePlayPause, handleNext, handlePrev, handleSeek, 
    handleVolumeChange, toggleLyrics, showLyrics,
    isShuffle, repeatMode, handleToggleShuffle, handleToggleRepeat, handleToggleFavourite 
  } = usePlayer();
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-50 relative selection:bg-rose-500/30">
      
      {/* Blurred background corresponding to the current album cover */}
      <AnimatePresence mode="popLayout">
        <motion.div 
          key={currentTrack.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 z-0 pointer-events-none scale-110 blur-[100px] dark:opacity-20 mix-blend-multiply dark:mix-blend-screen"
        >
           <img 
             src={currentTrack.coverUrl} 
             alt="Background blur" 
             className="w-full h-full object-cover"
             onError={(e) => {
               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
             }}
           />
        </motion.div>
      </AnimatePresence>

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 z-10 relative shadow-[inset_1px_0_0_rgba(0,0,0,0.1)] overflow-hidden">
        {/* Main Content Area via Router */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <Outlet />

          {/* Lyrics Overlay */}
          <AnimatePresence>
            {showLyrics && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-x-0 bottom-0 z-50 bg-black/60 backdrop-blur-2xl border-t border-white/10 flex flex-col items-center justify-start py-12 px-6 overflow-y-auto custom-scrollbar"
                style={{ top: '0%' }} // cover the whole outlet area
              >
                <div className="max-w-2xl w-full text-center space-y-8">
                  <div className="flex flex-col items-center gap-4 mb-8">
                     <img 
                       src={currentTrack.coverUrl} 
                       alt="Cover" 
                       className="w-48 h-48 rounded-xl shadow-2xl bg-zinc-800"
                       onError={(e) => {
                         (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
                       }}
                     />
                     <div>
                       <h2 className="text-3xl font-black text-white">{currentTrack.title}</h2>
                       <p className="text-xl text-zinc-300 font-medium">{currentTrack.artist}</p>
                     </div>
                  </div>
                  
                  {currentTrack.lyrics ? (
                    <div className="whitespace-pre-wrap text-2xl md:text-3xl font-bold leading-relaxed text-zinc-100/90 text-center">
                      {currentTrack.lyrics}
                    </div>
                  ) : (
                    <div className="text-xl text-zinc-400 italic mt-12 py-12 w-full bg-white/5 rounded-2xl">
                      Could not find lyrics for this track automatically.
                    </div>
                  )}
                  
                  {currentTrack.artistInfo && (
                    <div className="mt-16 pt-8 border-t border-white/10 text-left w-full">
                      <h3 className="text-xl font-bold text-white mb-4">About {currentTrack.artist}</h3>
                      <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
                        {currentTrack.artistInfo}
                      </p>
                      {currentTrack.youtubeUrl && (
                        <a 
                          href={currentTrack.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-rose-400 hover:text-rose-300 text-sm font-medium"
                        >
                          Watch on YouTube →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed Bottom Controls */}
        <Controls 
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          duration={duration}
          volume={volume}
          showLyrics={showLyrics}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleLyrics={toggleLyrics}
          onToggleShuffle={handleToggleShuffle}
          onToggleRepeat={handleToggleRepeat}
          onToggleFavourite={handleToggleFavourite}
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
