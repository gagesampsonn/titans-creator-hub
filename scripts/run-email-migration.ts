/**
 * Run this script to add email column to linked_creators and set the email mapping
 * Usage: npx ts-node scripts/run-email-migration.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
  console.log('🚀 Running email migration for linked_creators...\n');
  
  // First, check if the email column exists by trying to query it
  const { data: existing, error: checkError } = await supabase
    .from('linked_creators')
    .select('tiktok_handle, email')
    .eq('tiktok_handle', 'ttshopl')
    .single();
  
  if (checkError && checkError.message.includes('column')) {
    console.log('❌ The email column does not exist yet.');
    console.log('');
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('---');
    console.log('ALTER TABLE linked_creators ADD COLUMN IF NOT EXISTS email TEXT;');
    console.log('CREATE INDEX IF NOT EXISTS idx_linked_creators_email ON linked_creators(email);');
    console.log("UPDATE linked_creators SET email = 'gagesampson2016@gmail.com' WHERE tiktok_handle = 'ttshopl';");
    console.log('---');
    process.exit(1);
  }
  
  if (existing && existing.email === 'gagesampson2016@gmail.com') {
    console.log('✅ Email already set for ttshopl:', existing.email);
    return;
  }
  
  console.log('Found existing record:', existing);
  console.log('Updating email for ttshopl...');
  
  // Try to update the email for ttshopl
  const { data, error } = await supabase
    .from('linked_creators')
    .update({ email: 'gagesampson2016@gmail.com' })
    .eq('tiktok_handle', 'ttshopl')
    .select();
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('');
    console.log('The email column might not exist yet.');
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('---');
    console.log('ALTER TABLE linked_creators ADD COLUMN IF NOT EXISTS email TEXT;');
    console.log('CREATE INDEX IF NOT EXISTS idx_linked_creators_email ON linked_creators(email);');
    console.log("UPDATE linked_creators SET email = 'gagesampson2016@gmail.com' WHERE tiktok_handle = 'ttshopl';");
    console.log('---');
    process.exit(1);
  } else {
    console.log('✅ Success! Updated record:', data);
  }
}

run().catch(console.error);

