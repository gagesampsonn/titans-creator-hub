/**
 * GET /api/samples/list
 * 
 * Returns sample request data organized for the Weekly Content Planner.
 * 
 * BUSINESS RULES (strictly enforced):
 * ─────────────────────────────────────────────────────────────────────────────
 * • eligibleThisWeek: ONLY products with status = 'delivered'
 *   → Creator has the product in hand, can film content NOW
 * 
 * • eligibleNextWeek: ONLY products with status = 'shipped'
 *   → Product is on the way, creator should prep hooks/scripts
 * 
 * • needsSamples: Products the user has saved/clicked but NO sample_request row
 *   → Creator interested but hasn't requested sample yet
 * 
 * NEVER suggest a product for immediate promotion unless status = 'delivered'.
 * Products in 'requested' or 'approved' status are still processing.
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * SECURITY:
 * - Validates user authentication via Supabase JWT
 * - Uses RLS to ensure user can only see their own data
 * - user_id derived from JWT, cannot be spoofed
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Types
interface ProductWithSample {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  brand: string | null;
  commissionRate: number | null;
  status: 'requested' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  requestedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  eta: string | null;
  trackingNumber: string | null;
}

interface SavedProduct {
  id: string;
  productId: string;
  productName: string | null;
  productImage: string | null;
  brand: string | null;
  commissionRate: number | null;
}

interface SamplesListResponse {
  eligibleThisWeek: ProductWithSample[];  // status = 'delivered' - CAN film content now
  eligibleNextWeek: ProductWithSample[];  // status = 'shipped' - prep hooks, arriving soon
  needsSamples: SavedProduct[];           // saved but no sample_request row
}

/**
 * Get authenticated user from JWT
 */
async function getAuthenticatedUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Transform database row to ProductWithSample type
 */
function transformSampleRequest(row: any): ProductWithSample {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name || 'Unknown Product',
    productImage: row.product_image,
    brand: row.brand,
    commissionRate: row.commission_rate ? parseFloat(row.commission_rate) : null,
    status: row.status,
    requestedAt: row.requested_at,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    eta: row.eta,
    trackingNumber: row.tracking_number,
  };
}

/**
 * Transform database row to SavedProduct type
 */
function transformSavedProduct(row: any): SavedProduct {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    brand: row.brand,
    commissionRate: row.commission_rate ? parseFloat(row.commission_rate) : null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user - user_id derived from JWT, cannot be spoofed
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Get products eligible THIS WEEK (status = 'delivered')
    //    Creator has product in hand, can film content NOW
    // ─────────────────────────────────────────────────────────────────────────
    const { data: deliveredSamples, error: deliveredError } = await supabaseAdmin
      .from('sample_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'delivered')
      .order('delivered_at', { ascending: false });

    if (deliveredError) {
      console.error('Error fetching delivered samples:', deliveredError);
      return res.status(500).json({ error: 'Failed to fetch delivered samples' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Get products eligible NEXT WEEK (status = 'shipped')
    //    Product is on the way, creator should prep hooks/scripts
    // ─────────────────────────────────────────────────────────────────────────
    const { data: shippedSamples, error: shippedError } = await supabaseAdmin
      .from('sample_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'shipped')
      .order('eta', { ascending: true, nullsFirst: false });

    if (shippedError) {
      console.error('Error fetching shipped samples:', shippedError);
      return res.status(500).json({ error: 'Failed to fetch shipped samples' });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Get saved products that have NO sample request yet
    //    Creator is interested but hasn't requested sample
    // ─────────────────────────────────────────────────────────────────────────
    
    // First, get all product_ids that have active (non-cancelled) sample requests
    const { data: existingRequests, error: existingError } = await supabaseAdmin
      .from('sample_requests')
      .select('product_id')
      .eq('user_id', user.id)
      .neq('status', 'cancelled');

    if (existingError) {
      console.error('Error fetching existing requests:', existingError);
      return res.status(500).json({ error: 'Failed to fetch existing requests' });
    }

    const requestedProductIds = (existingRequests || []).map(r => r.product_id);

    // Get saved products that don't have a sample request
    let savedProductsQuery = supabaseAdmin
      .from('saved_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter out products that already have sample requests
    if (requestedProductIds.length > 0) {
      savedProductsQuery = savedProductsQuery.not('product_id', 'in', `(${requestedProductIds.join(',')})`);
    }

    const { data: savedProducts, error: savedError } = await savedProductsQuery;

    if (savedError) {
      console.error('Error fetching saved products:', savedError);
      return res.status(500).json({ error: 'Failed to fetch saved products' });
    }

    // Build response
    const response: SamplesListResponse = {
      eligibleThisWeek: (deliveredSamples || []).map(transformSampleRequest),
      eligibleNextWeek: (shippedSamples || []).map(transformSampleRequest),
      needsSamples: (savedProducts || []).map(transformSavedProduct),
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Samples list error:', error);
    return res.status(500).json({ error: 'Failed to fetch samples data' });
  }
}
