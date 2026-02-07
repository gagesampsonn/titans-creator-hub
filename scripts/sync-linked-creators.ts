import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  'https://myylgglbtroabqclzvvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug'
);

const creators = [
  'missxkenshin', 'shopaholicismyname', 'ravenvaldeskenworthy', 'mitchhod', 
  'samjeffhop', 'kanariiskitchen', 'britty.finds', 'justkeedah', 'jace_rio', 
  'ksdealz', 'blevtimedealz', 'theshopplug_', 'sarasgoodfinds', 'biobalancehacks', 
  'theebomeister', 'melissa.hs77', 'chloevanscoder', 'brittvibing', 'ttshopl', 
  'cloverlane1111', 'clicked_it_bought_it', 'minashopstoomuch', 'gigimonique777', 
  'gia00777', 'levidoesdeals', 'toptikokdeals', 'ravenkenworthy', 'bestshopfindsz', 
  'eduardosttshop', 'beachmomshopaholic', 'shopwdayton', 'king_thurs', 'jackieboyle13', 
  'dreseaj', 'findingthesunshine1', 'justbridget5', 'findsbyzan', 'amandabeautypanda', 
  'lindsey.stone7', 'juglifts', 'contentcreatorshop', 'dealswithbrayden', 
  'edsbestshopdeals', 'lashi961'
];

async function sync() {
  console.log('Syncing ' + creators.length + ' linked creators...');
  
  for (const handle of creators) {
    const { error } = await admin
      .from('linked_creators')
      .upsert({ tiktok_handle: handle }, { onConflict: 'tiktok_handle' });
    
    if (error) {
      console.log(`   ⚠️ ${handle}: ${error.message}`);
    }
  }
  
  // Verify
  const { data } = await admin.from('linked_creators').select('tiktok_handle');
  console.log(`✅ Total linked creators in database: ${data?.length || 0}`);
}

sync().catch(console.error);

