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
const autoFoundFiles = import.meta.glob('/public/music/**/*.{mp3,mp4,m4a,wav,flac}');

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
    coverUrl: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", // default placeholder cover
    songUrl: urlPath,
    duration: 180, // We can't automatically know duration without loading, so default to 3 minutes
  };
});

export const mockTracks: Track[] = [
  ...localDynamicTracks,
  {
    id: "1",
    title: "Midnight Drives",
    artist: "The Midnight Echoes",
    album: "Neon Nights",
    coverUrl: "https://images.unsplash.com/photo-1683363520390-bbe428d9be58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwc3ludGh3YXZlJTIwYWxidW0lMjBjb3ZlcnxlbnwxfHx8fDE3NzQxODAwMDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    duration: 214,
  },
  {
    id: "2",
    title: "Summer Breeze",
    artist: "Coastal Dreams",
    album: "Golden Hour",
    coverUrl: "https://images.unsplash.com/photo-1617431014998-f4f219965a1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMHBvcCUyMGFsYnVtJTIwY292ZXJ8ZW58MXx8fHwxNzc0MTYyNjIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
    duration: 185,
  },
  {
    id: "3",
    title: "Smooth Notes",
    artist: "The Jazz Collective",
    album: "Evening Standard",
    coverUrl: "https://images.unsplash.com/photo-1762704452358-1a65ea252529?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwY2xhc3NpY2FsJTIwYWxidW0lMjBjb3ZlcnxlbnwxfHx8fDE3NzQxODAwMDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    duration: 256,
  },
  {
    id: "4",
    title: "Acoustic Whispers",
    artist: "Elara Rivers",
    album: "Wanderlust",
    coverUrl: "https://images.unsplash.com/photo-1681390609339-ca1c27af7a4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY291c3RpYyUyMGd1aXRhciUyMGxhbmRzY2FwZSUyMGFsYnVtJTIwY292ZXJ8ZW58MXx8fHwxNzc0MTgwMDA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    duration: 198,
  },
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
  {
    id: "a1",
    title: "Midnight Sessions",
    artist: "The Velvet Keys",
    coverUrl: "https://images.unsplash.com/photo-1732732929665-0f3451848e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljYWwlMjBwaWFub3xlbnwxfHx8fDE3NzQxODA0MDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "a2",
    title: "Neon Dreams",
    artist: "Synth City Boys",
    coverUrl: "https://images.unsplash.com/photo-1766360884068-b83757593c2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwY2x1YiUyMG5lb258ZW58MXx8fHwxNzc0MTgwNDA5fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "a3",
    title: "Summer Hits",
    artist: "Various Artists",
    coverUrl: "https://images.unsplash.com/photo-1684679106461-dae134df8da6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3AlMjBjb25jZXJ0JTIwY3Jvd2R8ZW58MXx8fHwxNzc0MTgwNDA5fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "a4",
    title: "Golden Hour",
    artist: "Coastal Dreams",
    coverUrl: "https://images.unsplash.com/photo-1617431014998-f4f219965a1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpZSUyMHBvcCUyMGFsYnVtJTIwY292ZXJ8ZW58MXx8fHwxNzc0MTYyNjIyfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
];
