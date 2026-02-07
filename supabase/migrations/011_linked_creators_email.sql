-- ============================================
-- ADD EMAIL COLUMN TO LINKED_CREATORS
-- Allows auto-linking users by email on login
-- ============================================

-- Add email column (optional, can be null)
ALTER TABLE linked_creators ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_linked_creators_email ON linked_creators(email);

-- Update existing creators with emails (add your email mappings here)
-- Example: UPDATE linked_creators SET email = 'user@example.com' WHERE tiktok_handle = 'somehandle';

-- Link the user's email to their TikTok handle
UPDATE linked_creators 
SET email = 'gagesampson2016@gmail.com' 
WHERE tiktok_handle = 'ttshopl';

