/**
 * POST /api/link-request
 * SECURITY: Rate limited to 30 requests/min (standard)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Inline rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function applyRateLimit(req: VercelRequest, res: VercelResponse, prefix: string): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;
  
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (record.count >= maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }
  record.count++;
  return false;
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Discord webhook URL - MUST be set in Vercel env vars
const DISCORD_WEBHOOK_URL = process.env.DISCORD_LINK_REQUEST_WEBHOOK || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 30 requests per minute
  if (applyRateLimit(req, res, 'link-request')) return;

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
