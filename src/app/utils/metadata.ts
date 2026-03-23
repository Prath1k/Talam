export async function fetchTrackMetadata(title: string) {
  try {
    // Clean up title to improve search accuracy
    const cleanTitle = title
      .replace(/128KBPS|320KBPS|192KBPS|Video|Song|Full|HD|4K|Lyrics|Lyrical/gi, "")
      .replace(/_/g, " ")
      .trim();

    // 1. Fetch from iTunes API (No API Key required)
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&media=music&limit=1`);
    if (!itunesRes.ok) return null;
    
    const itunesData = await itunesRes.json();
    
    if (itunesData.results && itunesData.results.length > 0) {
      const result = itunesData.results[0];
      
      // Get higher resolution cover art
      const highResCover = result.artworkUrl100.replace('100x100bb', '600x600bb');
      
      // 2. Fetch lyrics from LRCLIB (No API Key required)
      let lyrics = "";
      try {
         const lrcRes = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(result.artistName)}&track_name=${encodeURIComponent(result.trackName)}`);
         if (lrcRes.ok) {
             const lrcData = await lrcRes.json();
             // Use synced lyrics if available, otherwise fallback to plain text
             lyrics = lrcData.syncedLyrics || lrcData.plainLyrics || "";
         }
      } catch (e) {
         console.warn("Lyrics fetch failed:", e);
      }

      return {
         title: result.trackName,         // Use official track name
         artist: result.artistName,       // Use official artist name
         album: result.collectionName,    // Use official album name
         coverUrl: highResCover,
         lyrics: lyrics,
      };
    }
  } catch (error) {
    console.error("Metadata fetch failed", error);
  }
  return null;
}
