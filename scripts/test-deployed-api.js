/**
 * Test the deployed Trend Scanner API
 */

async function testDeployedAPI() {
  // Test the new deployment directly
  const url = 'https://titans-creator-hub-steel.vercel.app/api/trends/scan';
  console.log(`Testing deployed API at ${url}...\n`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Time: ${elapsed}ms`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('\nResponse body:');
    
    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ API is working! Data received.');
        console.log('\nFirst 500 chars of content:');
        console.log(json.data?.slice(0, 500));
      } else if (json.error) {
        console.log('\n❌ API returned error:', json.error);
        console.log('Message:', json.message);
      }
    } catch {
      console.log('Raw response (not JSON):', text.slice(0, 500));
    }
    
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testDeployedAPI();

