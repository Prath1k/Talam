import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockTracks, Track } from "../data";

interface PlayerContextType {
  currentTrackIndex: number;
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleTrackSelect: (id: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const currentTrack = mockTracks[currentTrackIndex];

  // Auto-play next track & simulate progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTrackIndex, currentTrack.duration]);

  // Reset progress on track change
  useEffect(() => {
    setProgress(0);
  }, [currentTrackIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % mockTracks.length);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + mockTracks.length) % mockTracks.length);
    setIsPlaying(true);
  };

  const handleTrackSelect = (id: string) => {
    const index = mockTracks.findIndex(t => t.id === id);
    if (index !== -1) {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrackIndex,
        currentTrack,
        isPlaying,
        progress,
        handlePlayPause,
        handleNext,
        handlePrev,
        handleTrackSelect,
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
