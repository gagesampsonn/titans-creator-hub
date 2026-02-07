/**
 * Add email column to linked_creators and populate it
 * This allows email-to-handle mapping like in the spreadsheet
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Email to handle mappings from your spreadsheet
const emailMappings: Record<string, string> = {
  'gagesampson2016@gmail.com': 'ttshopl',
  // Add more mappings here as needed from your spreadsheet
};

async function addEmailColumn() {
  console.log('=== Adding Email Column to linked_creators ===\n');

  // First, let's check if the column exists by trying to query it
  const { data: test, error: testError } = await supabase
    .from('linked_creators')
    .select('tiktok_handle, email')
    .limit(1);

  if (testError && testError.message.includes('column')) {
    console.log('❌ Email column does not exist yet.');
    console.log('\nPlease run this SQL in Supabase Dashboard SQL Editor:');
    console.log('-------------------------------------------');
    console.log('ALTER TABLE linked_creators ADD COLUMN IF NOT EXISTS email TEXT;');
    console.log('CREATE INDEX IF NOT EXISTS idx_linked_creators_email ON linked_creators(email);');
    console.log('-------------------------------------------');
    console.log('\nThen run this script again to populate the emails.');
    return;
  }

  console.log('✅ Email column exists! Updating mappings...\n');

  // Update each mapping
  for (const [email, handle] of Object.entries(emailMappings)) {
    const { data, error } = await supabase
      .from('linked_creators')
      .update({ email: email.toLowerCase() })
      .eq('tiktok_handle', handle)
      .select();

    if (error) {
      console.log(`❌ Failed to update ${handle}: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✅ ${handle} → ${email}`);
    } else {
      console.log(`⚠️  Handle "${handle}" not found in linked_creators`);
    }
  }

  console.log('\n=== Done! ===');
  
  // Show current state
  const { data: all } = await supabase
    .from('linked_creators')
    .select('tiktok_handle, email')
    .not('email', 'is', null);
  
  console.log('\nCreators with email mappings:');
  console.log(JSON.stringify(all, null, 2));
}

addEmailColumn().catch(console.error);

