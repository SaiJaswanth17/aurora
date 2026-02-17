-- Add last_seen column to profiles table for presence tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Create index on last_seen for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Update existing users' last_seen to current time
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;
