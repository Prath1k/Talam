export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  songUrl?: string; // Add this!
  duration: number; // in seconds
  isFavourite?: boolean;
  lyrics?: string;
  artistInfo?: string;
  youtubeUrl?: string;
  fetchedMetadata?: boolean;
}

// 1. Automatically find all songs in public/music/ using Vite
const autoFoundFiles = (import.meta as any).glob('/public/music/**/*.{mp3,mp4,m4a,wav,flac,webm}');

const localDynamicTracks: Track[] = Object.keys(autoFoundFiles).map((filePath, index) => {
  // filePath is something like "/public/music/telugu/my_song.mp4"
  const urlPath = filePath.replace('/public', '');
  
  // Extract folder name as playlist/album name and file name as title
  const parts = urlPath.split('/');
  const fileName = parts.pop() || '';
  const folderName = parts.pop() || 'Unknown Album';
  
  // Format the file name to look like a title (remove extension and replace underscores)
  const title = fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ");

  // Format folder name to be capitalized nice-looking text
  const albumName = folderName.charAt(0).toUpperCase() + folderName.slice(1);

  return {
    id: `local-${index}`,
    title: title,
    artist: "Local Artist", // Default fallback
    album: albumName,
    coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", // default cover for local files
    songUrl: urlPath,
    duration: 0, // Measured at runtime from the actual media file
  };
});

export const mockTracks: Track[] = [
  ...localDynamicTracks,
];

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
}

// Group our dynamic local folders into "Albums"/"Playlists"
const localDynamicAlbums: Album[] = [];
const seenAlbums = new Set<string>();

localDynamicTracks.forEach((track) => {
  if (!seenAlbums.has(track.album)) {
    seenAlbums.add(track.album);
    localDynamicAlbums.push({
      id: `local-album-${track.album}`,
      title: track.album,
      artist: "Local Playlist",
      coverUrl: track.coverUrl, // We re-use the track's cover
    });
  }
});

export const mockAlbums: Album[] = [
  ...localDynamicAlbums,
];
