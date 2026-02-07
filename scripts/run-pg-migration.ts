/**
 * Run SQL migration directly via pg client
 */

import { Client } from 'pg';

// Supabase connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const DATABASE_URL = 'postgresql://postgres.myylgglbtroabqclzvvn:Titansagency2024!@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function runMigration() {
  console.log('=== Running SQL Migration via pg client ===\n');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Add email column
    console.log('Adding email column to linked_creators...');
    await client.query('ALTER TABLE linked_creators ADD COLUMN IF NOT EXISTS email TEXT;');
    console.log('✅ Email column added\n');

    // Create index
    console.log('Creating index on email column...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_linked_creators_email ON linked_creators(email);');
    console.log('✅ Index created\n');

    // Update email for ttshopl
    console.log('Setting email for ttshopl...');
    const result = await client.query(
      "UPDATE linked_creators SET email = $1 WHERE tiktok_handle = $2 RETURNING *",
      ['gagesampson2016@gmail.com', 'ttshopl']
    );
    console.log('✅ Updated:', result.rows);

    // Verify
    console.log('\nVerifying linked_creators with emails:');
    const verify = await client.query('SELECT tiktok_handle, email FROM linked_creators WHERE email IS NOT NULL');
    console.log(verify.rows);

    console.log('\n=== Migration Complete! ===');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('password')) {
      console.log('\nThe database password might be incorrect.');
      console.log('You can find it in Supabase Dashboard → Settings → Database → Connection string');
    }
  } finally {
    await client.end();
  }
}

runMigration();

