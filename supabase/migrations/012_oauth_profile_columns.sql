-- Add OAuth-related columns to profiles table for multi-auth support
-- Discord Server ID: 1201451443031375942
-- Titans Member Role ID: 1241839380935610398

-- Discord OAuth columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_titans_role BOOLEAN DEFAULT FALSE;

-- Whop OAuth columns  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whop_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whop_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whop_avatar TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whop_active_products JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_whop_membership BOOLEAN DEFAULT FALSE;

-- Indexes for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON profiles(discord_id);
CREATE INDEX IF NOT EXISTS idx_profiles_whop_id ON profiles(whop_id);

-- Comments for documentation
COMMENT ON COLUMN profiles.discord_id IS 'Discord user ID for OAuth login';
COMMENT ON COLUMN profiles.has_titans_role IS 'Whether user has Titans Member role in Discord (role ID: 1241839380935610398)';
COMMENT ON COLUMN profiles.whop_id IS 'Whop user ID for OAuth login';
COMMENT ON COLUMN profiles.has_whop_membership IS 'Whether user has active Whop membership';

