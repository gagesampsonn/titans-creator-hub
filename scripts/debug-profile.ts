import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  console.log('=== Checking Database State ===\n');

  // Check profiles for gagesampson2016@gmail.com
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'gagesampson2016@gmail.com');
  
  console.log('Profiles for gagesampson2016@gmail.com:');
  console.log(JSON.stringify(profiles, null, 2));
  if (pErr) console.log('Profile error:', pErr);

  // Check linked_creators for ttshopl
  const { data: linked, error: lErr } = await supabase
    .from('linked_creators')
    .select('*')
    .eq('tiktok_handle', 'ttshopl');
  
  console.log('\nLinked creator (ttshopl):');
  console.log(JSON.stringify(linked, null, 2));
  if (lErr) console.log('Linked error:', lErr);

  // Check all profiles with tiktok_handle
  const { data: allHandles, error: aErr } = await supabase
    .from('profiles')
    .select('email, tiktok_handle')
    .not('tiktok_handle', 'is', null)
    .limit(10);
  
  console.log('\nAll profiles with tiktok_handle:');
  console.log(JSON.stringify(allHandles, null, 2));
  if (aErr) console.log('All handles error:', aErr);
}

check().catch(console.error);

