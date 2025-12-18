import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';

// Discord webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_LINK_REQUEST_WEBHOOK || 'https://discord.com/api/webhooks/1451248447825907884/lkgaAdry3GJPLA1cLxByqzCcWCh_Nb9d4ybmIeolq-qQ0JkvDn3hGHOdn7RPWORe5aK1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Verify the token and get user
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { tiktok_handle, note } = req.body;

  if (!tiktok_handle) {
    return res.status(400).json({ error: 'TikTok handle is required' });
  }

  const normalizedHandle = tiktok_handle.toLowerCase().trim().replace(/^@/, '');

  try {
    // Save to database (if table exists)
    const { error: dbError } = await admin
      .from('link_requests')
      .upsert({
        tiktok_handle: normalizedHandle,
        user_email: user.email || '',
        note: note || null,
        status: 'pending'
      }, { onConflict: 'tiktok_handle' });

    if (dbError) {
      console.log('DB error (table may not exist):', dbError.message);
      // Continue anyway - still send Discord notification
    }

    // Send Discord notification
    if (DISCORD_WEBHOOK_URL) {
      const discordPayload = {
        embeds: [{
          title: '🔗 New Link Request',
          color: 0x00D4AA, // Teal color
          fields: [
            {
              name: 'TikTok Handle',
              value: `@${normalizedHandle}`,
              inline: true
            },
            {
              name: 'Email',
              value: user.email || 'Not provided',
              inline: true
            },
            {
              name: 'Note',
              value: note || 'No note provided',
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Titans Creator Hub'
          }
        }]
      };

      const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload)
      });

      if (!discordResponse.ok) {
        console.error('Discord webhook failed:', await discordResponse.text());
      }
    } else {
      console.log('Discord webhook URL not configured');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Link request submitted successfully' 
    });

  } catch (err: any) {
    console.error('Error processing link request:', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
