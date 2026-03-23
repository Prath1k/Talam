import { motion } from "motion/react";
import { Radio as RadioIcon, Play } from "lucide-react";
import { mockAlbums } from "../data";

export function Radio() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-8 lg:p-12 relative z-10 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100 flex items-center gap-4">
              <RadioIcon className="w-10 h-10 text-rose-500" />
              Radio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Live stations and curated streams matching your vibe.
            </p>
          </div>
          <button className="bg-rose-500 text-white px-6 py-2.5 rounded-full font-bold hover:bg-rose-600 transition-colors shadow-lg active:scale-95 flex items-center gap-2 max-w-max">
            <Play className="w-4 h-4 fill-current" /> Play My Station
          </button>
        </header>

        {/* Stations Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Recommended Stations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...mockAlbums, ...mockAlbums].slice(0, 5).map((album, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all flex h-32"
              >
                <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden">
                  <img 
                    src={album.coverUrl} 
                    alt={album.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white fill-current" />
                  </div>
                </div>
                
                <div className="flex flex-col justify-center p-4 flex-1 min-w-0 bg-gradient-to-r from-transparent to-black/5 dark:to-white/5">
                  <span className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Station</span>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {album.artist} Radio
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    Based on {album.title}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
