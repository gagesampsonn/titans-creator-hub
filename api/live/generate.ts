/**
 * POST /api/live/generate
 * 
 * Unified endpoint for LIVE script and infographic generation.
 * Use action: "script" or action: "infographic"
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

const SUPABASE_URL = 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTk5MTQsImV4cCI6MjA4MTIzNTkxNH0.W2WEETRhflBK_MeZbnoRc-NXRH4BV_u8Zk_aPqOoraA';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eWxnZ2xidHJvYWJxY2x6dnZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1OTkxNCwiZXhwIjoyMDgxMjM1OTE0fQ.cvJQ6xQ_c0sVXwKSfAnLgnCSjh4NnBzfAKjSFwN3Hug';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

// Authority words by category
const authorityWordsByCategory: Record<string, string[]> = {
  supplements: ['vasodilator', 'bioavailability', 'adaptogen', 'nootropic', 'thermogenic'],
  beauty: ['peptides', 'retinoid', 'hyaluronic', 'antioxidant', 'ceramides'],
  cologne: ['sillage', 'longevity', 'dry down', 'projection', 'top notes'],
  fragrance: ['sillage', 'longevity', 'dry down', 'projection', 'top notes'],
  tech: ['haptic', 'latency', 'algorithm', 'bandwidth', 'processor'],
  fitness: ['hypertrophy', 'compound movement', 'progressive overload', 'metabolic'],
  home: ['ergonomic', 'modular', 'antimicrobial', 'eco-friendly'],
  fashion: ['silhouette', 'drape', 'sustainable', 'capsule wardrobe'],
  food: ['artisanal', 'cold-pressed', 'organic', 'superfoods'],
  pets: ['hypoallergenic', 'probiotic', 'grain-free', 'enrichment'],
  baby: ['BPA-free', 'organic', 'pediatrician-approved', 'developmental'],
  other: ['premium', 'innovative', 'clinically-tested', 'patented'],
};

// Labels
const productCategoryLabels: Record<string, string> = {
  supplements: 'Supplements & Wellness',
  beauty: 'Beauty & Skincare',
  cologne: 'Cologne & Fragrance',
  fragrance: 'Cologne & Fragrance',
  tech: 'Tech & Gadgets',
  fitness: 'Fitness & Health',
  home: 'Home & Kitchen',
  fashion: 'Fashion & Apparel',
  food: 'Food & Beverage',
  pets: 'Pets',
  baby: 'Baby & Kids',
  other: 'Other',
};

const audienceLabels: Record<string, string> = {
  'men_18_24': 'Men 18-24',
  'men_25_34': 'Men 25-34',
  'men_35_44': 'Men 35-44',
  'men_45_54': 'Men 45-54',
  'men_55_plus': 'Men 55+',
  'women_18_24': 'Women 18-24',
  'women_25_34': 'Women 25-34',
  'women_35_44': 'Women 35-44',
  'women_45_54': 'Women 45-54',
  'women_55_plus': 'Women 55+',
  'all': 'All Audiences',
};

// Infographic styles by category
const categoryStyles: Record<string, { title: string; steps: string[]; colors: string }> = {
  supplements: {
    title: 'HOW IT HELPS YOUR BODY',
    steps: ['Absorbs into bloodstream', 'Targets specific areas', 'Supports natural function', 'Feel the difference'],
    colors: 'green and blue tones for health',
  },
  beauty: {
    title: 'HOW IT TRANSFORMS YOUR SKIN',
    steps: ['Penetrates skin layers', 'Nourishes from within', 'Repairs and protects', 'Reveals natural glow'],
    colors: 'soft pink and gold tones',
  },
  cologne: {
    title: 'SCENT JOURNEY',
    steps: ['Top notes hit first', 'Heart notes develop', 'Base notes linger', 'Lasts 6-8 hours'],
    colors: 'elegant black and gold',
  },
  fragrance: {
    title: 'SCENT JOURNEY',
    steps: ['Top notes hit first', 'Heart notes develop', 'Base notes linger', 'Lasts 6-8 hours'],
    colors: 'elegant black and gold',
  },
  tech: {
    title: 'HOW IT WORKS',
    steps: ['Connect in seconds', 'Smart technology activates', 'Performs automatically', 'Enjoy the results'],
    colors: 'modern blue and silver',
  },
  fitness: {
    title: 'YOUR FITNESS JOURNEY',
    steps: ['Start your routine', 'Build strength', 'Track progress', 'Achieve your goals'],
    colors: 'energetic orange and black',
  },
  home: {
    title: 'MAKES LIFE EASIER',
    steps: ['Simple setup', 'Works automatically', 'Saves you time', 'Enjoy the results'],
    colors: 'warm neutral tones',
  },
  fashion: {
    title: 'ELEVATE YOUR STYLE',
    steps: ['Quality materials', 'Perfect fit', 'Versatile styling', 'Confident look'],
    colors: 'sophisticated neutral palette',
  },
  food: {
    title: 'FROM SOURCE TO YOU',
    steps: ['Premium ingredients', 'Carefully prepared', 'Quality checked', 'Ready to enjoy'],
    colors: 'warm appetizing colors',
  },
  pets: {
    title: 'FOR YOUR BEST FRIEND',
    steps: ['Safe ingredients', 'Made with care', 'Pets love it', 'Happy healthy pet'],
    colors: 'friendly warm tones',
  },
  baby: {
    title: 'SAFE FOR LITTLE ONES',
    steps: ['Gentle formula', 'Pediatrician approved', 'Easy to use', 'Happy baby'],
    colors: 'soft pastels',
  },
  other: {
    title: 'HOW IT WORKS',
    steps: ['Easy to start', 'Works effectively', 'See results', 'Love the difference'],
    colors: 'clean modern palette',
  },
};

/**
 * Send email via Brevo
 */
async function sendBrevoEmail(to: string, productName: string, script: string): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.log('[Brevo] API key not configured, skipping email');
    return false;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Your LIVE Script is Ready! 🎬</h1>
      <p style="color: #8b8b8e; font-size: 14px; margin: 0;">Generated by Titans Agency</p>
    </div>
    <div style="background: linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(217, 70, 239, 0.1)); border: 1px solid rgba(45, 212, 191, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #2dd4bf; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Product</p>
      <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">${productName}</p>
    </div>
    <div style="background-color: #151518; border: 1px solid #27272a; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: #2dd4bf; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">📋 Your Talking Points</h2>
      <div style="color: #e4e4e7; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${script.replace(/\n/g, '<br>')}</div>
    </div>
    <div style="background-color: rgba(217, 70, 239, 0.1); border: 1px solid rgba(217, 70, 239, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="color: #d946ef; font-size: 12px; font-weight: 600; margin: 0 0 8px 0;">💡 PRO TIPS</p>
      <ul style="color: #e4e4e7; font-size: 13px; margin: 0; padding-left: 16px; line-height: 1.6;">
        <li>Practice reading this out loud before going live</li>
        <li>Keep your energy high and conversational</li>
        <li>Repeat the urgency and CTA every few minutes</li>
      </ul>
    </div>
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #27272a;">
      <p style="color: #8b8b8e; font-size: 12px; margin: 0;">Generated by <a href="https://titans-creator-hub.vercel.app" style="color: #2dd4bf; text-decoration: none;">Titans Agency</a></p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Titans Agency', email: 'noreply@titansagency.co' },
        to: [{ email: to }],
        subject: `Your LIVE Script for ${productName} is Ready!`,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Brevo] Email failed:', error);
      return false;
    }

    console.log('[Brevo] Email sent to:', to);
    return true;
  } catch (error) {
    console.error('[Brevo] Email error:', error);
    return false;
  }
}

/**
 * Generate LIVE script
 */
async function generateScript(req: VercelRequest, res: VercelResponse) {
  const { 
    productName,
    category,
    targetAudience,
    productDescription,
    keyBenefit,
    email,
    phone,
  } = req.body;

  if (!productName?.trim()) return res.status(400).json({ error: 'Product name is required' });
  if (!category) return res.status(400).json({ error: 'Product category is required' });
  if (!targetAudience) return res.status(400).json({ error: 'Target audience is required' });
  if (!productDescription?.trim()) return res.status(400).json({ error: 'Product description is required' });

  // Check if user is logged in
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user } } = await anonClient.auth.getUser(token);
    userId = user?.id || null;
  }

  if (!userId && !email?.trim()) {
    return res.status(400).json({ error: 'Email is required to receive your script' });
  }

  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const categoryKey = category.toLowerCase().replace(/[^a-z]/g, '');
    const authorityWords = authorityWordsByCategory[categoryKey] || authorityWordsByCategory.other;
    const audienceLabel = audienceLabels[targetAudience] || targetAudience;
    const categoryLabel = productCategoryLabels[categoryKey] || category;

    const systemPrompt = `You're helping a TikTok creator with casual talking points for their LIVE stream about "${productName}".

PRODUCT: ${productName}
AUDIENCE: ${audienceLabel}  
CATEGORY: ${categoryLabel}
WHAT IT DOES: ${productDescription}
${keyBenefit ? `MAIN BENEFIT: ${keyBenefit}` : ''}

STYLE RULES - THIS IS CRITICAL:
- Sound like you're casually chatting with a friend, NOT selling
- NO salesy language like "grab yours" or "don't miss out" or "order now"
- NO fake urgency or pressure tactics
- Be genuine and relaxed - like you're just sharing something cool you found
- Use "I" statements - "I've been using this" or "what I like about it"
- Keep it chill and authentic
- 8th grade reading level - simple everyday words
- Include 1 authority word from: ${authorityWords.slice(0, 3).join(', ')} - but explain it simply

OUTPUT - casual talking points the creator can reference:

**WHAT IT IS**
• One simple sentence explaining the product

**WHY I LIKE IT** (personal, authentic reasons)
• [Genuine benefit - how it actually helps]
• [Another real benefit]

**THE SCIENCE** (one authority word, explained simply)
• [Authority word] - basically means [simple explanation]

**WHO IT'S FOR**
• If you're someone who [relatable situation], this might help

**GOOD TO KNOW**
• [Product detail like size, how long it lasts, etc.]
• Free shipping if you grab it from this live

**IF PEOPLE ASK**
• Quick answer to common questions

Keep it real. No hype. Just honest info a creator would naturally share while chatting with their audience.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [{ text: systemPrompt }] },
    });

    const script = response.text || "Failed to generate script. Please try again.";

    // Save lead if not logged in
    if (!userId && email) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      await admin.from('marketing_leads').upsert({
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        source: 'live_script_generator',
        metadata: {
          productName,
          category,
          targetAudience,
          generatedAt: new Date().toISOString(),
        }
      }, { onConflict: 'email', ignoreDuplicates: false });

      await sendBrevoEmail(email.trim(), productName, script);
    }

    return res.status(200).json({
      success: true,
      script,
      productName,
      category: categoryLabel,
      targetAudience: audienceLabel,
    });

  } catch (error: any) {
    console.error('[Script Generation Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate script', details: error.message });
  }
}

/**
 * Generate infographic
 */
async function generateInfographic(req: VercelRequest, res: VercelResponse) {
  const { productName, category, keyBenefit } = req.body;

  if (!productName?.trim()) return res.status(400).json({ error: 'Product name is required' });

  const categoryKey = (category || 'other').toLowerCase().replace(/[^a-z]/g, '');
  const style = categoryStyles[categoryKey] || categoryStyles.other;

  if (!GEMINI_API_KEY) {
    return res.status(200).json({
      success: true,
      hasImage: false,
      suggestion: {
        title: style.title,
        steps: style.steps,
        colors: style.colors,
        description: `Create a simple infographic with the title "${style.title}" showing these steps: ${style.steps.join(' → ')}. Use ${style.colors}.`
      }
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build product-specific explanation based on category
    const productExplanations: Record<string, string> = {
      supplements: `how ${productName} works in the body - show absorption, how it affects cells/organs, and the benefit`,
      beauty: `how ${productName} works on the skin - show layers of skin, product penetration, and visible results`,
      cologne: `how ${productName} fragrance works - show scent notes (top, heart, base), projection, and longevity timeline`,
      fragrance: `how ${productName} fragrance works - show scent notes (top, heart, base), projection, and longevity timeline`,
      tech: `how ${productName} works - show the technology, key features, and user benefit`,
      fitness: `how ${productName} helps fitness - show the process, muscle/body impact, and results`,
      home: `how ${productName} works - show the mechanism, ease of use, and benefit`,
      food: `how ${productName} is made and its benefits - show ingredients, process, and health benefit`,
      pets: `how ${productName} helps pets - show ingredients, how it works, and pet health benefit`,
      baby: `how ${productName} is safe for babies - show gentle ingredients, safety features, and benefit`,
    };

    const explanation = productExplanations[categoryKey] || `what ${productName} does and how it benefits the user`;

    const imagePrompt = `Create a simple, easy-to-understand infographic explaining ${explanation} for beginners.

INFOGRAPHIC STYLE:
- Modern flat design
- Minimal, clean layout
- White or light background
- Soft rounded icons
- Simple arrows and labels connecting each step
- Designed like a health app graphic
- Easy for ages 30-60 to understand
- Large, readable text
- 3-4 simple steps maximum
- Professional but friendly look
${keyBenefit ? `\nHighlight this key benefit: "${keyBenefit}"` : ''}

This will be used as a TikTok LIVE stream background, so keep it clean and not too busy.`;

    // Use Nano Banana Pro (Gemini 3 Pro Image Preview)
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: imagePrompt,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      }
    });

    // Extract image from Gemini response
    let imageData: string | null = null;
    let mimeType: string = 'image/png';

    // Gemini image generation response format
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }
    }

    if (!imageData) {
      return res.status(200).json({
        success: true,
        hasImage: false,
        suggestion: { title: style.title, steps: style.steps, colors: style.colors }
      });
    }

    return res.status(200).json({
      success: true,
      hasImage: true,
      image: { data: imageData, mimeType },
      style: { title: style.title, steps: style.steps }
    });

  } catch (error: any) {
    console.error('[Infographic Generation Error]:', error);
    return res.status(200).json({
      success: true,
      hasImage: false,
      error: 'Image generation temporarily unavailable',
      suggestion: { title: style.title, steps: style.steps, colors: style.colors }
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  if (action === 'script') {
    return generateScript(req, res);
  } else if (action === 'infographic') {
    return generateInfographic(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid action. Use "script" or "infographic"' });
  }
}

