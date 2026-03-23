import { motion } from "motion/react";
import { Radio as RadioIcon, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { usePlayer } from "../context/PlayerContext";

interface RadioStation {
  changeuuid: string;
  name: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
}

export function Radio() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const { playDirectly } = usePlayer();

  useEffect(() => {
    // Fetch live stations from the Free Radio Browser API
    const fetchStations = async () => {
      try {
        const response = await fetch("https://de1.api.radio-browser.info/json/stations/search?limit=15&has_geo_info=true&hidebroken=true&order=clickcount&reverse=true&language=english");
        const data = await response.json();
        setStations(data);
      } catch (error) {
        console.error("Failed to fetch radio stations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const handlePlayStation = (station: RadioStation) => {
    playDirectly({
      id: station.changeuuid,
      title: station.name,
      artist: `Live Radio ${station.country ? `(${station.country})` : ''}`,
      album: "Live Stream",
      coverUrl: station.favicon || "https://images.unsplash.com/photo-1598555542823-3dbca95dbb09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", // fallback antenna cover
      songUrl: station.url_resolved,
      duration: 0, // infinity for live radio effectively, but we use 0 to indicate stream
    });
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-8 lg:p-12 relative z-10 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100 flex items-center gap-4">
              <RadioIcon className="w-10 h-10 text-rose-500 animate-pulse" />
              Live Radio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Real-time broadcasting stations from around the world.
            </p>
          </div>
        </header>

        {/* Stations Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Top Global Stations</h3>
          </div>
          
          {loading ? (
             <div className="text-zinc-500 animate-pulse flex items-center gap-2 font-semibold">Tuning frequencies...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((station, idx) => (
                <motion.div 
                  key={station.changeuuid}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handlePlayStation(station)}
                  className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all flex h-32"
                >
                  <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-2">
                    {station.favicon ? (
                      <img 
                        src={station.favicon} 
                        alt={station.name} 
                        onError={(e) => {
                          // Fallback if image fails to load
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598555542823-3dbca95dbb09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                        }}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                       <RadioIcon className="w-12 h-12 text-zinc-400" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center p-4 flex-1 min-w-0 bg-gradient-to-r from-transparent to-black/5 dark:to-white/5">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-ping" />
                      LIVE {station.country && `• ${station.country}`}
                    </span>
                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {station.name}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug">
                      {station.tags.replace(/,/g, ' • ') || "General Radio"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
