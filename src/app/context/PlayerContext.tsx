import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { mockTracks, Track as BaseTrack } from "../data";
import { supabase } from "../utils/supabase";
import { fetchTrackMetadata } from "../utils/metadata";

export interface Track extends BaseTrack {
  songUrl?: string;
  lyrics?: string;
  fetchedMetadata?: boolean;
  lyricsStatus?: "idle" | "loading" | "ready" | "not-found" | "error";
  lyricsMessage?: string;
}

interface PlayerContextType {
  tracks: Track[];
  currentTrackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  showLyrics: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "one" | "all";
  toggleLyrics: () => void;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleTrackSelect: (id: string) => void;
  playDirectly: (track: Track) => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (vol: number) => void;
  handleToggleFavourite: (id: string) => void;
  handleToggleShuffle: () => void;
  handleToggleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function probeAudioDuration(src: string): Promise<number> {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = src;

    const cleanup = () => {
      probe.removeEventListener("loadedmetadata", onLoadedMetadata);
      probe.removeEventListener("timeupdate", onTimeUpdate);
      probe.removeEventListener("error", onError);
      clearTimeout(timeout);
      probe.src = "";
    };

    const finish = (value: number) => {
      cleanup();
      resolve(value > 0 && Number.isFinite(value) ? value : 0);
    };

    const onTimeUpdate = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        finish(probe.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) {
        finish(probe.duration);
      } else {
        // Some containers report Infinity initially; seeking forces real duration.
        probe.currentTime = 1e101;
      }
    };

    const onError = () => finish(0);

    const timeout = setTimeout(() => finish(0), 10000);

    probe.addEventListener("loadedmetadata", onLoadedMetadata);
    probe.addEventListener("timeupdate", onTimeUpdate);
    probe.addEventListener("error", onError);
  });
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(mockTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
  const [audio] = useState(new Audio());
  const measuredDurationIds = useRef<Set<string>>(new Set());

  const normalizeDuration = (value: number) => {
    // Guard against invalid/infinite/broken container metadata.
    if (!Number.isFinite(value) || value <= 0 || value > 60 * 60 * 6) return 0;
    return value;
  };
  
  const currentTrack = tracks[currentTrackIndex] || mockTracks[0];

  // Fetch metadata for the active track once and persist it in state.
  useEffect(() => {
    if (!currentTrack || currentTrack.fetchedMetadata || currentTrack.lyricsStatus === "loading") return;

    let cancelled = false;
    const trackId = currentTrack.id;
    const trackTitle = currentTrack.title;

    const enrichTrack = async () => {
      setTracks((prev) =>
        prev.map((track) =>
          track.id === trackId
            ? {
                ...track,
                lyricsStatus: "loading",
                lyricsMessage: "Fetching lyrics...",
              }
            : track
        )
      );

      const metadata = await fetchTrackMetadata(trackTitle);
      if (cancelled) return;

      setTracks((prev) =>
        prev.map((track) => {
          if (track.id !== trackId) return track;
          if (!metadata) {
            return {
              ...track,
              fetchedMetadata: true,
              lyricsStatus: "error",
              lyricsMessage: "Could not fetch metadata right now. Please try another track.",
            };
          }

          const lyrics = (metadata.lyrics || "").trim();
          const hasLyrics = Boolean(lyrics);

          return {
            ...track,
            ...metadata,
            lyrics,
            // Keep existing local playback info stable.
            id: track.id,
            songUrl: track.songUrl,
            duration: track.duration,
            isFavourite: track.isFavourite,
            fetchedMetadata: true,
            lyricsStatus: hasLyrics ? "ready" : "not-found",
            lyricsMessage: hasLyrics
              ? ""
              : "Could not find lyrics for this track automatically.",
          };
        })
      );
    };

    enrichTrack();

    return () => {
      cancelled = true;
    };
  }, [currentTrack.id, currentTrack.title]);

  // Apply volume changes
  useEffect(() => {
    audio.volume = volume;
  }, [volume, audio]);

  // Fetch tracks from Supabase on mount
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { data, error } = await supabase.from("tracks").select("*");
        if (data && data.length > 0) {
          setTracks(data.map(t => ({ ...t, isFavourite: false })));
        }
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  // Resolve real durations for local audio so Up Next doesn't keep fallback times.
  useEffect(() => {
    let cancelled = false;

    const candidates = tracks.filter(
      (track) =>
        Boolean(track.songUrl) &&
        !measuredDurationIds.current.has(track.id) &&
        (!track.duration || track.duration <= 180)
    );

    if (candidates.length === 0) return;

    candidates.forEach((track) => {
      measuredDurationIds.current.add(track.id);

      probeAudioDuration(track.songUrl as string).then((measured) => {
        if (cancelled || measured <= 0) return;

        const rounded = Math.max(1, Math.round(measured));
        setTracks((prev) =>
          prev.map((item) => (item.id === track.id ? { ...item, duration: rounded } : item))
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [tracks]);

  // Handle actual Audio playback
  useEffect(() => {
    if (currentTrack.songUrl) {
      audio.src = currentTrack.songUrl;
      audio.load();
      setProgress(0);
      setDuration(0);
      if (isPlaying) {
        audio.play().catch(e => {
           console.error("Audio playback error:", e);
           setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
      audio.src = "";
    }
  }, [currentTrackIndex, currentTrack.songUrl]);

  useEffect(() => {
    if (!currentTrack.songUrl) return;
    
    if (isPlaying) {
      audio.play().catch(e => {
         console.error("Audio playback error:", e);
         setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, audio, currentTrack.songUrl]);

  // Audio time update or simulated progress
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    
    if (currentTrack.songUrl) {
      const updateProgress = () => {
        setProgress(audio.currentTime);

        const measuredDuration = normalizeDuration(audio.duration);
        if (measuredDuration > 0) {
          setDuration(measuredDuration);
          setTracks((prev) =>
            prev.map((track) =>
              track.id === currentTrack.id
                ? { ...track, duration: Math.max(1, Math.round(measuredDuration)) }
                : track
            )
          );
        }
      };
      
      const handleLoadedMetadata = () => {
        const measuredDuration = normalizeDuration(audio.duration);
        if (measuredDuration > 0) {
          setDuration(measuredDuration);
          setTracks((prev) =>
            prev.map((track) =>
              track.id === currentTrack.id
                ? { ...track, duration: Math.max(1, Math.round(measuredDuration)) }
                : track
            )
          );
        }
      };

      const handleEnded = () => {
        // If metadata duration was bad, trust the actual played time at end.
        const playedDuration = Math.max(1, Math.round(audio.currentTime || 0));
        if (playedDuration > 0) {
          setDuration(playedDuration);
          setProgress(playedDuration);
          setTracks((prev) =>
            prev.map((track) =>
              track.id === currentTrack.id ? { ...track, duration: playedDuration } : track
            )
          );
        }

        if (repeatMode === "one") {
          audio.currentTime = 0;
          audio.play();
        } else {
          handleNext();
        }
      };
      
      const handleError = () => {
         console.warn(`Fallback triggered: Failed to load ${currentTrack.songUrl}`);
         setIsPlaying(false);
      };

      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      
      return () => {
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("error", handleError);
      };
    } else {
      setDuration(currentTrack.duration || 180);
      if (isPlaying) {
        timer = setInterval(() => {
          setProgress((prev) => {
            if (prev >= duration) {
              if (repeatMode === "one") {
                return 0;
              }
              handleNext();
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
      }
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentTrack, currentTrackIndex, audio, duration, repeatMode]);

  const handleSeek = (time: number) => {
    setProgress(time);
    if (currentTrack.songUrl && !isNaN(audio.duration)) {
      audio.currentTime = time;
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleLyrics = () => {
    setShowLyrics(!showLyrics);
  };

  const handleNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      if (nextIndex === 0 && repeatMode === "off") {
        setIsPlaying(false);
      } else {
        setCurrentTrackIndex(nextIndex);
      }
    }
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const handleToggleShuffle = () => setIsShuffle(!isShuffle);
  
  const handleToggleRepeat = () => {
    const modes: ("off" | "one" | "all")[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const handleToggleFavourite = (id: string) => {
    setTracks(prev => prev.map(track => 
      track.id === id ? { ...track, isFavourite: !track.isFavourite } : track
    ));
  };

  const handleTrackSelect = (id: string) => {
    const index = tracks.findIndex(t => t.id === id);
    if (index !== -1) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const playDirectly = (track: Track) => {
    const existingIndex = tracks.findIndex(t => t.id === track.id);
    if (existingIndex !== -1) {
      setCurrentTrackIndex(existingIndex);
    } else {
      setTracks((prev) => [track, ...prev]);
      setCurrentTrackIndex(0);
    }
    setIsPlaying(true);
  };

  return (
    <PlayerContext.Provider
      value={{
        tracks,
        currentTrackIndex,
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        showLyrics,
        isShuffle,
        repeatMode,
        toggleLyrics,
        handlePlayPause,
        handleNext,
        handlePrev,
        handleTrackSelect,
        playDirectly,
        handleSeek,
        handleVolumeChange,
        handleToggleFavourite,
        handleToggleShuffle,
        handleToggleRepeat,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
