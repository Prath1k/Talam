import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Maximize2, Mic2 } from "lucide-react";
import { Track } from "../data";

interface ControlsProps {
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Controls({
  currentTrack,
  isPlaying,
  progress,
  onPlayPause,
  onNext,
  onPrev,
}: ControlsProps) {
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-20 md:h-28 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border-t border-black/5 dark:border-white/10 flex items-center justify-between px-4 md:px-8 pb-2 md:pb-4 z-40 flex-shrink-0 relative">
      {/* Mobile Progress Bar (Absolute Top) */}
      <div className="md:hidden absolute top-0 left-0 w-full h-[2px] bg-black/5 dark:bg-white/5">
        <div 
          className="h-full bg-rose-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(progress / currentTrack.duration) * 100}%` }}
        />
      </div>

      {/* Currently Playing Info */}
      <div className="flex items-center gap-3 md:gap-4 w-[60%] md:w-1/4">
        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-md md:rounded-lg overflow-hidden shadow-md group shrink-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.album}
            className="w-full h-full object-cover"
          />
          <div className="hidden md:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center cursor-pointer">
             <Maximize2 className="text-white w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {currentTrack.title}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate hover:underline cursor-pointer">
            {currentTrack.artist}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex flex-1 md:flex-col items-center justify-end md:justify-center md:w-2/4 gap-2 pr-2 md:pr-0">
        <div className="flex items-center gap-4 md:gap-6">
          <button className="hidden md:block text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onPrev}
            className="hidden md:block text-zinc-900 dark:text-zinc-100 hover:scale-110 active:scale-95 transition-all"
          >
            <SkipBack className="w-5 h-5 md:w-6 md:h-6 fill-current" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="w-10 h-10 md:w-10 md:h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={onNext}
            className="text-zinc-900 dark:text-zinc-100 hover:scale-110 active:scale-95 transition-all"
          >
            <SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" />
          </button>
          
          <button className="hidden md:block text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Scrubber */}
        <div className="hidden md:flex items-center gap-3 w-full max-w-md text-xs font-medium text-zinc-500">
          <span className="w-10 text-right">{formatTime(progress)}</span>
          <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer group">
            <div 
              className="h-full bg-rose-500 relative group-hover:bg-rose-400"
              style={{ width: `${(progress / currentTrack.duration) * 100}%` }}
            >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity translate-x-1.5" />
            </div>
          </div>
          <span className="w-10">-{formatTime(currentTrack.duration - progress)}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="hidden md:flex items-center justify-end gap-4 w-1/4 text-zinc-400">
         <button className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
             <Mic2 className="w-4 h-4" />
         </button>
        <div className="flex items-center gap-2 w-32 group">
          <Volume2 className="w-4 h-4 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer" />
          <div className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden cursor-pointer">
            <div className="h-full bg-zinc-400 group-hover:bg-rose-500 w-[70%] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
