-- Add location-related columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS location_updated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS neighborhood_radius integer DEFAULT 1000;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING gist (
  ll_to_earth(latitude, longitude)
); 