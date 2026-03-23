import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { VinylPlayer } from "../components/VinylPlayer";
import { MP3PlayerVisualizer } from "../components/visualizers/MP3PlayerVisualizer";
import { TrackList } from "../components/TrackList";
import { mockTracks } from "../data";
import { usePlayer } from "../context/PlayerContext";
import { Disc, PlaySquare, ListMusic, ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

type VisualizerType = "vinyl" | "mp3";

export function Home() {
  const { currentTrack, isPlaying, handleTrackSelect, handleNext, handlePrev, handlePlayPause, progress } = usePlayer();
  const [visualizer, setVisualizer] = useState<VisualizerType>("vinyl");
  
  // TrackList collapse state
  const [isUpNextOpen, setIsUpNextOpen] = useState(true);
  
  // Auto collapse on mobile initially
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsUpNextOpen(false);
    }
  }, []);

  const renderVisualizer = () => {
    switch (visualizer) {
      case "mp3":
        return (
          <MP3PlayerVisualizer 
            key="mp3" 
            currentTrack={currentTrack} 
            isPlaying={isPlaying} 
            progress={progress}
            isExpanded={!isUpNextOpen}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
      case "vinyl":
      default:
        return (
          <VinylPlayer 
            key="vinyl" 
            currentTrack={currentTrack} 
            isPlaying={isPlaying} 
            isExpanded={!isUpNextOpen} 
          />
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full w-full relative bg-zinc-100 dark:bg-zinc-950">
      {/* Visualizer Section */}
      <motion.div 
        layout
        className={clsx(
          "relative flex flex-col z-10",
          isUpNextOpen ? "h-[50vh] lg:h-full lg:w-1/2 flex-shrink-0" : "h-full w-full flex-1"
        )}
      >
        {/* Top Controls */}
        <div className="absolute top-4 lg:top-6 left-0 right-0 z-50 flex justify-end pointer-events-none px-4">
          {/* Toggle Up Next Button - Desktop */}
          <button
            onClick={() => setIsUpNextOpen(!isUpNextOpen)}
            className="hidden lg:flex pointer-events-auto items-center gap-2 bg-white/20 dark:bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-full border border-black/10 dark:border-white/10 shadow-lg text-zinc-700 dark:text-zinc-300 hover:bg-white/30 dark:hover:bg-black/60 transition-colors"
            title="Toggle Up Next"
          >
            <ListMusic className="w-5 h-5" />
            <span className="font-medium text-sm">Up Next</span>
            {isUpNextOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* The Animated Visualizer */}
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <AnimatePresence mode="wait">
            {renderVisualizer()}
          </AnimatePresence>
        </div>

        {/* Bottom Controls: Visualizer Toggle */}
        <div className="absolute bottom-6 left-4 lg:bottom-10 lg:left-0 lg:right-0 z-50 flex items-center lg:justify-center pointer-events-none lg:px-4">
          <div className="flex items-center gap-2 bg-white/20 dark:bg-black/40 backdrop-blur-xl p-1.5 rounded-full border border-black/10 dark:border-white/10 shadow-lg pointer-events-auto">
            <button
              onClick={() => setVisualizer("vinyl")}
              className={clsx(
                "p-2.5 rounded-full transition-all duration-300 relative z-10",
                visualizer === "vinyl" 
                  ? "text-rose-500" 
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
              title="Vinyl Player"
            >
              <Disc className="w-5 h-5 relative z-20" />
              {visualizer === "vinyl" && (
                <motion.div layoutId="visualizer-pill" className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm rounded-full z-10" />
              )}
            </button>
            <button
              onClick={() => setVisualizer("mp3")}
              className={clsx(
                "p-2.5 rounded-full transition-all duration-300 relative z-10",
                visualizer === "mp3" 
                  ? "text-rose-500" 
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
              title="MP3 Player"
            >
              <PlaySquare className="w-5 h-5 relative z-20" />
              {visualizer === "mp3" && (
                <motion.div layoutId="visualizer-pill" className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm rounded-full z-10" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Toggle Button (Floating at bottom of visualizer area) */}
        <button
          onClick={() => setIsUpNextOpen(!isUpNextOpen)}
          className="lg:hidden absolute bottom-6 right-4 z-50 flex items-center gap-2 bg-white/40 dark:bg-black/60 backdrop-blur-xl p-2.5 sm:px-4 sm:py-2.5 rounded-full border border-black/10 dark:border-white/10 shadow-lg text-zinc-800 dark:text-zinc-200"
        >
          <ListMusic className="w-5 h-5" />
          <span className="hidden sm:inline font-medium text-sm text-shadow-sm">Up Next</span>
          {isUpNextOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* TrackList Section */}
      <AnimatePresence>
        {isUpNextOpen && (
          <motion.div
            initial={{ opacity: 0, flex: 0 }}
            animate={{ opacity: 1, flex: 1 }}
            exit={{ opacity: 0, flex: 0 }}
            className="flex flex-col overflow-hidden w-full lg:w-1/2 lg:h-full z-20"
          >
            <TrackList
              tracks={mockTracks}
              currentTrackId={currentTrack.id}
              isPlaying={isPlaying}
              onTrackSelect={handleTrackSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}