
# Talam

Talam is a modern web music player built with React + Vite. It supports local library playback, playlist browsing, queue management, lyrics/metadata enrichment, and live radio streaming.

## Highlights

- Local music discovery from `public/music/**`
- Multiple audio formats: `mp3`, `mp4`, `m4a`, `wav`, `flac`, `webm`
- Smart queue controls:
- Play next
- Add to queue
- Remove from queue
- Drag-and-drop reorder
- Clear queue
- Save queue as playlist
- Global queue panel:
- Desktop right-side drawer
- Mobile bottom-sheet style panel
- Playlist browsing with per-track actions
- Route-level page transitions and polished UI motion
- Metadata enrichment (cover, artist, album, lyrics, artist info, youtube link)
- Metadata caching in Supabase to reduce repeated API calls
- Advanced radio page:
- Station search and language filtering
- Favorites and recents persistence
- Now-playing polling and stream fallback/retry behavior

## Tech Stack

- React 18 + TypeScript
- Vite 6
- React Router 7
- Motion (animations)
- Supabase (client + SQL migrations)

## Project Structure

- `src/app/context/PlayerContext.tsx`: Playback and queue state management
- `src/app/pages/Home.tsx`: Main player/home view
- `src/app/pages/Browse.tsx`: Playlist and saved-queue browsing
- `src/app/pages/Radio.tsx`: Live radio discovery/player
- `src/app/layouts/RootLayout.tsx`: App shell + global queue panel
- `src/app/utils/metadata.ts`: Metadata and lyrics fetching
- `src/app/utils/cacheMetadata.ts`: Supabase metadata cache helpers
- `supabase/migrations/`: SQL migrations for app data

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build locally

```bash
npm run preview
```

### 5. Start Node server

```bash
npm run start
```

## Environment Variables

Create a `.env` file in the project root if you want custom keys/URLs.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_KSOFT_API_KEY=
VITE_TASTEDIVE_API_KEY=
```

Notes:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are optional if fallback project credentials are available in the environment.
- `VITE_KSOFT_API_KEY` and `VITE_TASTEDIVE_API_KEY` are optional; metadata flow includes fallbacks.

## Supabase Migrations

Run or apply the SQL files in `supabase/migrations/`:

- `001_create_track_metadata_cache.sql`
- `002_create_radio_user_preferences.sql`

These migrations add:

- Track metadata cache table (lyrics/image/info caching)
- Radio user preferences table (favorites/recent with RLS)

## Adding Music

Place audio files under:

```text
public/music/<Language-or-Playlist>/<file>.<ext>
```

Example:

```text
public/music/Telugu/song-01.mp3
public/music/English/song-02.webm
```

The app auto-discovers these files and groups them by folder as playlist/album buckets.

## Notes

- Queue-saved playlists are stored locally in browser storage and shown in Browse.
- Media durations for local files are measured at runtime for better accuracy.
  
