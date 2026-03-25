import { motion } from "motion/react";
import { mockAlbums, type Track } from "../data";
import { Play, ListPlus, ArrowDownToLine, Music2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "../context/PlayerContext";

const SECTION_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const };

type SavedPlaylist = {
  id: string;
  title: string;
  tracks: Track[];
  coverUrl?: string;
  createdAt?: string;
};

type PlaylistView = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  songs: Track[];
};

const SAVED_PLAYLISTS_KEY = "talam_saved_queue_playlists_v1";

export function Browse() {
  const { playDirectly, addToQueue, playNext, tracks } = usePlayer();
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");

  useEffect(() => {
    const loadSavedPlaylists = () => {
      try {
        const raw = localStorage.getItem(SAVED_PLAYLISTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          setSavedPlaylists(parsed);
        }
      } catch {
        setSavedPlaylists([]);
      }
    };

    loadSavedPlaylists();
    window.addEventListener("talam:saved-playlists-updated", loadSavedPlaylists);
    window.addEventListener("storage", loadSavedPlaylists);

    return () => {
      window.removeEventListener("talam:saved-playlists-updated", loadSavedPlaylists);
      window.removeEventListener("storage", loadSavedPlaylists);
    };
  }, []);

  const songsByAlbum = useMemo(() => {
    const grouped = new Map<string, typeof tracks>();
    tracks.forEach((track) => {
      const key = track.album || "Unknown Album";
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, track]);
    });
    return grouped;
  }, [tracks]);

  const playlists = useMemo<PlaylistView[]>(() => {
    const localPlaylists: PlaylistView[] = mockAlbums.map((album) => ({
      id: album.id,
      title: album.title,
      artist: album.artist,
      coverUrl: album.coverUrl,
      songs: songsByAlbum.get(album.title) || [],
    }));

    const saved: PlaylistView[] = savedPlaylists.map((playlist) => ({
      id: playlist.id,
      title: playlist.title,
      artist: "Saved Queue",
      coverUrl: playlist.coverUrl || (playlist.tracks[0]?.coverUrl ?? ""),
      songs: Array.isArray(playlist.tracks) ? playlist.tracks : [],
    }));

    return [...saved, ...localPlaylists];
  }, [savedPlaylists, songsByAlbum]);

  useEffect(() => {
    if (playlists.length === 0) {
      if (selectedPlaylistId !== "") setSelectedPlaylistId("");
      return;
    }

    const exists = playlists.some((playlist) => playlist.id === selectedPlaylistId);
    if (!exists) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlists, selectedPlaylistId]);

  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId);

  const selectedPlaylistSongs = selectedPlaylist?.songs || [];

  const handlePlayPlaylist = (playlistId: string) => {
    const songs = playlists.find((playlist) => playlist.id === playlistId)?.songs || [];
    if (songs.length === 0) return;

    playDirectly(songs[0]);
    songs.slice(1).forEach((song) => addToQueue(song));
  };

  const handleQueuePlaylist = (playlistId: string) => {
    const songs = playlists.find((playlist) => playlist.id === playlistId)?.songs || [];
    songs.forEach((song) => addToQueue(song));
  };
  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-8 lg:p-12 relative z-10 custom-scrollbar">
      <motion.div
        className="max-w-6xl mx-auto space-y-12 pb-24"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SECTION_TRANSITION}
      >
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SECTION_TRANSITION}>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
            Browse
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Explore new releases, top charts, and curated playlists.
          </p>
        </motion.header>

        {/* Featured Banner - Only show if albums available */}
        {playlists.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SECTION_TRANSITION}>
            <motion.div
              className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl group cursor-pointer smooth-card"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <img 
                src={playlists[0].coverUrl} 
                alt="Featured" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
                <div>
                  <span className="text-rose-500 font-bold tracking-wider text-xs uppercase mb-2 block drop-shadow-md">New Release</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-1 drop-shadow-md">{playlists[0].title}</h2>
                  <p className="text-zinc-300 font-medium drop-shadow-md">{playlists[0].artist}</p>
                </div>
                <button 
                  onClick={() => handlePlayPlaylist(playlists[0].id)}
                  className="hidden md:flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-xl smooth-interactive"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Listen Now
                </button>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* Playlists Grid */}
        {playlists.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SECTION_TRANSITION}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Your Playlists</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {playlists.map((album, idx) => (
                <motion.div 
                  key={album.id}
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.995 }}
                  transition={{ delay: idx * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group cursor-pointer smooth-card"
                  onClick={() => setSelectedPlaylistId(album.id)}
                >
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-md border border-black/5 dark:border-white/5">
                    <img 
                      src={album.coverUrl} 
                      alt={album.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPlaylist(album.id);
                        }}
                        className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-xl smooth-interactive"
                      >
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                    {album.title}
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {album.songs.length || 0} songs
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {selectedPlaylist && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SECTION_TRANSITION}>
            <div className="bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Music2 className="w-5 h-5 text-rose-500" />
                    {selectedPlaylist.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedPlaylistSongs.length} tracks in playlist</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayPlaylist(selectedPlaylist.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold smooth-interactive"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play All
                  </button>
                  <button
                    onClick={() => handleQueuePlaylist(selectedPlaylist.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold smooth-interactive"
                  >
                    <ArrowDownToLine className="w-4 h-4" /> Queue All
                  </button>
                </div>
              </div>

              {selectedPlaylistSongs.length > 0 ? (
                <div className="space-y-2">
                  {selectedPlaylistSongs.map((song, index) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60"
                    >
                      <span className="w-6 text-sm text-zinc-500 dark:text-zinc-400">{index + 1}</span>
                      <img src={song.coverUrl} alt={song.title} className="w-10 h-10 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{song.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{song.artist}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playNext(song)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 smooth-interactive"
                        >
                          <ListPlus className="w-3.5 h-3.5" /> Play Next
                        </button>
                        <button
                          onClick={() => addToQueue(song)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 smooth-interactive"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Queue
                        </button>
                        <button
                          onClick={() => playDirectly(song)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold smooth-interactive"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Play
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No songs found for this playlist yet.</p>
              )}
            </div>
          </motion.section>
        )}

        {/* Empty State */}
        {playlists.length === 0 && (
          <section className="text-center py-12">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
              No playlists available yet. Add some music to get started!
            </p>
          </section>
        )}

      </motion.div>
    </div>
  );
}
