import { motion } from "motion/react";
import { Radio as RadioIcon, Play, Search, X, Heart, RotateCw, Clock3 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";

interface RadioStation {
  changeuuid: string;
  name: string;
  url_resolved: string;
  url?: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  streamCandidates: string[];
}

interface RadioLanguage {
  name: string;
  stationcount: number;
}

const RADIO_MIRRORS = [
  "https://all.api.radio-browser.info",
  "https://de1.api.radio-browser.info",
  "https://fr1.api.radio-browser.info",
];

const RADIO_CACHE_TTL_MS = 5 * 60 * 1000;
const RADIO_LANG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LANG_CACHE_KEY = "talam_radio_languages_cache_v1";
const PREFS_CACHE_KEY = "talam_radio_preferences_v1";

type StationStatus = "idle" | "connecting" | "playing" | "failed";

const SECTION_TRANSITION = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

function readCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; data: T };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Ignore localStorage failures.
  }
}

function normalizeStation(station: any, index: number): RadioStation {
  const resolved = String(station?.url_resolved || "").trim();
  const fallbackUrl = String(station?.url || "").trim();
  const streamCandidates = Array.from(new Set([resolved, fallbackUrl].filter(Boolean)));

  return {
    changeuuid: String(station?.changeuuid || station?.stationuuid || `station-${index}`),
    name: String(station?.name || "Unknown Station"),
    url_resolved: resolved || fallbackUrl,
    url: fallbackUrl,
    homepage: station?.homepage ? String(station.homepage) : "",
    favicon: station?.favicon ? String(station.favicon) : "",
    tags: station?.tags ? String(station.tags) : "",
    country: station?.country ? String(station.country) : "",
    streamCandidates,
  };
}

function normalizeLanguage(language: any): RadioLanguage {
  return {
    name: String(language?.name || "").trim(),
    stationcount: Number(language?.stationcount || 0),
  };
}

async function fetchFromMirrors(path: string) {
  for (const mirror of RADIO_MIRRORS) {
    try {
      const response = await fetch(`${mirror}${path}`);
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // Try next mirror.
    }
  }

  throw new Error("All Radio Browser mirrors failed");
}

async function probePlayableStream(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = "none";

    const cleanup = () => {
      probe.removeEventListener("canplay", onCanPlay);
      probe.removeEventListener("error", onError);
      clearTimeout(timeout);
      probe.src = "";
    };

    const onCanPlay = () => {
      cleanup();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      resolve(false);
    };

    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, 7000);

    probe.addEventListener("canplay", onCanPlay);
    probe.addEventListener("error", onError);
    probe.src = url;
    probe.load();
  });
}

async function resolveStationStream(station: RadioStation): Promise<string | null> {
  for (const candidate of station.streamCandidates) {
    const ok = await probePlayableStream(candidate);
    if (ok) return candidate;
  }
  return null;
}

async function pollNowPlaying(station: RadioStation): Promise<string> {
  // Best effort from radio-browser station metadata.
  try {
    const data = await fetchFromMirrors(`/json/stations/byuuid/${encodeURIComponent(station.changeuuid)}`);
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      const candidates = [
        entry?.title,
        entry?.lastsong,
        entry?.songtitle,
        entry?.currenttrack,
        entry?.nowplaying,
      ];
      const found = candidates.find((v: unknown) => typeof v === "string" && v.trim());
      if (typeof found === "string" && found.trim()) return found.trim();
    }
  } catch {
    // Ignore and try headers.
  }

  // Best effort from stream response headers (depends on CORS + stream support).
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(station.url_resolved, {
      method: "GET",
      headers: { "Icy-MetaData": "1" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const headerCandidates = [
      response.headers.get("x-current-song"),
      response.headers.get("x-now-playing"),
      response.headers.get("icy-description"),
      response.headers.get("icy-name"),
    ];
    const found = headerCandidates.find((v) => Boolean(v && v.trim()));
    if (found) return found;
  } catch {
    // Some streams disallow CORS; silent fallback below.
  }

  return "Now playing metadata is unavailable for this stream.";
}

export function Radio() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [recentStations, setRecentStations] = useState<RadioStation[]>([]);
  const [languages, setLanguages] = useState<RadioLanguage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageQuery, setLanguageQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingStations, setRefreshingStations] = useState(false);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [stationStatus, setStationStatus] = useState<Record<string, StationStatus>>({});
  const [stationErrors, setStationErrors] = useState<Record<string, string>>({});
  const [activeStationId, setActiveStationId] = useState("");
  const [nowPlayingText, setNowPlayingText] = useState("");
  const [pollingNowPlaying, setPollingNowPlaying] = useState(false);
  const [persistReady, setPersistReady] = useState(false);
  const { playDirectly } = usePlayer();
  const { user } = useAuth();

  const stationMap = useMemo(() => {
    const map = new Map<string, RadioStation>();
    stations.forEach((station) => map.set(station.changeuuid, station));
    recentStations.forEach((station) => {
      if (!map.has(station.changeuuid)) map.set(station.changeuuid, station);
    });
    return map;
  }, [stations, recentStations]);

  const activeStation = activeStationId ? stationMap.get(activeStationId) || null : null;

  const stationsCacheKey = useMemo(
    () => `talam_radio_stations_cache_v1:${languageQuery.trim().toLowerCase()}|${searchQuery.trim().toLowerCase()}`,
    [languageQuery, searchQuery]
  );

  useEffect(() => {
    const localPrefs = readCache<{ favorites: string[]; recent: RadioStation[] }>(PREFS_CACHE_KEY, 365 * 24 * 60 * 60 * 1000);
    if (localPrefs) {
      setFavoriteIds(Array.isArray(localPrefs.favorites) ? localPrefs.favorites : []);
      setRecentStations(Array.isArray(localPrefs.recent) ? localPrefs.recent.map((s, i) => normalizeStation(s, i)) : []);
    }

    const loadSupabasePrefs = async () => {
      if (!user?.id || user.isGuest) {
        setPersistReady(true);
        return;
      }

      try {
        const { data } = await supabase
          .from("radio_user_preferences")
          .select("favorites,recent")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          const supaFavorites = Array.isArray(data.favorites) ? data.favorites.filter((id: unknown) => typeof id === "string") : [];
          const supaRecent = Array.isArray(data.recent)
            ? data.recent.map((item: any, i: number) => normalizeStation(item, i))
            : [];

          setFavoriteIds(supaFavorites);
          setRecentStations(supaRecent);
        }
      } catch (error) {
        console.error("Failed to load radio preferences:", error);
      } finally {
        setPersistReady(true);
      }
    };

    loadSupabasePrefs();
  }, [user?.id, user?.isGuest]);

  useEffect(() => {
    if (!persistReady) return;

    writeCache(PREFS_CACHE_KEY, {
      favorites: favoriteIds,
      recent: recentStations,
    });

    const persistSupabase = async () => {
      if (!user?.id || user.isGuest) return;

      try {
        await supabase.from("radio_user_preferences").upsert(
          {
            user_id: user.id,
            favorites: favoriteIds,
            recent: recentStations,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      } catch (error) {
        console.error("Failed to save radio preferences:", error);
      }
    };

    const timeout = setTimeout(persistSupabase, 350);
    return () => clearTimeout(timeout);
  }, [favoriteIds, recentStations, user?.id, user?.isGuest, persistReady]);

  useEffect(() => {
    const fetchLanguages = async () => {
      const cached = readCache<RadioLanguage[]>(LANG_CACHE_KEY, RADIO_LANG_CACHE_TTL_MS);
      if (cached && cached.length > 0) {
        setLanguages(cached);
        setLoadingLanguages(false);
      }

      try {
        const data = await fetchFromMirrors("/json/languages");
        if (!Array.isArray(data)) {
          setLanguages([]);
          return;
        }

        const parsed = data
          .map(normalizeLanguage)
          .filter((language) => language.name)
          .sort((a, b) => b.stationcount - a.stationcount)
          .slice(0, 300);

        setLanguages(parsed);
        writeCache(LANG_CACHE_KEY, parsed);
      } catch (error) {
        console.error("Failed to fetch radio languages:", error);
      } finally {
        setLoadingLanguages(false);
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const fetchStations = async () => {
        const cached = readCache<RadioStation[]>(stationsCacheKey, RADIO_CACHE_TTL_MS);
        const hasCached = Boolean(cached && cached.length > 0);

        if (cached && cached.length > 0) {
          setStations(cached.map((station, index) => normalizeStation(station, index)));
          setLoading(false);
          setRefreshingStations(true);
        } else {
          setLoading(true);
          setRefreshingStations(false);
        }

        setErrorMessage("");

        try {
          const params = new URLSearchParams({
            hidebroken: "true",
            order: "clickcount",
            reverse: "true",
            limit: "60",
          });

          const nameValue = searchQuery.trim();
          const languageValue = languageQuery.trim();

          if (nameValue) params.set("name", nameValue);
          if (languageValue) params.set("language", languageValue);

          const queryPath =
            languageValue && !nameValue
              ? `/json/stations/bylanguage/${encodeURIComponent(languageValue)}?${params.toString()}`
              : `/json/stations/search?${params.toString()}`;

          const data = await fetchFromMirrors(queryPath);
          if (!Array.isArray(data)) {
            setStations([]);
            setErrorMessage("No radio stations are available right now.");
            return;
          }

          const deduped = new Map<string, RadioStation>();
          data.forEach((station, index) => {
            const normalized = normalizeStation(station, index);
            if (!normalized.url_resolved) return;
            if (!deduped.has(normalized.changeuuid)) {
              deduped.set(normalized.changeuuid, normalized);
            }
          });

          const parsedStations = Array.from(deduped.values());

          if (parsedStations.length === 0) {
            setErrorMessage("No stations found. Try a different language or station name.");
          }

          setStations(parsedStations);
          writeCache(stationsCacheKey, parsedStations);
        } catch (error) {
          console.error("Failed to fetch radio stations:", error);

          if (hasCached) {
            setErrorMessage("Network issue detected. Showing cached stations.");
          } else {
            setStations([]);
            setErrorMessage("Failed to load live radio stations.");
          }
        } finally {
          setLoading(false);
          setRefreshingStations(false);
        }
      };

      fetchStations();
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery, languageQuery, stationsCacheKey]);

  useEffect(() => {
    if (!activeStation) {
      setNowPlayingText("");
      return;
    }

    let cancelled = false;

    const runPoll = async () => {
      setPollingNowPlaying(true);
      const text = await pollNowPlaying(activeStation);
      if (!cancelled) {
        setNowPlayingText(text);
        setPollingNowPlaying(false);
      }
    };

    runPoll();
    const interval = setInterval(runPoll, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeStation]);

  const toggleFavorite = (stationId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(stationId) ? prev.filter((id) => id !== stationId) : [stationId, ...prev]
    );
  };

  const addRecent = (station: RadioStation) => {
    setRecentStations((prev) => {
      const deduped = [station, ...prev.filter((item) => item.changeuuid !== station.changeuuid)];
      return deduped.slice(0, 10);
    });
  };

  const handlePlayStation = async (station: RadioStation) => {
    setStationStatus((prev) => ({ ...prev, [station.changeuuid]: "connecting" }));
    setStationErrors((prev) => ({ ...prev, [station.changeuuid]: "" }));

    const playableUrl = await resolveStationStream(station);
    if (!playableUrl) {
      setStationStatus((prev) => ({ ...prev, [station.changeuuid]: "failed" }));
      setStationErrors((prev) => ({
        ...prev,
        [station.changeuuid]: "Stream failed. Tap Retry to try fallback links.",
      }));
      return;
    }

    const stationWithChosenUrl: RadioStation = {
      ...station,
      url_resolved: playableUrl,
      streamCandidates: Array.from(new Set([playableUrl, ...station.streamCandidates])),
    };

    playDirectly({
      id: stationWithChosenUrl.changeuuid,
      title: stationWithChosenUrl.name,
      artist: `Live Radio ${stationWithChosenUrl.country ? `(${stationWithChosenUrl.country})` : ''}`,
      album: "Live Stream",
      coverUrl: stationWithChosenUrl.favicon || "https://images.unsplash.com/photo-1598555542823-3dbca95dbb09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080", // fallback antenna cover
      songUrl: stationWithChosenUrl.url_resolved,
      duration: 0, // infinity for live radio effectively, but we use 0 to indicate stream
    });

    addRecent(stationWithChosenUrl);
    setActiveStationId(stationWithChosenUrl.changeuuid);
    setStationStatus((prev) => ({ ...prev, [station.changeuuid]: "playing" }));
  };

  const favoriteStations = useMemo(() => {
    const ids = new Set(favoriteIds);
    const uniqueStations = Array.from(stationMap.values());
    return uniqueStations.filter((station) => ids.has(station.changeuuid));
  }, [favoriteIds, stationMap]);

  const titleForStationList = languageQuery
    ? `${languageQuery} Stations`
    : searchQuery
      ? "Search Results"
      : "Top Global Stations";

  const renderStationCard = (station: RadioStation, idx: number) => {
    const isFavourite = favoriteIds.includes(station.changeuuid);
    const status = stationStatus[station.changeuuid] || "idle";
    const statusText =
      status === "connecting"
        ? "Connecting..."
        : status === "playing"
          ? "Playing"
          : status === "failed"
            ? "Unavailable"
            : "Ready";

    return (
      <motion.div
        key={station.changeuuid}
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.997 }}
        transition={{ delay: idx * 0.03, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all duration-300 flex h-36 smooth-card"
      >
        <button
          onClick={() => handlePlayStation(station)}
          className="w-32 h-36 flex-shrink-0 relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-2 smooth-interactive"
        >
          {station.favicon ? (
            <img
              src={station.favicon}
              alt={station.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1598555542823-3dbca95dbb09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
              }}
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-screen group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <RadioIcon className="w-12 h-12 text-zinc-400" />
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="w-8 h-8 text-white fill-current" />
          </div>
        </button>

        <div className="flex flex-col justify-center p-4 flex-1 min-w-0 bg-gradient-to-r from-transparent to-black/5 dark:to-white/5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              LIVE {station.country && `• ${station.country}`}
            </span>
            <button
              onClick={() => toggleFavorite(station.changeuuid)}
              className="text-zinc-400 hover:text-rose-500 transition-colors duration-200 smooth-interactive"
              title={isFavourite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-4 h-4 ${isFavourite ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>

          <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
            {station.name}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-snug mb-2">
            {station.tags ? station.tags.replace(/,/g, " • ") : "General Radio"}
          </p>

          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${status === "failed" ? "text-amber-600" : "text-zinc-500 dark:text-zinc-400"}`}>
              {statusText}
            </span>
            {status === "failed" && (
              <button
                onClick={() => handlePlayStation(station)}
                className="text-rose-500 hover:text-rose-400 font-semibold smooth-interactive"
              >
                Retry
              </button>
            )}
          </div>

          {stationErrors[station.changeuuid] && (
            <p className="text-[11px] text-amber-600 mt-1 truncate">{stationErrors[station.changeuuid]}</p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white/60 dark:bg-black/60 backdrop-blur-xl p-8 lg:p-12 relative z-10 custom-scrollbar">
      <motion.div
        className="max-w-6xl mx-auto space-y-12 pb-24"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <motion.header
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SECTION_TRANSITION}
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100 flex items-center gap-4">
              <RadioIcon className="w-10 h-10 text-rose-500" />
              Live Radio
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              Search stations by name and language from Radio Browser.
            </p>
          </div>
        </motion.header>

        {activeStation && (
          <motion.section
            className="bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SECTION_TRANSITION}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">Now Playing</p>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{activeStation.name}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{nowPlayingText || "Fetching metadata..."}</p>
              </div>
              <button
                onClick={async () => {
                  if (!activeStation) return;
                  setPollingNowPlaying(true);
                  const text = await pollNowPlaying(activeStation);
                  setNowPlayingText(text);
                  setPollingNowPlaying(false);
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-rose-500 transition-colors duration-200 smooth-interactive"
              >
                <RotateCw className={`w-4 h-4 ${pollingNowPlaying ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </motion.section>
        )}

        <motion.section
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SECTION_TRANSITION}
        >
          <div className="lg:col-span-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">Search Station</label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. BBC, Mirchi, Jazz FM"
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-zinc-900 dark:text-zinc-100 smooth-interactive"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 smooth-interactive"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2 block">Language</label>
            <input
              list="radio-languages"
              value={languageQuery}
              onChange={(e) => setLanguageQuery(e.target.value)}
              placeholder={loadingLanguages ? "Loading languages..." : "e.g. Telugu, English, Hindi"}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-3 text-zinc-900 dark:text-zinc-100 smooth-interactive"
            />
            <datalist id="radio-languages">
              {languages.map((language) => (
                <option key={language.name} value={language.name}>
                  {language.name}
                </option>
              ))}
            </datalist>
          </div>
        </motion.section>

        <motion.section
          className="flex flex-wrap items-center gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SECTION_TRANSITION}
        >
          <button
            onClick={() => {
              setLanguageQuery("Telugu");
              setSearchQuery("");
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-rose-400 hover:text-rose-500 transition-colors duration-200 smooth-interactive"
          >
            Telugu
          </button>
          <button
            onClick={() => {
              setLanguageQuery("English");
              setSearchQuery("");
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-rose-400 hover:text-rose-500 transition-colors duration-200 smooth-interactive"
          >
            English
          </button>
          <button
            onClick={() => {
              setLanguageQuery("");
              setSearchQuery("");
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-rose-400 hover:text-rose-500 transition-colors duration-200 smooth-interactive"
          >
            Reset
          </button>
        </motion.section>

        {favoriteStations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Favorite Stations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteStations.map((station, idx) => renderStationCard(station, idx))}
            </div>
          </section>
        )}

        {recentStations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock3 className="w-5 h-5 text-zinc-500" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Recently Played</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentStations.map((station, idx) => renderStationCard(station, idx))}
            </div>
          </section>
        )}

        {/* Stations Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {titleForStationList}
            </h3>
            {refreshingStations && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Refreshing...
              </motion.span>
            )}
          </div>
          
          {loading ? (
             <div className="text-zinc-500 animate-pulse flex items-center gap-2 font-semibold">Tuning frequencies...</div>
          ) : (
            stations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stations.map((station, idx) => renderStationCard(station, idx))}
            </div>
            ) : (
              <div className="text-zinc-500 dark:text-zinc-400 font-medium bg-white/50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                {errorMessage || "No stations returned by the radio API."}
              </div>
            )
          )}
        </section>

      </motion.div>
    </div>
  );
}
