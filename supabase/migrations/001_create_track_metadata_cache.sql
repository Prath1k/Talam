-- Create track metadata cache table
-- This table stores fetched metadata (lyrics, cover images) to avoid repeated API calls

CREATE TABLE IF NOT EXISTS track_metadata_cache (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics TEXT,
  cover_url TEXT,
  artist_info TEXT,
  youtube_url TEXT,
  album_name TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
  UNIQUE(title, artist)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_track_metadata_title_artist ON track_metadata_cache(title, artist);
CREATE INDEX IF NOT EXISTS idx_track_metadata_expires_at ON track_metadata_cache(expires_at);

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_metadata()
RETURNS void AS $$
BEGIN
  DELETE FROM track_metadata_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
