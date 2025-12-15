/**
 * POST /api/samples/request
 * 
 * Creates a sample_request row for a product.
 * 
 * IDEMPOTENT: If a sample request already exists and is not cancelled,
 * returns the existing request instead of creating a duplicate.
 * 
 * SECURITY:
 * - Uses Supabase service role on the backend for writes
 * - user_id is derived from the Supabase auth session/JWT
 * - Creator cannot spoof another user's ID
 * - All requests are tied to authenticated user only
 * 
 * Request body:
 * {
 *   productId: string (required)
 *   productName?: string
 *   productImage?: string
 *   brand?: string
 *   commissionRate?: number
 * }
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
interface SampleRequestBody {
  productId: string;
  productName?: string;
  productImage?: string;
  brand?: string;
  commissionRate?: number;
}

interface SampleRequest {
  id: string;
  userId: string;
  productId: string;
  productName: string | null;
  productImage: string | null;
  brand: string | null;
  commissionRate: number | null;
  status: 'requested' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
  requestedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  eta: string | null;
}

interface SampleRequestResponse {
  success: boolean;
  sampleRequest: SampleRequest;
  isExisting: boolean;  // true if returned existing request instead of creating new
  message: string;
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
 * Transform database row to SampleRequest type
 */
function transformSampleRequest(row: any): SampleRequest {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    brand: row.brand,
    commissionRate: row.commission_rate ? parseFloat(row.commission_rate) : null,
    status: row.status,
    requestedAt: row.requested_at,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    eta: row.eta,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user - user_id derived from JWT, cannot be spoofed
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Parse and validate request body
  const body = req.body as SampleRequestBody;

  if (!body.productId) {
    return res.status(400).json({ error: 'productId is required' });
  }

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // IDEMPOTENT CHECK: If a sample request already exists and is not cancelled,
    // return the existing request instead of creating a duplicate
    // ─────────────────────────────────────────────────────────────────────────
    const { data: existingRequest, error: existingError } = await supabaseAdmin
      .from('sample_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('product_id', body.productId)
      .neq('status', 'cancelled')
      .single();

    if (existingRequest && !existingError) {
      // Request already exists, return it (idempotent behavior)
      const response: SampleRequestResponse = {
        success: true,
        sampleRequest: transformSampleRequest(existingRequest),
        isExisting: true,
        message: 'Sample request already exists for this product',
      };
      return res.status(200).json(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Create new sample request
    // user_id comes from authenticated JWT, not from request body
    // ─────────────────────────────────────────────────────────────────────────
    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('sample_requests')
      .insert({
        user_id: user.id,  // From JWT, cannot be spoofed
        product_id: body.productId,
        product_name: body.productName || null,
        product_image: body.productImage || null,
        brand: body.brand || null,
        commission_rate: body.commissionRate || null,
        status: 'requested',
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating sample request:', insertError);
      
      // Check for unique constraint violation (race condition)
      if (insertError.code === '23505') {
        // Another request was created between our check and insert, fetch it
        const { data: raceRequest } = await supabaseAdmin
          .from('sample_requests')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', body.productId)
          .neq('status', 'cancelled')
          .single();

        if (raceRequest) {
          const response: SampleRequestResponse = {
            success: true,
            sampleRequest: transformSampleRequest(raceRequest),
            isExisting: true,
            message: 'Sample request already exists for this product',
          };
          return res.status(200).json(response);
        }
      }

      return res.status(500).json({ error: 'Failed to create sample request' });
    }

    const response: SampleRequestResponse = {
      success: true,
      sampleRequest: transformSampleRequest(newRequest),
      isExisting: false,
      message: 'Sample request created successfully',
    };

    return res.status(201).json(response);

  } catch (error) {
    console.error('Sample request error:', error);
    return res.status(500).json({ error: 'Failed to process sample request' });
  }
}
