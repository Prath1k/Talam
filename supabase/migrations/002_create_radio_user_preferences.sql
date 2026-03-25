-- Persist user-specific radio favorites and recently played stations.
CREATE TABLE IF NOT EXISTS radio_user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  favorites JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE radio_user_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'radio_user_preferences'
      AND policyname = 'Users can select own radio preferences'
  ) THEN
    CREATE POLICY "Users can select own radio preferences"
      ON radio_user_preferences
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'radio_user_preferences'
      AND policyname = 'Users can upsert own radio preferences'
  ) THEN
    CREATE POLICY "Users can upsert own radio preferences"
      ON radio_user_preferences
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'radio_user_preferences'
      AND policyname = 'Users can update own radio preferences'
  ) THEN
    CREATE POLICY "Users can update own radio preferences"
      ON radio_user_preferences
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
