/**
 * POST /api/audit/url
 * 
 * Analyzes a TikTok video URL using AI.
 * Requires authentication.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Video style labels
const videoStyleLabels: Record<string, string> = {
  'talking_head': 'Talking Head (direct to camera)',
  'skit': 'Skit / Story-based',
  'reply_video': 'Reply to Comment',
  'product_plug': 'Product Plug (authority figure)',
  'product_demo': 'Product Features Demo',
  'unboxing': 'Unboxing / First Impressions',
  'before_after': 'Before & After',
  'tutorial': 'Tutorial / How-To',
  'review': 'Honest Review',
  'lifestyle': 'Lifestyle Integration',
};

// Product category labels
const productCategoryLabels: Record<string, string> = {
  'beauty': 'Beauty & Skincare',
  'supplements': 'Supplements & Wellness',
  'fitness': 'Fitness & Health',
  'fashion': 'Fashion & Apparel',
  'home': 'Home & Kitchen',
  'tech': 'Tech & Gadgets',
  'pets': 'Pets',
  'food': 'Food & Beverage',
  'baby': 'Baby & Kids',
  'other': 'Other',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization' });
  }

  const token = authHeader.split(' ')[1];
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get request body
  const { 
    tiktokUrl, 
    productName, 
    productCategory,
    niche, 
    videoStyle,
    targetAudience,
    keyBenefit 
  } = req.body;

  if (!tiktokUrl) {
    return res.status(400).json({ error: 'Missing tiktokUrl' });
  }

  // Validate TikTok URL
  try {
    const parsed = new URL(tiktokUrl);
    const validHosts = ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com'];
    const isValid = validHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid TikTok URL' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build context string from user inputs
    const contextParts: string[] = [];
    if (productName) contextParts.push(`Product: ${productName}`);
    if (productCategory) contextParts.push(`Category: ${productCategoryLabels[productCategory] || productCategory}`);
    if (keyBenefit) contextParts.push(`Key Benefit: ${keyBenefit}`);
    if (videoStyle) contextParts.push(`Video Style: ${videoStyleLabels[videoStyle] || videoStyle}`);
    if (targetAudience) contextParts.push(`Target Audience: ${targetAudience}`);
    if (niche) contextParts.push(`Niche: ${niche}`);
    
    const contextSection = contextParts.length > 0 
      ? `\n### CONTEXT PROVIDED BY CREATOR\n${contextParts.join('\n')}\n\nUse this context to provide more specific, actionable feedback.\n`
      : '';

    const videoStyleGuidance = videoStyle ? `
### VIDEO STYLE CONSIDERATIONS
The creator indicated this is a "${videoStyleLabels[videoStyle] || videoStyle}" style video.

${videoStyle === 'talking_head' ? 'For Talking Head: Focus on eye contact, energy, confidence, and delivery. The hook must be verbally compelling.' : ''}
${videoStyle === 'skit' ? 'For Skit/Story: Evaluate the narrative structure, entertainment value, and how naturally the product is integrated.' : ''}
${videoStyle === 'reply_video' ? 'For Reply Video: Check if the comment context is clear, the response is engaging, and it creates curiosity.' : ''}
${videoStyle === 'product_plug' ? 'For Product Plug: Assess authority positioning, credibility signals, and how convincing the endorsement feels.' : ''}
${videoStyle === 'product_demo' ? 'For Product Demo: Note that showing features alone is often less effective for supplements. Focus on transformation/results.' : ''}
${videoStyle === 'unboxing' ? 'For Unboxing: Evaluate the reveal moment, genuine reactions, and first impressions authenticity.' : ''}
${videoStyle === 'before_after' ? 'For Before/After: Check if the transformation is believable, well-documented, and emotionally compelling.' : ''}
${videoStyle === 'tutorial' ? 'For Tutorial: Assess clarity of instructions, value provided, and product integration.' : ''}
${videoStyle === 'review' ? 'For Review: Evaluate authenticity, specific details, and balance of pros/cons.' : ''}
${videoStyle === 'lifestyle' ? 'For Lifestyle: Check how naturally the product fits into the scene and aspirational value.' : ''}
` : '';

    const systemPrompt = `
You are a world-class TikTok Shop affiliate strategist and video auditor. 
Your goal is to help the creator maximize GMV (Gross Merchandise Value) through viral, high-converting content.

The user wants you to analyze a TikTok video from this URL: ${tiktokUrl}

IMPORTANT: Since you cannot directly access or view the video content from a URL, provide a comprehensive framework and checklist the creator can use to self-evaluate their video. Base your response on best practices for TikTok Shop affiliate content.
${contextSection}
${videoStyleGuidance}
### CRITICAL RULES FOR TIKTOK SHOP SUCCESS

1. **Opening Line Check** (First 3 seconds)
   - **WEAK**: Starts with a question → Lower conversion
   - **STRONG**: Starts with a bold statement/claim → Higher conversion

2. **Key Success Factors**
   - Controversy / Pattern Interrupt
   - Snappy, benefit-driven hook
   - Curiosity gap
   - Clear target audience callout
   - Pain point + product solution
   - Strong, urgent CTA
   - Fast pacing, no fluff

### OUTPUT FORMAT (Markdown)

## Video Audit Checklist

### Self-Evaluation Framework
Provide a detailed checklist with specific questions the creator should ask about their video.

### Key Questions to Ask Yourself
*   [Question 1 based on context provided]
*   [Question 2]
*   [Question 3]

### Best Practices for ${videoStyleLabels[videoStyle] || 'Your Video Style'}
*   [Specific tip 1]
*   [Specific tip 2]
*   [Specific tip 3]

${productCategory === 'supplements' ? `
### Special Note for Supplements
Product feature demos are often less effective for supplements. Focus on:
- Transformation stories
- Before/after results
- Lifestyle integration
- Authority endorsements
` : ''}

### Recommended Hook Structures
Provide 3 alternative hook examples based on the product/context.

### Common Mistakes to Avoid
*   [Mistake 1]
*   [Mistake 2]
*   [Mistake 3]

### Summary
[Brief encouraging summary with next steps]
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [{ text: systemPrompt }] },
    });

    const feedback = response.text || "Analysis failed. Please try again.";
    
    // Extract score if present (though our framework response won't have one)
    const scoreMatch = feedback.match(/Overall Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

    // Save audit to database
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: auditRecord, error: insertError } = await admin
      .from('video_audits')
      .insert({
        user_id: user.id,
        video_url: tiktokUrl,
        video_title: productName || null,
        audit_result: {
          feedback,
          context: {
            productName,
            productCategory,
            niche,
            videoStyle,
            targetAudience,
            keyBenefit
          }
        },
        score,
        recommendations: []
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to save audit:', insertError);
    }

    return res.status(200).json({
      success: true,
      feedback,
      score,
      auditId: auditRecord?.id || null
    });

  } catch (error: any) {
    console.error('Audit error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to analyze video',
      details: error.message 
    });
  }
}
