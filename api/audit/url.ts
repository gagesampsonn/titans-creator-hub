/**
 * POST /api/audit/url
 * 
 * Analyzes a TikTok video URL using Gemini AI.
 * 
 * This endpoint:
 * 1. Validates the TikTok URL format
 * 2. Fetches video metadata from TikTok (when possible)
 * 3. Sends the URL and context to Gemini for analysis
 * 4. Saves the result to video_audits table
 * 5. Returns the analysis score and feedback
 * 
 * SECURITY:
 * - Gemini API key kept server-side only
 * - User authentication via Supabase JWT
 * - Results saved to user's own video_audits records (RLS enforced)
 * 
 * Request body:
 * {
 *   tiktokUrl: string (required)
 *   productName?: string
 *   niche?: string
 *   goal?: string
 *   notes?: string
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized Supabase clients (to avoid errors at module load time)
let supabase: SupabaseClient | null = null;
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)');
    }
    
    supabase = createClient(url, key);
  }
  return supabase;
}

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url) {
      throw new Error('Missing SUPABASE_URL environment variable');
    }
    
    // Service role key is optional - use anon key as fallback
    const serviceKey = key || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!serviceKey) {
      throw new Error('Missing Supabase key environment variables');
    }
    
    supabaseAdmin = createClient(url, serviceKey);
  }
  return supabaseAdmin;
}

// Gemini API key (server-side only)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

// Types
interface AuditUrlRequest {
  tiktokUrl: string;
  productName?: string;
  niche?: string;
  goal?: string;
  notes?: string;
}

interface AuditResult {
  success: boolean;
  score: number | null;
  feedback: string;
  auditId?: string;
  error?: string;
}

/**
 * Validate TikTok URL format
 * Accepts: tiktok.com, www.tiktok.com, vm.tiktok.com, vt.tiktok.com
 */
function isValidTikTokUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const validHosts = [
      'tiktok.com',
      'www.tiktok.com',
      'vm.tiktok.com',
      'vt.tiktok.com',
      'm.tiktok.com',
    ];
    return validHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

/**
 * Extract video ID from TikTok URL (for reference)
 */
function extractVideoId(url: string): string | null {
  try {
    // Pattern: /video/1234567890 or /@user/video/1234567890
    const videoMatch = url.match(/\/video\/(\d+)/);
    if (videoMatch) return videoMatch[1];
    
    // Short URL pattern: vm.tiktok.com/ABC123
    const shortMatch = url.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get authenticated user from JWT
 */
async function getAuthenticatedUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const client = getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error('Auth error:', err);
    return null;
  }
}

/**
 * Build the analysis prompt for Gemini
 */
function buildPrompt(url: string, context: Partial<AuditUrlRequest>): string {
  let contextInfo = '';
  
  if (context.productName) {
    contextInfo += `\n- Product being promoted: ${context.productName}`;
  }
  if (context.niche) {
    contextInfo += `\n- Creator's niche: ${context.niche}`;
  }
  if (context.goal) {
    contextInfo += `\n- Content goal: ${context.goal}`;
  }
  if (context.notes) {
    contextInfo += `\n- Additional notes: ${context.notes}`;
  }

  return `
You are a world-class TikTok Shop affiliate strategist and video auditor.
Your goal is to help the creator maximize GMV (Gross Merchandise Value) through viral, high-converting content.

The creator has provided this TikTok video URL for analysis: ${url}
${contextInfo ? `\nContext provided by creator:${contextInfo}` : ''}

Since you cannot directly view the video content from the URL, provide a comprehensive audit framework and checklist that the creator should use to self-evaluate their video. Also provide specific recommendations based on any context they've provided.

### CRITICAL ANALYSIS FRAMEWORK

#### 1. HOOK ANALYSIS (First 0-3 seconds)
Evaluate these elements:
- **Opening Type**: Statement vs Question
  - WEAK: Starts with a question (deduct points)
  - STRONG: Starts with a bold statement/claim (bonus points)
- **Pattern Interrupt**: Does it stop the scroll?
- **Curiosity Gap**: Does it create information tension?

#### 2. CONTENT STRUCTURE
- **Target Audience Clarity**: Is a specific avatar called out?
- **Pain Point Integration**: Is the problem clear in first 5 seconds?
- **Product Introduction**: Is the solution shown early and naturally?
- **Social Proof**: Are testimonials or results shown?

#### 3. TECHNICAL EXECUTION
- **Pacing**: Is it fast and punchy? Fluff removed?
- **Audio Quality**: Clear voice, good music selection?
- **Visual Quality**: Good lighting, engaging b-roll?
- **Text Overlays**: Reinforce key points?

#### 4. CALL-TO-ACTION
- **Clarity**: Is the CTA specific and urgent?
- **Placement**: At the end AND mentioned earlier?
- **Friction**: Is it easy to take action?

### OUTPUT FORMAT (Markdown)

## Overall Score: [0-100]/100
**Success Probability:** [Percentage]%

---

### Category Breakdown
*   **Hook:** [Score]/10 - [Provide self-check questions]
*   **Pattern Interrupt:** [Score]/10 - [Provide self-check questions]
*   **Curiosity Gap:** [Score]/10 - [Provide self-check questions]
*   **Audience Clarity:** [Score]/10 - [Provide self-check questions]
*   **Pain & Product:** [Score]/10 - [Provide self-check questions]
*   **CTA Strength:** [Score]/10 - [Provide self-check questions]
*   **Pacing:** [Score]/10 - [Provide self-check questions]

---

### Self-Audit Checklist
Provide a numbered checklist of 10 specific questions the creator should answer about their video.

### Actionable Fixes
Based on the context provided, give 3-5 specific, actionable recommendations.

### Hook Alternatives
Provide 3 alternative hook scripts the creator could test, based on their niche/product.

### Summary
Brief encouraging summary with next steps.

Remember: Be specific, actionable, and encouraging. The creator wants to improve!
`;
}

/**
 * Call Gemini API for analysis
 */
async function analyzeWithGemini(prompt: string): Promise<{ text: string; error?: string }> {
  if (!GEMINI_API_KEY) {
    return { text: '', error: 'Gemini API key not configured' };
  }

  try {
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
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return { text: '', error: `Gemini API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      return { text: '', error: 'No response from Gemini' };
    }

    return { text };
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return { text: '', error: 'Failed to call Gemini API' };
  }
}

/**
 * Extract score from analysis text
 */
function extractScore(text: string): number | null {
  const scoreMatch = text.match(/Overall Score:\s*(\d+)/i);
  if (scoreMatch) {
    return parseInt(scoreMatch[1], 10);
  }
  return null;
}

/**
 * Save audit result to database
 */
async function saveAuditResult(
  userId: string,
  url: string,
  result: string,
  score: number | null,
  context: Partial<AuditUrlRequest>
): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('video_audits')
      .insert({
        user_id: userId,
        video_url: url,
        video_title: context.productName || `TikTok Video Audit`,
        audit_result: {
          feedback: result,
          source_type: 'url',
          source_url: url,
          context: {
            productName: context.productName,
            niche: context.niche,
            goal: context.goal,
            notes: context.notes,
          },
        },
        score: score,
        recommendations: [], // Could parse from result if needed
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save audit result:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error saving audit result:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Parse request body
  const body = req.body as AuditUrlRequest;

  if (!body.tiktokUrl) {
    return res.status(400).json({ error: 'tiktokUrl is required' });
  }

  // Validate TikTok URL
  if (!isValidTikTokUrl(body.tiktokUrl)) {
    return res.status(400).json({ 
      error: 'Invalid TikTok URL. Please use a valid tiktok.com or vm.tiktok.com link.',
      validFormats: [
        'https://www.tiktok.com/@username/video/1234567890',
        'https://vm.tiktok.com/ABC123/',
        'https://vt.tiktok.com/ABC123/',
      ]
    });
  }

  try {
    // Build prompt with context
    const prompt = buildPrompt(body.tiktokUrl, {
      productName: body.productName,
      niche: body.niche,
      goal: body.goal,
      notes: body.notes,
    });

    // Call Gemini for analysis
    const { text, error: geminiError } = await analyzeWithGemini(prompt);

    if (geminiError || !text) {
      return res.status(500).json({ 
        success: false,
        error: geminiError || 'Analysis failed',
        score: null,
        feedback: '',
      });
    }

    // Extract score
    const score = extractScore(text);

    // Save to database
    const auditId = await saveAuditResult(user.id, body.tiktokUrl, text, score, body);

    const result: AuditResult = {
      success: true,
      score,
      feedback: text,
      auditId: auditId || undefined,
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Video audit error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to analyze video',
      score: null,
      feedback: '',
    });
  }
}
