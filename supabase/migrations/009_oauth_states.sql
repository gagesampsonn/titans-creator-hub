-- ============================================
-- OAUTH STATES TABLE
-- Temporary storage for OAuth state parameters
-- Used for CSRF protection during OAuth flow
-- ============================================

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  csrf TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok_shop', 'tiktok_creator', 'google')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Index for fast lookups
  CONSTRAINT oauth_states_state_key UNIQUE (state)
);

-- Enable RLS
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service role can manage oauth states (no direct client access)
-- This table is managed entirely server-side

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_provider ON oauth_states(provider);

-- Function to clean up expired states (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM oauth_states
  WHERE expires_at < NOW()
  RETURNING 1 INTO deleted_count;
  
  RETURN COALESCE(deleted_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENT: This table stores temporary OAuth state
-- parameters for CSRF protection. States expire
-- after 10 minutes and should be cleaned up
-- periodically via the cleanup function.
-- ============================================
