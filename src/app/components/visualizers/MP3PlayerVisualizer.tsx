import { motion } from "motion/react";
import { Track } from "../data";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

interface MP3PlayerVisualizerProps {
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  isExpanded?: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function MP3PlayerVisualizer({ 
  currentTrack, 
  isPlaying, 
  progress,
  isExpanded = false,
  onPlayPause, 
  onNext, 
  onPrev 
}: MP3PlayerVisualizerProps) {
  
  const progressPercentage = (progress / currentTrack.duration) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-6 lg:p-16 w-full h-full bg-black/5 dark:bg-black/20 backdrop-blur-3xl border-r border-black/5 dark:border-white/5"
    >
      <motion.div 
        layout
        animate={{
          width: isExpanded ? "min(95vw, 450px)" : "min(90vw, 320px)",
          height: isExpanded ? "min(85vh, 700px)" : "min(80vh, 520px)",
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative bg-gradient-to-b from-zinc-200 to-zinc-400 dark:from-zinc-800 dark:to-zinc-950 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl p-4 flex flex-col items-center border-[3px] md:border-4 border-white/50 dark:border-zinc-700 overflow-hidden"
      >
        
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay pointer-events-none rounded-t-[3rem]" />

        {/* Screen */}
        <div className="w-full h-[45%] bg-black rounded-3xl mt-2 mb-4 shadow-inner overflow-hidden relative border-[3px] md:border-4 border-zinc-900 flex flex-col p-4 z-10 shrink-0">
          <motion.img
            key={currentTrack.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            src={currentTrack.coverUrl}
            alt={currentTrack.album}
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm pointer-events-none"
          />
          <div className="relative z-10 flex flex-col h-full justify-between pointer-events-none">
            <div className="flex justify-between items-center text-[10px] md:text-xs font-mono text-zinc-300">
              <span>{isPlaying ? "PLAYING" : "PAUSED"}</span>
              <span>12:00 PM</span>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 mt-auto mb-2">
              <motion.img
                key={`thumb-${currentTrack.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                src={currentTrack.coverUrl}
                alt={currentTrack.album}
                className="w-12 h-12 md:w-16 md:h-16 rounded shadow-lg border border-white/20 object-cover"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <h4 className="text-white font-bold truncate text-xs md:text-sm">{currentTrack.title}</h4>
                <p className="text-zinc-400 truncate text-[10px] md:text-xs">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Simple Progress Bar */}
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1 md:mt-2">
              <div 
                className="h-full bg-rose-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Click Wheel Container */}
        <div className="flex-1 w-full flex items-center justify-center pb-2">
          {/* Click Wheel */}
          <div className="relative aspect-square w-[75%] max-w-[200px] bg-zinc-100 dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-300 dark:border-zinc-700 flex items-center justify-center group">
            
            {/* Top button (MENU) */}
            <button 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[30%] flex items-start justify-center pt-3 text-xs md:text-sm font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors z-20"
            >
              MENU
            </button>
            
            {/* Bottom button (Play/Pause) */}
            <button 
              onClick={onPlayPause}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[30%] flex items-end justify-center pb-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors z-20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-1" />
              )}
            </button>
            
            {/* Left button (Previous) */}
            <button 
              onClick={onPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[30%] h-[40%] flex items-center justify-start pl-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors z-20"
            >
              <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </button>
            
            {/* Right button (Next) */}
            <button 
              onClick={onNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-[30%] h-[40%] flex items-center justify-end pr-3 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors z-20"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </button>
            
            {/* Center button */}
            <button 
              onClick={onPlayPause}
              className="w-[35%] h-[35%] bg-zinc-200 dark:bg-zinc-700 rounded-full shadow-inner border border-zinc-300 dark:border-zinc-900 z-30 active:scale-95 transition-transform" 
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}