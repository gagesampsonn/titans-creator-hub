/**
 * Trend Pulse API - Server-side Gemini integration
 * Scans multiple platforms for trending content opportunities
 * 
 * SECURITY: Rate limited to 10 requests/hour (expensive AI operation)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyRateLimit } from '../_shared/rateLimit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

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

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'AI service not configured',
      message: 'Please set GEMINI_API_KEY in your Vercel environment variables'
    });
  }

  try {
    const prompt = `
You are an expert TikTok Shop affiliate marketing analyst. Your job is to help TikTok Shop affiliates and creators make more money by identifying trending products, viral content strategies, and what's currently being talked about in the TikTok Shop affiliate community.

Analyze current trends and provide actionable intelligence for TikTok Shop affiliates:

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

## 💬 WHAT AFFILIATES ARE TALKING ABOUT
Current discussions in the TikTok Shop affiliate community:
- New features or changes to TikTok Shop
- Commission rate updates
- Algorithm changes affecting affiliates
- Success stories and strategies being shared

## 🎯 NICHE OPPORTUNITIES
Underserved niches or product categories with high potential:
- Categories with less competition
- Emerging trends before they peak
- Seasonal opportunities coming up

## ⚡ QUICK WINS
3 things an affiliate can do TODAY to increase their sales:
- Specific actionable tips
- Low-effort, high-reward strategies

Focus on practical, money-making advice for TikTok Shop affiliates. Be specific with product examples and content ideas they can use immediately.
`;

    // Use Gemini REST API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate content');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No trends found.";

    return res.status(200).json({
      success: true,
      data: text,
      sources: [],
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
