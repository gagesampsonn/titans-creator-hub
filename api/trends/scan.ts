/**
 * Trend Pulse API - Grok-powered trend scanning
 * Uses xAI's Grok for real-time market intelligence
 * 
 * SECURITY: Rate limited to 10 requests/hour (expensive AI operation)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../_shared/rateLimit';

const GROK_API_KEY = process.env.GROK_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 10 requests per hour (expensive AI operation)
  if (applyRateLimit(req, res, 'trends', 'expensive')) return;

  if (!GROK_API_KEY) {
    return res.status(500).json({ 
      error: 'AI service not configured',
      message: 'Please set GROK_API_KEY in your Vercel environment variables'
    });
  }

  try {
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

    // Use Grok API (OpenAI-compatible format)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4-latest',
        messages: [
          {
            role: 'system',
            content: 'You are an elite TikTok Shop affiliate intelligence analyst. You have real-time access to creator discussions, FastMoss/Kalodata data patterns, and viral TikTok content. Your intel is specific, actionable, and focused on commission generation - not vanity metrics. You think like a top-earning affiliate, not a brand marketer.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API error:', response.status, errorData);
      throw new Error(errorData.error?.message || `Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No trends found.";

    return res.status(200).json({
      success: true,
      data: text,
      sources: ['grok-3-mini', 'real-time'],
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Trend scan error:', error);
    
    return res.status(500).json({
      error: 'Failed to scan trends',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
