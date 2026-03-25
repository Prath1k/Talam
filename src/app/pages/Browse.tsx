import { motion } from "motion/react";
import { mockAlbums } from "../data";
import { Play } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";

export function Browse() {
  const { playDirectly } = usePlayer();
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-8 lg:p-12 relative z-10 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <header>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
            Browse
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Explore new releases, top charts, and curated playlists.
          </p>
        </header>

        {/* Featured Banner - Only show if albums available */}
        {mockAlbums.length > 0 && (
          <section>
            <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer">
              <img 
                src={mockAlbums[0].coverUrl} 
                alt="Featured" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
                <div>
                  <span className="text-rose-500 font-bold tracking-wider text-xs uppercase mb-2 block drop-shadow-md">New Release</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-1 drop-shadow-md">{mockAlbums[0].title}</h2>
                  <p className="text-zinc-300 font-medium drop-shadow-md">{mockAlbums[0].artist}</p>
                </div>
                <button 
                  onClick={() => playDirectly({ ...mockAlbums[0], id: mockAlbums[0].id, songUrl: "", duration: 180, isFavourite: false })}
                  className="hidden md:flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Listen Now
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Playlists Grid */}
        {mockAlbums.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Your Playlists</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mockAlbums.map((album, idx) => (
                <motion.div 
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group cursor-pointer"
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-md border border-black/5 dark:border-white/5">
                    <img 
                      src={album.coverUrl} 
                      alt={album.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={() => playDirectly({ ...album, songUrl: "", duration: 180, isFavourite: false })}
                        className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                      >
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                    {album.title}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {album.artist}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {mockAlbums.length === 0 && (
          <section className="text-center py-12">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
              No playlists available yet. Add some music to get started!
            </p>
          </section>
        )}

      </div>
    </div>
  );
}
