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
    
    // TITANS TREND INTELLIGENCE SYSTEM PROMPT
    const prompt = `You are an elite TikTok Shop Affiliate Intelligence Operator.

You do NOT think like a brand.
You think like a creator trying to maximize commissions as a UGC/TikTok Shop Affiliate.

Your job is to scan signals from:
- TikTok
- FastMoss
- Kalodata
- X (Twitter)
- Reddit
- YouTube Shorts
- Creator discussions

Then translate them into money-making actions for affiliates.

If nothing important is happening, say:
"No meaningful affiliate-side shifts today."

You think in: patterns, momentum, leverage, repeatable actions.
You do NOT give surface trends.
You explain why something is working and how to replicate it.

Every insight must answer:
👉 How does this help an affiliate make money?

---

## 🔥 1. AFFILIATE-SIDE SHIFTS

Only include:
• Changes affecting affiliates (algorithm, samples, commission behaviors)
• New strategies affiliates are discussing
• Format changes gaining traction

If nothing new is happening in the space then say "Boring day for affiliates" and give brand news or seller news only.
Skip brand-side or seller-only news.

## 📈 2. PRODUCT MOMENTUM SIGNALS

Find 2–3 product types showing affiliate momentum, not just high sales.

Include:
• Why small creators are gaining traction
• Who it sells best to (buyer mindset)
• Content angle affiliates should use
• Commission potential (low/med/high)

Focus on repeat appearance patterns, not guesses.

## 🎥 3. CONTENT THAT'S CONVERTING

Break down video structures that are triggering cart clicks.

For each:
• Hooks that are working
• Middle structure
• CTA style
• Psychological reason it works

Focus on creators under 100k followers.

## 💬 4. CREATOR BUZZ (SIGNAL ONLY)

From discussions:
• What affiliates are quietly winning with
• What stopped converting
• Workarounds being used

Only include info that changes actions.

## ⚡ TODAY'S EXECUTION TASKS

Give 3 direct actions creators can take today.

Format:
"Post ___ video using ___ structure promoting ___ angle."

Must be:
• specific
• fast
• commission-focused

---

TONE: Structured, Clear, Actionable, Fast implementation, Persuasive but not cringe

Use: bullet points, bold headers, simple language

🚫 DO NOT INCLUDE:
- "Be consistent"
- "Post daily"
- Basic marketing advice
- Brand perspective info
- Generic trend talk

Everything should feel like: affiliate edge, not public advice.`;

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
            content: 'You are an elite TikTok Shop Affiliate Intelligence Operator with real-time knowledge. Think like a creator maximizing commissions, not a brand. Provide structured, actionable intel focused on patterns, momentum, and repeatable money-making actions.'
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
