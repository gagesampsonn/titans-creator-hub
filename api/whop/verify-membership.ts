/**
 * POST /api/whop/verify-membership
 * SECURITY: Rate limited to 10 requests/15min (auth endpoint)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inline rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
function applyRateLimit(req: VercelRequest, res: VercelResponse, prefix: string): boolean {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : 'unknown';
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 min for auth
  const maxRequests = 10;
  
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  if (record.count >= maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return true;
  }
  record.count++;
  return false;
}

// Whop API Configuration
const WHOP_API_KEY = process.env.WHOP_API_KEY;
const WHOP_COMPANY_ID = process.env.WHOP_COMPANY_ID || 'biz_J3SyKv9rpw2UV3';

// Products that grant course access
const COURSE_ACCESS_PRODUCTS = [
  'prod_b9nwQp4et1rFi', // Exclusive ($50/month)
  'prod_TfyXJ8F6lsXR7', // Weekly ($15/week)
  'prod_X69HzpVuuiAbN', // Titans Agency ($5)
  'prod_zfzOjL0XxtTgH', // Titans Inner Circle ($2,000)
];

// Admin emails that always have access (bypasses WHOP check)
const ADMIN_EMAILS = [
  'gagesampson2016@gmail.com',
];

interface WhopMembership {
  id: string;
  product: {
    id: string;
    name: string;
  };
  status: string;
  valid: boolean;
  user: {
    email: string;
    username?: string;
  };
}

interface WhopMembershipsResponse {
  data: WhopMembership[];
  pagination?: {
    current_page: number;
    total_page: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 10 requests per 15 min
  if (applyRateLimit(req, res, 'whop-verify')) return;

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Admin bypass - always grant access to admin emails
  const normalizedEmail = email.toLowerCase().trim();
  if (ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalizedEmail)) {
    console.log('[Whop] Admin bypass for:', email);
    return res.status(200).json({
      hasAccess: true,
      activeProducts: [{ id: 'admin', name: 'Admin Access' }],
      membershipCount: 1,
      isAdmin: true,
    });
  }

  if (!WHOP_API_KEY) {
    console.error('[Whop] API key not configured');
    return res.status(500).json({ error: 'Whop API not configured' });
  }

  try {
    // Query Whop API for memberships by email
    const response = await fetch(
      `https://api.whop.com/api/v5/company/memberships?email=${encodeURIComponent(email)}&valid=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Whop] API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to verify membership',
        hasAccess: false 
      });
    }

    const data: WhopMembershipsResponse = await response.json();
    
    // Check if user has any active membership with course access products
    const hasAccess = data.data?.some((membership) => {
      const productId = membership.product?.id;
      const isValidProduct = COURSE_ACCESS_PRODUCTS.includes(productId);
      const isActive = membership.valid && membership.status === 'active';
      
      console.log('[Whop] Checking membership:', {
        productId,
        productName: membership.product?.name,
        isValidProduct,
        isActive,
        status: membership.status,
      });
      
      return isValidProduct && isActive;
    }) ?? false;

    // Get the active products for the user
    const activeProducts = data.data
      ?.filter((m) => m.valid && m.status === 'active' && COURSE_ACCESS_PRODUCTS.includes(m.product?.id))
      ?.map((m) => ({
        id: m.product?.id,
        name: m.product?.name,
      })) ?? [];

    console.log('[Whop] Verification result:', {
      email,
      hasAccess,
      activeProducts: activeProducts.length,
    });

    return res.status(200).json({
      hasAccess,
      activeProducts,
      membershipCount: data.data?.length ?? 0,
    });
  } catch (error) {
    console.error('[Whop] Verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify membership',
      hasAccess: false 
    });
  }
}

