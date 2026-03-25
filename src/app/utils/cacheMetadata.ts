import { supabase } from "./supabase";

export interface CachedMetadata {
  title: string;
  artist: string;
  lyrics?: string;
  cover_url?: string;
  artist_info?: string;
  youtube_url?: string;
  album_name?: string;
}

/**
 * Check if metadata exists in cache and is not expired
 */
export async function getCachedMetadata(title: string, artist: string): Promise<CachedMetadata | null> {
  try {
    const { data, error } = await supabase
      .from("track_metadata_cache")
      .select("*")
      .eq("title", title)
      .eq("artist", artist)
      .gt("expires_at", new Date().toISOString()) // Only get non-expired cache
      .maybeSingle();

    if (error) {
      console.warn("Cache lookup error:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.warn("Error checking metadata cache:", err);
    return null;
  }
}

/**
 * Save metadata to cache
 */
export async function cacheMetadata(metadata: {
  title: string;
  artist: string;
  lyrics?: string;
  cover_url?: string;
  artist_info?: string;
  youtube_url?: string;
  album_name?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("track_metadata_cache")
      .upsert({
        title: metadata.title,
        artist: metadata.artist,
        lyrics: metadata.lyrics || null,
        cover_url: metadata.cover_url || null,
        artist_info: metadata.artist_info || null,
        youtube_url: metadata.youtube_url || null,
        album_name: metadata.album_name || null,
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }, { onConflict: "title,artist" });

    if (error) {
      console.warn("Cache save error:", error);
      return false;
    }

    console.log(`Cached metadata for: ${metadata.artist} - ${metadata.title}`);
    return true;
  } catch (err) {
    console.warn("Error saving metadata cache:", err);
    return false;
  }
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const { error } = await supabase
      .from("track_metadata_cache")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.warn("Error clearing expired cache:", error);
    }
  } catch (err) {
    console.warn("Error clearing expired cache:", err);
  }
}
