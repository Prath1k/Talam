// Get API keys from environment
const KSOFT_API_KEY = import.meta.env.VITE_KSOFT_API_KEY || "";
const TASTEDIVE_API_KEY = import.meta.env.VITE_TASTEDIVE_API_KEY || "";

export async function fetchTrackMetadata(title: string) {
  try {
    console.log("Fetching metadata for:", title);
    // Clean up title to improve search accuracy
    const cleanTitle = title
      .replace(/128KBPS|320KBPS|192KBPS|Video|Song|Full|HD|4K|Lyrics|Lyrical/gi, "")
      .replace(/_/g, " ")
      .trim();

    let trackName = "";
    let artistName = "";
    let albumName = "";
    let highResCover = "";

    // 1. Fetch basic metadata (Cover, Artist, Album)
    // Try JioSaavn API first (via popular public instance) for better global/Indian music results
    try {
      const saavnRes = await fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanTitle)}&limit=1`);
      if (saavnRes.ok) {
        const saavnData = await saavnRes.json();
        if (saavnData.status === "SUCCESS" && saavnData.data && saavnData.data.results && saavnData.data.results.length > 0) {
          const result = saavnData.data.results[0];
          trackName = result.name;
          // Primary artist info is returned as a string
          artistName = result.primaryArtists || "Unknown Artist";
          albumName = result.album?.name || "Unknown Album";
          
          if (result.image) {
            if (Array.isArray(result.image) && result.image.length > 0) {
               // Usually the last item is the highest quality (e.g., 500x500)
               highResCover = result.image[result.image.length - 1].link || result.image[result.image.length - 1].url;
            } else if (typeof result.image === 'string') {
               let imgUrl = result.image;
               highResCover = imgUrl.replace('150x150', '500x500').replace('50x50', '500x500');
            }
          }
        }
      }
    } catch (e) {
      console.warn("JioSaavn fetch failed:", e);
    }

    // Fallback to iTunes API if JioSaavn failed or found nothing
    if (!trackName) {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitle)}&media=music&limit=1`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results && itunesData.results.length > 0) {
          const result = itunesData.results[0];
          trackName = result.trackName;
          artistName = result.artistName;
          albumName = result.collectionName;
          highResCover = result.artworkUrl100.replace('100x100bb', '600x600bb');
        }
      }
    }
    
    // If we still found nothing, we can't proceed with enhancements
    if (!trackName) return null;

    // 2. Fetch lyrics (KSoft -> Lyrics.ovh -> LRCLIB)
    let lyrics = "";
    
    // Try KSoft API first (if API key is available)
    if (KSOFT_API_KEY) {
      try {
        const searchQuery = `${artistName} ${trackName}`;
        const ksoftRes = await fetch(
          `https://api.ksoft.si/lyrics/search?query=${encodeURIComponent(searchQuery)}&limit=1`,
          { headers: { "Authorization": `Bearer ${KSOFT_API_KEY}` } }
        );
        if (ksoftRes.ok) {
          const ksoftData = await ksoftRes.json();
          if (ksoftData.data && ksoftData.data.length > 0) {
            lyrics = ksoftData.data[0].lyrics || "";
          }
        }
      } catch (e) { console.warn("KSoft lyrics fetch failed:", e); }
    }
    
    // Fallback to Lyrics.ovh
    if (!lyrics) {
      try {
        const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(trackName)}`);
        if (ovhRes.ok) {
          const ovhData = await ovhRes.json();
          lyrics = ovhData.lyrics || "";
        }
      } catch (e) { console.warn("Lyrics.ovh fetch failed:", e); }
    }
    
    // Fallback to LRCLIB
    if (!lyrics) {
      try {
        const lrcRes = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}`);
        if (lrcRes.ok) {
          const lrcData = await lrcRes.json();
          lyrics = lrcData.syncedLyrics || lrcData.plainLyrics || "";
        }
      } catch (e) { console.warn("LRCLIB lyrics fetch failed:", e); }
    }

    // 3. Fetch Artist Info & Youtube Link via TasteDive API
    let artistInfo = "";
    let youtubeUrl = "";
    
    if (TASTEDIVE_API_KEY) {
      try {
        const tdRes = await fetch(`https://tastedive.com/api/similar?q=${encodeURIComponent(artistName)}&type=music&info=1&k=${TASTEDIVE_API_KEY}`);
        if (tdRes.ok) {
          const tdData = await tdRes.json();
          // TasteDive returns the queried artist info in `Similar.Info[0]`
          if (tdData.Similar && tdData.Similar.Info && tdData.Similar.Info.length > 0) {
            const info = tdData.Similar.Info[0];
            artistInfo = info.wTeaser || "";
            youtubeUrl = info.yUrl || "";
          }
        }
      } catch (e) { console.warn("TasteDive fetch failed:", e); }
    }

    return {
       title: trackName,
       artist: artistName,
       album: albumName,
       coverUrl: highResCover || "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
       lyrics: lyrics,
       artistInfo: artistInfo,
       youtubeUrl: youtubeUrl
    };

  } catch (error) {
    console.error("Metadata fetch failed", error);
  }
  return null;
}
