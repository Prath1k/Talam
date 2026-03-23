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
  toggleLyrics: () => void;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleTrackSelect: (id: string) => void;
  playDirectly: (track: Track) => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (vol: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(mockTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7); // default to 70% volume
  const [showLyrics, setShowLyrics] = useState(false);
  const [audio] = useState(new Audio());
  
  const currentTrack = tracks[currentTrackIndex] || mockTracks[0];

  // Fetch missing metadata (Album Art, Artist, Lyrics) for dynamically found local tracks
  useEffect(() => {
    let isMounted = true;
    
    const enhanceTracks = async () => {
      // Find tracks that need metadata (local dynamic tracks that haven't been fetched yet)
      const needsMetadata = tracks.some(t => t.id.startsWith('local-') && !t.fetchedMetadata);
      if (!needsMetadata) return;

      const enhancedTracks = await Promise.all(
        tracks.map(async (track) => {
          if (track.id.startsWith('local-') && !track.fetchedMetadata) {
            const meta = await fetchTrackMetadata(track.title);
            if (meta) {
              return { ...track, ...meta, fetchedMetadata: true };
            }
            // Mark as fetched even if it fails, so we don't infinitely retry
            return { ...track, fetchedMetadata: true };
          }
          return track;
        })
      );
      
      if (isMounted) {
        setTracks(enhancedTracks);
      }
    };
    
    enhanceTracks();
    
    return () => {
      isMounted = false;
    };
  }, [tracks]);

  // Apply volume changes to actual audio object
  useEffect(() => {
    audio.volume = volume;
  }, [volume, audio]);

  // Fetch tracks from Supabase on mount
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { data, error } = await supabase.from("tracks").select("*");
        if (data && data.length > 0) {
          setTracks(data);
        }
      } catch (err) {
        console.error("Failed to fetch tracks:", err);
      }
    };
    fetchTracks();
  }, []);

  // Handle actual Audio playback if songUrl exists, otherwise simulate
  useEffect(() => {
    if (currentTrack.songUrl) {
      audio.src = currentTrack.songUrl;
      audio.load();
      if (isPlaying) {
        audio.play().catch(e => {
           console.error("Audio playback error:", e);
           // Fallback if the song/radio stream is broken or blocked
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

      const handleEnded = () => handleNext();
      
      const handleError = () => {
         console.warn(`Fallback triggered: Failed to load ${currentTrack.songUrl}`);
         setIsPlaying(false);
         // You could automatically handleNext() here to skip broken radio links!
         // handleNext(); 
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
              handleNext();
              return 0;
            }
            return prev + 1;
          });
        }, 1000);
      }
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentTrack, currentTrackIndex, audio, duration]);

  // Reset progress on track change
  useEffect(() => {
    setProgress(0);
  }, [currentTrackIndex]);

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
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  };

  const handleTrackSelect = (id: string) => {
    const index = tracks.findIndex(t => t.id === id);
    if (index !== -1) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const playDirectly = (track: Track) => {
    // Check if it's already in the tracklist
    const existingIndex = tracks.findIndex(t => t.id === track.id);
    if (existingIndex !== -1) {
      setCurrentTrackIndex(existingIndex);
    } else {
      // Add it to the top of the tracklist and play it
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
        toggleLyrics,
        handlePlayPause,
        handleNext,
        handlePrev,
        handleTrackSelect,
        playDirectly,
        handleSeek,
        handleVolumeChange,
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
