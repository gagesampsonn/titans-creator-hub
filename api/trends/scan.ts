/**
 * Trend Pulse API - Grok-powered trend scanning
 * Uses xAI's Grok for real-time market intelligence
 * 
 * SECURITY: Rate limited to 10 requests/hour
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inline rate limiting to avoid import issues
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : (req.headers['x-real-ip'] as string) || 'unknown';
  return `trends:${ip}`;
}

function checkRateLimit(req: VercelRequest): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 10;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security headers - set first thing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Wrap everything in try-catch to ensure JSON response on any error
  try {
    // Rate limit check
    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        remaining: 0
      });
    }

    // Check API key
    const GROK_API_KEY = process.env.GROK_API_KEY || '';
    if (!GROK_API_KEY) {
      console.error('[Grok] API key missing');
      return res.status(500).json({ 
        error: 'AI service not configured',
        message: 'GROK_API_KEY environment variable is not set in Vercel'
      });
    }

    console.log('[Grok] API key found, length:', GROK_API_KEY.length);
    const prompt = `You are an elite TikTok Shop affiliate marketing intelligence analyst.

Your job is NOT to give general trends.
Your job is to uncover money-making signals that creators can use immediately to sell more.

Think like an affiliate trying to turn views into commission, not like a brand marketer.

Use patterns seen on:
- TikTok Shop
- FastMoss
- Kalodata
- X/Twitter creator discussions
- Viral TikTok videos

Focus on under-the-radar momentum, not obvious mainstream products.

## 🔥 1. PRODUCTS SHOWING EARLY MOMENTUM (NOT OVER-SATURATED)

Find 3–5 products or product TYPES that show:
• rising affiliate usage
• multiple small creators getting traction
• increasing engagement patterns
• repeat appearances in viral shop videos

For each product include:
- Product type
- Why momentum is building (pattern explanation, not guess)
- Who it sells best to (specific buyer mindset, not demographic)
- Commission potential (low / medium / high)
- The exact angle affiliates should use to stand out
- What mistake most affiliates make promoting it

## 📈 2. CONVERTING VIDEO STRUCTURES (WHAT'S MAKING MONEY)

Identify content formats that are producing sales, not just views.

Include:
- Video structure pattern (Hook → Middle → CTA style)
- What the hook does psychologically
- Why viewers stay
- What triggers the cart click
- Ideal length
- Whether creator shows face or not

Focus on formats working for small & mid creators, not influencers.

## 💬 3. CREATOR-SIDE BUZZ (NOT BRAND NEWS)

Based on discussions from creators:
- What affiliates are quietly winning with
- Complaints about what's NOT converting
- Workarounds creators are using
- New TikTok Shop behaviors (algorithm, shipping, samples, etc.)

Only include info that changes how a creator should act.

## 🎯 4. OPPORTUNITY GAPS

Where is attention high but affiliate competition still low?

For each niche:
- What buyers are currently searching/engaging with
- Why affiliates haven't flooded it yet
- Content angle that could dominate early

## ⚡ 5. IMMEDIATE MONEY MOVES

Give 3 tactical plays an affiliate could execute TODAY.

Must be:
- Specific
- Easy to do
- Designed to increase sales, not followers

Example format:
"Post ___ type of video for ___ product using ___ angle."

🚫 DO NOT INCLUDE:
- "Be consistent"
- "Use good lighting"
- Generic growth tips
- Brand perspective advice
- Surface-level trends

Everything should feel like information creators normally don't share publicly.
Focus on signals, patterns, and angles that lead to commissions.`;

    console.log('[Grok] Calling API...');
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast-non-reasoning',
        messages: [
          {
            role: 'system',
            content: 'You are an elite TikTok Shop affiliate intelligence analyst with real-time knowledge. Provide specific, actionable intel focused on commission generation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        temperature: 0.7,
      }),
    });

    // Always read as text first to handle non-JSON errors
    const responseText = await response.text();
    console.log('[Grok] Status:', response.status);
    
    if (!response.ok) {
      console.error('[Grok] Error response:', responseText.slice(0, 500));
      
      // Try to parse error as JSON
      let errorMessage = `Grok API error: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // Not JSON, use raw text
        errorMessage = responseText.slice(0, 200) || errorMessage;
      }
      
      return res.status(500).json({
        error: 'Failed to scan trends',
        message: errorMessage
      });
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[Grok] JSON parse error:', responseText.slice(0, 500));
      return res.status(500).json({
        error: 'Invalid response from AI',
        message: 'Response was not valid JSON'
      });
    }

    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      console.error('[Grok] No content in response:', JSON.stringify(data).slice(0, 500));
      return res.status(500).json({
        error: 'Empty response from AI',
        message: 'No content returned'
      });
    }

    return res.status(200).json({
      success: true,
      data: text,
      sources: ['grok-4-1-fast-non-reasoning', 'real-time'],
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Grok] Catch error:', error);
    
    return res.status(500).json({
      error: 'Failed to scan trends',
      message: error.message || 'An unexpected error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
