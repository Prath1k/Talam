import { Outlet, NavLink, useLocation } from "react-router";
import { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Controls } from "../components/Controls";
import { usePlayer } from "../context/PlayerContext";
import { Home as HomeIcon, LayoutGrid, Radio as RadioIcon, Settings as SettingsIcon, X, Play, Trash2 } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";

export function RootLayout() {
  const { 
    tracks, currentTrack, currentTrackIndex, isPlaying, progress, duration, volume,
    handlePlayPause, handleNext, handlePrev, handleSeek, 
    handleVolumeChange, toggleLyrics, showLyrics,
    isShuffle, repeatMode, handleToggleShuffle, handleToggleRepeat, handleToggleFavourite,
    handleTrackSelect, removeFromQueue, reorderQueue, clearQueue,
  } = usePlayer();
  const location = useLocation();
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [draggedQueueIndex, setDraggedQueueIndex] = useState<number | null>(null);

  const upNextTracks = tracks.slice(currentTrackIndex + 1);

  const handleSaveQueueAsPlaylist = () => {
    if (upNextTracks.length === 0) return;

    const suggestedName = `Queue ${new Date().toLocaleDateString()}`;
    const name = window.prompt("Save queue as playlist", suggestedName)?.trim();
    if (!name) return;

    const key = "talam_saved_queue_playlists_v1";
    const existing = (() => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();

    const payload = {
      id: `saved-${Date.now()}`,
      title: name,
      tracks: upNextTracks,
      coverUrl: upNextTracks[0]?.coverUrl || "",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(key, JSON.stringify([payload, ...existing]));
    window.dispatchEvent(new CustomEvent("talam:saved-playlists-updated"));
  };

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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 overflow-hidden"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          {/* Global Queue Drawer */}
          <AnimatePresence>
            {isQueueOpen && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsQueueOpen(false)}
                  className="md:hidden absolute inset-0 bg-black/40 z-30"
                  aria-label="Close queue drawer"
                />

                <motion.aside
                  initial={{ opacity: 0, y: 24, x: 0 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, y: 24, x: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 bottom-20 h-[62vh] rounded-t-2xl md:rounded-none md:top-0 md:right-0 md:left-auto md:bottom-28 md:h-auto md:w-[390px] bg-white/90 dark:bg-zinc-900/92 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-black/10 dark:border-white/10 z-40 flex flex-col"
                >
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Queue</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{upNextTracks.length} songs up next</p>
                  </div>
                  <button
                    onClick={() => setIsQueueOpen(false)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 smooth-interactive"
                    aria-label="Close queue"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-5 py-3 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                  <button
                    onClick={handleSaveQueueAsPlaylist}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 smooth-interactive"
                  >
                    Save Queue as Playlist
                  </button>
                  <button
                    onClick={clearQueue}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 smooth-interactive"
                  >
                    Clear Queue
                  </button>
                </div>

                <div className="px-5 py-4 border-b border-black/5 dark:border-white/5">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Now Playing</p>
                  <div className="flex items-center gap-3">
                    <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-12 h-12 rounded-md object-cover" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{currentTrack.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{currentTrack.artist}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {upNextTracks.length === 0 ? (
                    <div className="h-full min-h-40 grid place-items-center text-zinc-500 dark:text-zinc-400 text-sm">
                      Queue is empty. Add songs from Browse or Up Next.
                    </div>
                  ) : (
                    upNextTracks.map((track, idx) => (
                      <div
                        key={`${track.id}-${idx}`}
                        draggable
                        onDragStart={() => setDraggedQueueIndex(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedQueueIndex === null) return;
                          reorderQueue(draggedQueueIndex, idx);
                          setDraggedQueueIndex(null);
                        }}
                        onDragEnd={() => setDraggedQueueIndex(null)}
                        className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/50"
                      >
                        <img src={track.coverUrl} alt={track.title} className="w-10 h-10 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{track.title}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{track.artist}</p>
                        </div>
                        <button
                          onClick={() => handleTrackSelect(track.id)}
                          className="text-zinc-500 hover:text-rose-500 smooth-interactive"
                          title="Play now"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          onClick={() => removeFromQueue(track.id)}
                          className="text-zinc-500 hover:text-red-500 smooth-interactive"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

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
                  
                  {currentTrack.lyricsStatus === "loading" ? (
                    <div className="text-xl text-zinc-300 mt-12 py-12 w-full bg-white/5 rounded-2xl animate-pulse">
                      Fetching lyrics...
                    </div>
                  ) : currentTrack.lyrics ? (
                    <div className="whitespace-pre-wrap text-2xl md:text-3xl font-bold leading-relaxed text-zinc-100/90 text-center">
                      {currentTrack.lyrics}
                    </div>
                  ) : (
                    <div className="text-xl text-zinc-400 italic mt-12 py-12 w-full bg-white/5 rounded-2xl">
                      {currentTrack.lyricsMessage || "Could not find lyrics for this track automatically."}
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
          onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
          queueCount={upNextTracks.length}
          isQueueOpen={isQueueOpen}
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
