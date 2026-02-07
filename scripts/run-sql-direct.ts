/**
 * Run SQL directly via Supabase's postgres connection
 */

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

async function runSQL() {
  console.log('=== Running SQL to add email column ===\n');

  // Supabase exposes a SQL endpoint at /rest/v1/rpc for functions
  // But for DDL, we need to use the pg-meta endpoint or create a function
  
  // Try using the query endpoint
  const sql = `
    ALTER TABLE linked_creators ADD COLUMN IF NOT EXISTS email TEXT;
    CREATE INDEX IF NOT EXISTS idx_linked_creators_email ON linked_creators(email);
    UPDATE linked_creators SET email = 'gagesampson2016@gmail.com' WHERE tiktok_handle = 'ttshopl';
  `;

  // Try the SQL endpoint (may not be available on all plans)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.ok) {
    console.log('✅ SQL executed successfully!');
    return true;
  }

  // If that didn't work, try the pg endpoint
  const pgResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (pgResponse.ok) {
    console.log('✅ SQL executed via pg endpoint!');
    return true;
  }

  console.log('❌ Could not execute SQL directly.');
  console.log('Response:', await response.text());
  
  // Fallback: Just try to update via the client
  console.log('\nTrying fallback approach via Supabase client...');
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  // Try the update - if email column exists, this will work
  const { data, error } = await supabase
    .from('linked_creators')
    .update({ email: 'gagesampson2016@gmail.com' })
    .eq('tiktok_handle', 'ttshopl')
    .select();

  if (error) {
    console.log('❌ Update failed:', error.message);
    
    if (error.message.includes('column')) {
      console.log('\n📋 The email column needs to be added manually.');
      console.log('Please run this in Supabase SQL Editor:');
      console.log('---');
      console.log('ALTER TABLE linked_creators ADD COLUMN email TEXT;');
      console.log('---');
    }
    return false;
  }

  console.log('✅ Email updated successfully!', data);
  return true;
}

runSQL().catch(console.error);

