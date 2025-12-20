import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  'https://myylgglbtroabqclzvvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug'
);

async function checkSignups() {
  // First, get all profiles with tiktok handles
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .not('tiktok_handle', 'is', null);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Users with TikTok handles (signed up creators):');
  console.log('=====================================');
  data?.forEach(u => {
    console.log(`@${u.tiktok_handle}`);
  });
  console.log('=====================================');
  console.log('Total with TikTok handles:', data?.length || 0);
  
  // Return handles for comparison
  return data?.map(u => u.tiktok_handle?.toLowerCase()) || [];
}

checkSignups();
