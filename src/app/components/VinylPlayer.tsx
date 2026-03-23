import { motion } from "motion/react";
import { Track } from "../data";
import clsx from "clsx";

interface VinylPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  isExpanded?: boolean;
}

export function VinylPlayer({ currentTrack, isPlaying, isExpanded = false }: VinylPlayerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-6 lg:p-16 w-full h-full bg-black/10 dark:bg-black/40 backdrop-blur-2xl border-r border-white/10"
    >
      <motion.div 
        layout
        className="relative flex items-center justify-center w-full h-full"
      >
        {/* The Vinyl Record container to handle scaling */}
        <motion.div
          animate={{
            width: isExpanded ? "min(95vw, 85vh, 800px)" : "min(90vw, 80vh, 450px)",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative max-w-full max-h-full flex items-center justify-center aspect-square"
        >
          {/* Rotating vinyl */}
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{
              repeat: Infinity,
              duration: 8, // seconds per revolution
              ease: "linear",
            }}
            className="w-full h-full rounded-full bg-neutral-900 shadow-2xl flex items-center justify-center border-[6px] md:border-[8px] border-neutral-950 overflow-hidden group"
            style={{
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 40px rgba(0,0,0,0.8)'
            }}
          >
            {/* Grooves */}
            <div className="absolute inset-0 rounded-full border-2 border-neutral-800/40 m-[10%]" />
            <div className="absolute inset-0 rounded-full border border-neutral-800/40 m-[15%]" />
            <div className="absolute inset-0 rounded-full border-[1.5px] border-neutral-800/40 m-[20%]" />
            <div className="absolute inset-0 rounded-full border border-neutral-800/30 m-[25%]" />
            <div className="absolute inset-0 rounded-full border border-neutral-800/50 m-[30%]" />
            <div className="absolute inset-0 rounded-full border border-neutral-800/40 m-[35%]" />

            {/* Light reflection effect on the vinyl */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none mix-blend-overlay" />
            
            {/* Central Album Art Label */}
            <div className="relative w-1/3 h-1/3 rounded-full overflow-hidden border-[3px] md:border-4 border-neutral-950 z-10 shadow-xl">
              {/* The actual image */}
              <motion.img
                src={currentTrack.coverUrl}
                alt={currentTrack.album}
                className="w-full h-full object-cover"
              />
              
              {/* Darken overlay for the label to make it look printed */}
              <div className="absolute inset-0 bg-black/10 mix-blend-multiply rounded-full" />

              {/* Spindle hole */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-zinc-800 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-black/50" />
              </div>
            </div>
          </motion.div>
          
          {/* Stylized Tonearm Base */}
          <div className="absolute top-[5%] -right-[5%] md:top-[10%] md:-right-[10%] w-[15%] h-[15%] bg-zinc-800 rounded-full border-[3px] md:border-4 border-zinc-900 shadow-xl flex items-center justify-center z-20">
               <div className="w-[40%] h-[40%] rounded-full bg-zinc-600 shadow-inner" />
          </div>

          {/* Stylized Tonearm Arm */}
          <motion.div 
              className="absolute top-[12.5%] -right-[1%] md:top-[17.5%] md:-right-[3%] w-[2%] h-[65%] bg-zinc-300 origin-top z-10 rounded-full shadow-lg border border-zinc-400"
              initial={{ rotate: -25 }}
              animate={{ rotate: isPlaying ? 22 : -25 }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
              style={{ transformOrigin: "top center" }}
          >
              {/* Needle Head */}
              <div className="absolute bottom-0 -left-[150%] md:-left-[200%] w-[400%] md:w-[500%] h-[15%] bg-zinc-800 rounded-sm border-2 border-zinc-900 shadow-md">
                  <div className="w-[10%] h-[20%] bg-red-500 absolute bottom-[10%] right-[10%] rounded-sm" />
              </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}