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
        sender: { name: 'Titans Agency', email: 'script@titansagency.co' },
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
    brandName,
    productName,
    category,
    targetAudience,
    productDescription,
    keyBenefit,
    template, // Template data from library
  } = req.body;

  if (!productName?.trim()) return res.status(400).json({ error: 'Product type is required', success: false });
  if (!category) return res.status(400).json({ error: 'Product category is required', success: false });
  if (!targetAudience) return res.status(400).json({ error: 'Target audience is required', success: false });
  
  // Build full product name
  const fullProductName = brandName?.trim() 
    ? `${brandName.trim()} ${productName.trim()}` 
    : productName.trim();

  // No auth required for script generation - email capture happens after

  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'AI service not configured', success: false });

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const categoryKey = category.toLowerCase().replace(/[^a-z]/g, '');
    // Use template authority words if provided, otherwise use category defaults
    const authorityWords = template?.authorityWords || authorityWordsByCategory[categoryKey] || authorityWordsByCategory.other;
    const coreAngles = template?.coreAngles || [];
    const demoIdeas = template?.demoIdeas || [];
    const audienceLabel = audienceLabels[targetAudience] || targetAudience;
    const categoryLabel = productCategoryLabels[categoryKey] || category;

    // Build template-specific guidance
    const templateGuidance = template ? `
TEMPLATE GUIDANCE (Titans Library):
Authority Words to USE: ${authorityWords.join(', ')}
Core Angles to cover: ${coreAngles.join(', ')}
Demo Ideas: ${demoIdeas.join('; ')}
` : '';

    const systemPrompt = `TIKTOK SHOP LIVE SCRIPT GENERATOR

TASK: Generate TikTok Shop LIVE talking points for "${fullProductName}"
Creator is speaking casually on livestream while viewers enter and leave constantly.

TONE RULES:
- Calm
- Informational
- Casual
- No hype energy
- No cringe persuasion tone
- No exclamation marks
- Feels like commentary + instruction, not a commercial

BANNED LANGUAGE (never use):
fuel your, power, game changer, level up, don't wait, secure yours, act now, crazy results, shred, transform, miracle, instant
No medical claims. No guarantees.

NICHE AUTHORITY WORD RULE (CRITICAL):
Every bullet MUST include at least one niche authority word — a term people in that category recognize.
Use these authority words: ${authorityWords.join(', ')}
These words signal expertise.
${templateGuidance}
PRODUCT INFO:
PRODUCT NAME: ${fullProductName}
TYPE: ${productName}
AUDIENCE: ${audienceLabel}
CATEGORY: ${categoryLabel}
${productDescription ? `NOTES: ${productDescription}` : ''}
${keyBenefit ? `MAIN BENEFIT: ${keyBenefit}` : ''}

OUTPUT FORMAT:

**LIVE SCRIPT**

8-12 bullet points TOTAL. Max 10 words per bullet.
Each bullet must contain one niche authority word OR a short direct CTA.
CTAs: tap the cart, click the link below, grab it from the cart, add it to your cart, cart's right there, hit the shopping cart

Structure should naturally include:
- what it is
- key spec
- benefit
- demo/feature mention
- who it's for
- objection killer
- social proof
- multiple short CTAs throughout (every 2-3 lines)

• [bullet with authority word about what it is]
• [bullet with key spec/feature]
• tap the cart
• [bullet with benefit using authority word]
• [bullet about who it's for]
• seeing people grab this in the chat
• grab it from the cart
• [bullet with product detail/spec]
• [objection killer]
• cart's right there
• [social proof or final detail]
• click the shopping cart

**WHAT EACH LINE DOES**

Line 1 — [purpose]
Line 2 — [purpose]
Line 3 — CTA
(etc for each line)

**CTA LOOP** (4 short repeatable CTAs)

• tap the cart
• cart's right there
• grab it below
• click the shopping cart

USE REAL KNOWLEDGE about ${productName}. Include authority words specific to ${categoryLabel}.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [{ text: systemPrompt }] },
    });

    const script = response.text || "Failed to generate script. Please try again.";

    // Lead saving now happens separately via save-lead action

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
  const { brandName, productName, category, keyBenefit, infographicPrompt: customInfographicPrompt } = req.body;

  if (!productName?.trim()) return res.status(400).json({ error: 'Product type is required' });

  const fullProductName = brandName?.trim() 
    ? `${brandName.trim()} ${productName.trim()}` 
    : productName.trim();
    
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

    // Problem-to-solution mapping by category
    const categoryProblems: Record<string, { problem: string; action: string; bodyEffect: string; finalBenefit: string; benefits: string[] }> = {
      supplements: {
        problem: 'low energy, fatigue, or feeling sluggish',
        action: 'boosts blood flow and nutrient absorption',
        bodyEffect: 'more oxygen reaches your cells and muscles',
        finalBenefit: 'more natural energy throughout the day',
        benefits: ['Energy', 'Focus', 'Immunity', 'Mood', 'Strength']
      },
      beauty: {
        problem: 'dry skin, dull complexion, or aging signs',
        action: 'hydrates and nourishes skin layers',
        bodyEffect: 'skin cells repair and regenerate faster',
        finalBenefit: 'smoother, glowing, healthier-looking skin',
        benefits: ['Hydration', 'Glow', 'Smoothness', 'Firmness', 'Radiance']
      },
      cologne: {
        problem: 'wanting to smell great and make an impression',
        action: 'releases layered scent notes over time',
        bodyEffect: 'top notes fade into rich heart and base notes',
        finalBenefit: 'confident, lasting presence for 6-8 hours',
        benefits: ['Longevity', 'Projection', 'Compliments', 'Confidence', 'Style']
      },
      fragrance: {
        problem: 'wanting to smell great and make an impression',
        action: 'releases layered scent notes over time',
        bodyEffect: 'top notes fade into rich heart and base notes',
        finalBenefit: 'confident, lasting presence for 6-8 hours',
        benefits: ['Longevity', 'Projection', 'Compliments', 'Confidence', 'Style']
      },
      tech: {
        problem: 'wasting time on manual tasks or inefficiency',
        action: 'automates and streamlines the process',
        bodyEffect: 'works smarter so you don\'t have to',
        finalBenefit: 'more time and less stress',
        benefits: ['Speed', 'Ease', 'Smart', 'Efficiency', 'Control']
      },
      fitness: {
        problem: 'lack of strength, endurance, or progress',
        action: 'targets muscles and supports recovery',
        bodyEffect: 'muscles rebuild stronger after workouts',
        finalBenefit: 'better performance and visible gains',
        benefits: ['Strength', 'Endurance', 'Recovery', 'Performance', 'Energy']
      },
      home: {
        problem: 'clutter, mess, or daily inconvenience',
        action: 'organizes and simplifies your routine',
        bodyEffect: 'less time spent on tedious tasks',
        finalBenefit: 'a cleaner, more comfortable home',
        benefits: ['Clean', 'Easy', 'Time-Saving', 'Comfort', 'Peace']
      },
      fashion: {
        problem: 'not feeling confident in your look',
        action: 'fits perfectly and elevates your style',
        bodyEffect: 'you look put-together effortlessly',
        finalBenefit: 'more confidence in how you present yourself',
        benefits: ['Style', 'Comfort', 'Confidence', 'Quality', 'Versatility']
      },
      food: {
        problem: 'poor nutrition or unhealthy eating habits',
        action: 'delivers quality nutrients your body needs',
        bodyEffect: 'your body absorbs real, clean ingredients',
        finalBenefit: 'feeling healthier and more satisfied',
        benefits: ['Nutrition', 'Energy', 'Taste', 'Health', 'Quality']
      },
      pets: {
        problem: 'pet health issues or picky eating',
        action: 'provides nutrients pets actually need',
        bodyEffect: 'supports their digestion and energy',
        finalBenefit: 'a happier, healthier pet',
        benefits: ['Health', 'Energy', 'Coat', 'Digestion', 'Happiness']
      },
      baby: {
        problem: 'keeping baby safe and comfortable',
        action: 'uses gentle, safe materials',
        bodyEffect: 'no harsh chemicals or irritants',
        finalBenefit: 'peace of mind for parents, comfort for baby',
        benefits: ['Safety', 'Gentle', 'Comfort', 'Quality', 'Trust']
      },
      other: {
        problem: 'a common daily frustration',
        action: 'solves the problem simply',
        bodyEffect: 'makes your life easier',
        finalBenefit: 'less stress, better results',
        benefits: ['Easy', 'Effective', 'Quality', 'Value', 'Results']
      }
    };

    const catData = categoryProblems[categoryKey] || categoryProblems.other;
    
    // Product-specific knowledge for smarter infographics
    const productKnowledge: Record<string, { problem: string; action: string; bodyEffect: string; result: string }> = {
      'creatine': {
        problem: 'Weak muscles, low energy in gym',
        action: 'Increases ATP (muscle fuel)',
        bodyEffect: 'Muscles hold more water & energy',
        result: 'Bigger pumps, more strength'
      },
      'ashwagandha': {
        problem: 'High stress, poor sleep',
        action: 'Lowers cortisol (stress hormone)',
        bodyEffect: 'Body relaxes, mind calms',
        result: 'Better sleep, less anxiety'
      },
      'collagen': {
        problem: 'Wrinkles, weak hair/nails',
        action: 'Rebuilds skin protein',
        bodyEffect: 'Skin cells regenerate faster',
        result: 'Firmer skin, stronger hair'
      },
      'pre-workout': {
        problem: 'Low energy, weak workouts',
        action: 'Boosts blood flow & focus',
        bodyEffect: 'More oxygen to muscles',
        result: 'Bigger pumps, better performance'
      },
      'nitric oxide': {
        problem: 'Poor circulation, low energy',
        action: 'Opens blood vessels wider',
        bodyEffect: 'More blood flow everywhere',
        result: 'More energy, better performance'
      },
      'testosterone': {
        problem: 'Low T, fatigue, low drive',
        action: 'Supports natural T production',
        bodyEffect: 'Hormones rebalance',
        result: 'More energy, strength, drive'
      },
      'protein': {
        problem: 'Slow muscle recovery',
        action: 'Delivers amino acids to muscles',
        bodyEffect: 'Muscles repair faster',
        result: 'Faster gains, less soreness'
      },
      'vitamin d': {
        problem: 'Low energy, weak immunity',
        action: 'Supports immune & bone health',
        bodyEffect: 'Body functions better',
        result: 'More energy, stronger immunity'
      },
      'magnesium': {
        problem: 'Poor sleep, muscle cramps',
        action: 'Relaxes muscles & nerves',
        bodyEffect: 'Body calms down naturally',
        result: 'Better sleep, fewer cramps'
      }
    };
    
    // Find matching product knowledge
    const productLower = productName.toLowerCase();
    let productData = catData;
    for (const [key, data] of Object.entries(productKnowledge)) {
      if (productLower.includes(key)) {
        productData = { ...catData, ...data };
        break;
      }
    }
    
    // Override with user-provided benefit if available
    const userProblem = keyBenefit ? `${keyBenefit}` : productData.problem;

    // Use custom template prompt if provided, otherwise build default
    const imagePrompt = customInfographicPrompt 
      ? `${customInfographicPrompt}

STYLE REQUIREMENTS:
- Modern flat design, soft blue/green/neutral tones
- White or very light background
- Simple rounded icons for each step
- Clear arrows connecting steps
- Large readable text (ages 30-60 friendly)
- NO brand logos, NO product photos
- Clean enough for TikTok LIVE background`
      : `Create a clean, easy-to-understand infographic that visually explains how ${productName.toUpperCase()} works in the body.

IMPORTANT: You know what ${productName} does. Use that knowledge to create an accurate infographic.

Use arrows, simple icons, and minimal text. 4 steps in a grid layout:

Step 1: THE PROBLEM - ${userProblem}
Step 2: WHAT ${fullProductName.toUpperCase()} DOES - ${productData.action}
Step 3: HOW IT HELPS THE BODY - ${productData.bodyEffect}
Step 4: THE RESULT - ${productData.finalBenefit || (productData as any).result || catData.finalBenefit}

At the bottom, add a horizontal bar with benefit icons:
${catData.benefits.join(' | ')}

STYLE:
- Modern flat design, soft blue/green/neutral tones
- White or very light background
- Simple rounded icons for each step
- Clear arrows connecting steps
- Large readable text (ages 30-60 friendly)
- NO brand logos, NO product photos
- Clean enough for TikTok LIVE background`;

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

/**
 * Save lead and send email (called after user unlocks script)
 */
async function saveLead(req: VercelRequest, res: VercelResponse) {
  const { email, phone, productName, category, targetAudience, script } = req.body;

  if (!email?.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Save lead to database
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

    // Send email with script
    if (script && productName) {
      await sendBrevoEmail(email.trim(), productName, script);
    }

    return res.status(200).json({ success: true, message: 'Lead saved and email sent' });
  } catch (error: any) {
    console.error('[Save Lead Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to save lead' });
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
  } else if (action === 'save-lead') {
    return saveLead(req, res);
  } else {
    return res.status(400).json({ error: 'Invalid action. Use "script", "infographic", or "save-lead"' });
  }
}

