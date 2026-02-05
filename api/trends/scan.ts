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
    const prompt = `You are an expert TikTok Shop affiliate marketing analyst with access to real-time information. Your job is to help TikTok Shop affiliates and creators make more money by identifying trending products, viral content strategies, and what's currently being talked about.

Analyze CURRENT trends (as of today) and provide actionable intelligence for TikTok Shop affiliates:

## 🔥 HOT PRODUCTS RIGHT NOW
Identify 3-5 products that are currently selling well on TikTok Shop or have viral potential. For each:
- Product name/type
- Why it's trending (viral video, seasonal, problem-solver, etc.)
- Estimated commission potential
- Best content angle to promote it

## 📈 TRENDING CONTENT FORMATS
What video styles are performing best for TikTok Shop affiliates right now?
- Specific formats (unboxing, GRWM, POV, etc.)
- Hook styles that are converting
- Video length sweet spots

## 💬 WHAT'S BUZZING ON SOCIAL
Current discussions and trends on X/Twitter and TikTok:
- Viral products people are talking about
- New TikTok Shop features or changes
- Success stories being shared
- Any drama or news affecting affiliates

## 🎯 NICHE OPPORTUNITIES
Underserved niches or product categories with high potential:
- Categories with less competition
- Emerging trends before they peak
- Seasonal opportunities coming up

## ⚡ QUICK WINS
3 things an affiliate can do TODAY to increase their sales:
- Specific actionable tips
- Low-effort, high-reward strategies

Focus on practical, money-making advice for TikTok Shop affiliates. Be specific with product examples and content ideas they can use immediately. Include any real trending products or viral moments you're aware of.`;

    // Use Grok API (OpenAI-compatible format)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a TikTok Shop affiliate marketing expert with real-time knowledge of current trends, viral products, and social media buzz. Provide actionable, up-to-date insights.'
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
