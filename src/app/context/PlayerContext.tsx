import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockTracks, Track as BaseTrack } from "../data";
import { supabase } from "../utils/supabase";
import { fetchTrackMetadata } from "../utils/metadata";

export interface Track extends BaseTrack {
  songUrl?: string;
  lyrics?: string;
  fetchedMetadata?: boolean;
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
  
  const currentTrack = tracks[currentTrackIndex] || mockTracks[0];

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

  // Handle actual Audio playback
  useEffect(() => {
    if (currentTrack.songUrl) {
      audio.src = currentTrack.songUrl;
      audio.load();
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
    let timer: NodeJS.Timeout;
    
    if (currentTrack.songUrl) {
      const updateProgress = () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
            setProgress(audio.currentTime);
            setDuration(audio.duration);
        }
      };
      
      const handleLoadedMetadata = () => {
         if (!isNaN(audio.duration)) {
             setDuration(audio.duration);
         }
      };

      const handleEnded = () => {
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
