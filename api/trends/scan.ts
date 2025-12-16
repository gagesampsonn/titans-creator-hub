/**
 * Trend Pulse API - Server-side Gemini integration
 * Scans multiple platforms for trending content opportunities
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ 
      error: 'AI service not configured',
      message: 'Please set GEMINI_API_KEY in your Vercel environment variables'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `
You are a TikTok Shop trend analyst. Scan and analyze current trending topics from multiple platforms.

Based on your knowledge of recent trends (within the last 7 days), identify:
- Rising products on TikTok Shop
- Viral content patterns
- Trending phrases and hashtags
- Pain points consumers are discussing
- Cultural moments creators can leverage

For each trend you identify, provide:

## [Trend Name]

**Summary:** Brief description of what's happening

**Platform Sources:** Which platforms are showing this trend (TikTok, Twitter/X, Reddit, YouTube, Amazon, etc.)

**Affiliate Relevance Score:** X/100 (how relevant for TikTok Shop creators)

**Target Audience:** Who is engaging with this trend

**Best Hook Angles:**
- Hook idea 1
- Hook idea 2
- Hook idea 3

**Content Recommendations:**
- Content format suggestions
- Best posting times
- Hashtags to use

**Confidence Level:** High/Medium/Low

---

Identify 3-5 actionable trends that TikTok Shop creators can use RIGHT NOW to create content and drive sales.

Focus on trends that have:
1. High engagement potential
2. Clear product tie-ins
3. Urgency (time-sensitive or growing rapidly)
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || "No trends found.";
    
    // Extract any grounding sources if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
    
    // Remove duplicates
    const uniqueSources = Array.from(
      new Map(sources.map((item: any) => [item.uri, item])).values()
    );

    return res.status(200).json({
      success: true,
      data: text,
      sources: uniqueSources,
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
