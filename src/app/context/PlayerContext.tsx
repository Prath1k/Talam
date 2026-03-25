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
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (id: string) => void;
  reorderQueue: (fromQueueIndex: number, toQueueIndex: number) => void;
  clearQueue: () => void;
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

async function decodeAudioDuration(src: string): Promise<number> {
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return 0;

  let audioContext: AudioContext | null = null;

  try {
    audioContext = new AudioContextCtor();
    const response = await fetch(src);
    if (!response.ok) return 0;

    const buffer = await response.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(buffer.slice(0));
    return Number.isFinite(decoded.duration) && decoded.duration > 0 ? decoded.duration : 0;
  } catch {
    return 0;
  } finally {
    if (audioContext) {
      audioContext.close().catch(() => {
        // Ignore close failures.
      });
    }
  }
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

  const normalizeSongDuration = (value: number) => {
    const normalized = normalizeDuration(value);
    // Songs above this are typically broken metadata for local mp4/webm containers.
    if (normalized > 60 * 20) return 0;
    return normalized;
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
        Boolean(track.songUrl && track.songUrl.startsWith("/music/")) &&
        !measuredDurationIds.current.has(track.id)
    );

    if (candidates.length === 0) return;

    candidates.forEach((track) => {
      measuredDurationIds.current.add(track.id);

      (async () => {
        let measured = await decodeAudioDuration(track.songUrl as string);
        if (!measured) {
          measured = await probeAudioDuration(track.songUrl as string);
        }

        return normalizeSongDuration(measured);
      })().then((measured) => {
        if (cancelled || measured <= 0) return;

        const rounded = Math.max(1, Math.round(measured));
        setTracks((prev) =>
          prev.map((item) => {
            if (item.id !== track.id) return item;

            // Avoid noisy rerenders when the measured value is effectively the same.
            if (Math.abs((item.duration || 0) - rounded) <= 1) return item;

            return { ...item, duration: rounded };
          })
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
      setDuration(currentTrack.duration || 0);
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
      };
      
      const handleLoadedMetadata = () => {
        const isLocalSong = Boolean(currentTrack.songUrl?.startsWith("/music/"));
        const measuredDuration = isLocalSong
          ? normalizeSongDuration(audio.duration)
          : normalizeDuration(audio.duration);
        const knownDuration = isLocalSong
          ? normalizeSongDuration(currentTrack.duration || 0)
          : normalizeDuration(currentTrack.duration || 0);

        const resolvedDuration =
          measuredDuration > 0
            ? knownDuration > 0 && measuredDuration > knownDuration * 2
              ? knownDuration
              : measuredDuration
            : knownDuration;

        if (resolvedDuration > 0) {
          setDuration(resolvedDuration);

          // Update track duration only when the value is trustworthy.
          if (measuredDuration > 0) {
            const rounded = Math.max(1, Math.round(resolvedDuration));
            const canUpdateTrack = knownDuration === 0 || measuredDuration <= knownDuration * 2;

            if (canUpdateTrack) {
              setTracks((prev) =>
                prev.map((track) =>
                  track.id === currentTrack.id
                    ? { ...track, duration: rounded }
                    : track
                )
              );
            }
          }
        } else {
          setDuration(0);
        }
      };

      const handleDurationChange = () => {
        const isLocalSong = Boolean(currentTrack.songUrl?.startsWith("/music/"));
        const measuredDuration = isLocalSong
          ? normalizeSongDuration(audio.duration)
          : normalizeDuration(audio.duration);
        const knownDuration = isLocalSong
          ? normalizeSongDuration(currentTrack.duration || 0)
          : normalizeDuration(currentTrack.duration || 0);

        if (measuredDuration > 0) {
          const resolvedDuration =
            knownDuration > 0 && measuredDuration > knownDuration * 2
              ? knownDuration
              : measuredDuration;

          setDuration(resolvedDuration || knownDuration || 0);

          setTracks((prev) =>
            prev.map((track) =>
              track.id === currentTrack.id
                ? {
                    ...track,
                    duration:
                      knownDuration > 0 && measuredDuration > knownDuration * 2
                        ? Math.max(1, Math.round(knownDuration))
                        : Math.max(1, Math.round(measuredDuration)),
                  }
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
      audio.addEventListener("durationchange", handleDurationChange);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("error", handleError);
      
      return () => {
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("durationchange", handleDurationChange);
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

  const addToQueue = (track: Track) => {
    setTracks((prev) => {
      if (prev.some((item) => item.id === track.id)) return prev;
      return [...prev, { ...track, isFavourite: track.isFavourite ?? false }];
    });
  };

  const playNext = (track: Track) => {
    setTracks((prev) => {
      const normalizedTrack = { ...track, isFavourite: track.isFavourite ?? false };
      const list = [...prev];
      const existingIndex = list.findIndex((item) => item.id === normalizedTrack.id);
      let nextCurrentIndex = currentTrackIndex;

      if (existingIndex !== -1) {
        const [existingTrack] = list.splice(existingIndex, 1);

        if (existingIndex < currentTrackIndex) {
          nextCurrentIndex = Math.max(0, currentTrackIndex - 1);
        }

        const insertAt = Math.min(nextCurrentIndex + 1, list.length);
        list.splice(insertAt, 0, existingTrack);
      } else {
        const insertAt = Math.min(nextCurrentIndex + 1, list.length);
        list.splice(insertAt, 0, normalizedTrack);
      }

      if (nextCurrentIndex !== currentTrackIndex) {
        setCurrentTrackIndex(nextCurrentIndex);
      }

      return list;
    });
  };

  const removeFromQueue = (id: string) => {
    setTracks((prev) => {
      if (prev.length <= 1) return prev;

      const removeIndex = prev.findIndex((track) => track.id === id);
      if (removeIndex === -1) return prev;

      const nextTracks = prev.filter((track) => track.id !== id);

      setCurrentTrackIndex((prevIndex) => {
        if (removeIndex < prevIndex) return prevIndex - 1;
        if (removeIndex === prevIndex) return Math.min(prevIndex, nextTracks.length - 1);
        return prevIndex;
      });

      return nextTracks;
    });
  };

  const reorderQueue = (fromQueueIndex: number, toQueueIndex: number) => {
    setTracks((prev) => {
      const queueStart = currentTrackIndex + 1;
      const fromIndex = queueStart + fromQueueIndex;
      const toIndex = queueStart + toQueueIndex;

      if (
        fromIndex < queueStart ||
        toIndex < queueStart ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const clearQueue = () => {
    setTracks((prev) => prev.slice(0, currentTrackIndex + 1));
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
        addToQueue,
        playNext,
        removeFromQueue,
        reorderQueue,
        clearQueue,
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
