import { motion } from "motion/react";
import { Play, Heart } from "lucide-react";
import { Track } from "../data";
import clsx from "clsx";

interface TrackListProps {
  tracks: Track[];
  currentTrackId: string;
  isPlaying: boolean;
  onTrackSelect: (id: string) => void;
  onToggleFavourite: (id: string) => void;
}

export function TrackList({ tracks, currentTrackId, isPlaying, onTrackSelect, onToggleFavourite }: TrackListProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-8 lg:p-12 relative z-10 custom-scrollbar border-l border-white/20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight mb-8 text-zinc-900 dark:text-zinc-100">
          Up Next
        </h1>
        
        <motion.div 
          className="flex flex-col gap-1"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {tracks.map((track, index) => {
            const isCurrent = track.id === currentTrackId;

            return (
              <motion.div
                key={track.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 }
                }}
                onClick={() => onTrackSelect(track.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={clsx(
                  "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all group relative overflow-hidden",
                  isCurrent
                    ? "bg-white/40 dark:bg-white/10 shadow-sm border border-white/50 dark:border-white/10"
                    : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                )}
              >
                {isCurrent && (
                   <motion.div 
                     layoutId="active-track-bg"
                     className="absolute inset-0 bg-rose-500/5 dark:bg-rose-500/10 -z-10"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                   />
                )}

                <div className="w-8 flex justify-center text-sm font-medium text-zinc-400">
                  {isCurrent && isPlaying ? (
                    <div className="flex items-end justify-center gap-[2px] h-4 w-4">
                      <motion.div className="w-1 bg-rose-500 rounded-sm" animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.8, repeat: Infinity }} />
                      <motion.div className="w-1 bg-rose-500 rounded-sm" animate={{ height: ["80%", "40%", "80%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1 bg-rose-500 rounded-sm" animate={{ height: ["60%", "100%", "60%"] }} transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  ) : isCurrent && !isPlaying ? (
                    <span className="text-rose-500">
                        <Play className="w-4 h-4 fill-current" />
                    </span>
                  ) : (
                    <span className="group-hover:hidden">{index + 1}</span>
                  )}
                  {!isCurrent && (
                    <Play className="w-4 h-4 fill-current hidden group-hover:block" />
                  )}
                </div>

                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 shadow-sm border border-black/10">
                  <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex flex-col flex-[2] min-w-0">
                  <span className={clsx(
                    "text-base font-semibold truncate",
                    isCurrent ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"
                  )}>
                    {track.title}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate hover:underline">
                    {track.artist}
                  </span>
                </div>

                <div className="hidden xl:flex flex-1 min-w-0 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  {track.album}
                </div>

                <div className="flex items-center gap-4 text-zinc-400">
                  <Heart 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavourite(track.id);
                    }}
                    className={clsx(
                      "w-4 h-4 transition-all cursor-pointer hover:scale-110 active:scale-95",
                      track.isFavourite 
                        ? "text-rose-500 fill-rose-500 opacity-100" 
                        : "opacity-0 group-hover:opacity-100 hover:text-rose-500"
                    )} 
                  />
                  <span className="text-sm font-medium tabular-nums opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity">
                    {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
