import postgres from 'postgres';

// Supabase transaction pooler
const sql = postgres('postgresql://postgres.myylgglbtroabqclzvvn:7JgDoLAAYwpEQAr5@aws-0-us-east-1.pooler.supabase.com:6543/postgres');

async function createTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS marketing_leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        source TEXT DEFAULT 'live_script_generator',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        subscribed BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_leads_email ON marketing_leads(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_marketing_leads_created_at ON marketing_leads(created_at DESC)`;
    
    // Enable RLS
    await sql`ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY`;
    
    // Allow service role full access
    await sql`
      CREATE POLICY IF NOT EXISTS "Service role can manage leads" ON marketing_leads
      FOR ALL USING (true) WITH CHECK (true)
    `;
    
    console.log('✅ marketing_leads table created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

createTable();

