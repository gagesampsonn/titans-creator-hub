-- Marketing Leads Table
-- Stores email/phone from non-logged-in users who use the LIVE Script Generator
-- Used for email marketing via Brevo

CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  phone TEXT,
  source TEXT DEFAULT 'live_script_generator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscribed BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON marketing_leads(email);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_source ON marketing_leads(source);
CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON marketing_leads(created_at DESC);

-- RLS Policies
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/read marketing leads (API endpoints use service key)
CREATE POLICY "Service role can manage marketing leads"
  ON marketing_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

