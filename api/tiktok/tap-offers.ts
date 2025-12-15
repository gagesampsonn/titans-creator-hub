/**
 * /api/tiktok/tap-offers
 * 
 * TAP (TikTok Affiliate Partner) Offers API
 * 
 * Handles:
 * - GET: List available TAP offers and user's assignments
 * - POST: Assign a TAP offer to a creator (generate increased commission link)
 * - DELETE: Remove a TAP offer assignment
 * 
 * TAP offers are "increased commission" campaigns that we create as a partner.
 * Creators can add these offers to their showcase for higher commissions.
 * 
 * TikTok Partner Center docs:
 * https://partner.tiktokshop.com/docv2/page/66208ee0e696a602e0aac207
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { 
  TAPOffer, 
  CreatorTAPAssignment,
  GetTAPOffersResponse,
  AssignTAPOfferRequest,
  AssignTAPOfferResponse,
} from '../../lib/tiktokPartnerTypes';

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
 * Transform database row to TAPOffer type
 */
function transformOffer(row: any): TAPOffer {
  return {
    id: row.id,
    tiktokOfferId: row.tiktok_offer_id,
    tiktokCampaignId: row.tiktok_campaign_id,
    partnerId: row.partner_id,
    offerName: row.offer_name,
    offerType: row.offer_type,
    productId: row.product_id,
    productName: row.product_name,
    productCategory: row.product_category,
    baseCommissionRate: parseFloat(row.base_commission_rate) || 0,
    increasedCommissionRate: parseFloat(row.increased_commission_rate) || 0,
    commissionBonusFlat: row.commission_bonus_flat ? parseFloat(row.commission_bonus_flat) : null,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    maxRedemptions: row.max_redemptions,
    currentRedemptions: row.current_redemptions || 0,
    budgetLimit: row.budget_limit ? parseFloat(row.budget_limit) : null,
    budgetUsed: parseFloat(row.budget_used) || 0,
    offerUrl: row.offer_url,
    termsConditions: row.terms_conditions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform database row to CreatorTAPAssignment type
 */
function transformAssignment(row: any): CreatorTAPAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    tapOfferId: row.tap_offer_id,
    creatorAffiliateId: row.creator_affiliate_id,
    assignmentId: row.assignment_id,
    status: row.status,
    affiliateLink: row.affiliate_link,
    shortLink: row.short_link,
    clicks: row.clicks || 0,
    orders: row.orders || 0,
    gmv: parseFloat(row.gmv) || 0,
    commissionEarned: parseFloat(row.commission_earned) || 0,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at,
    expiresAt: row.expires_at,
    offer: row.tap_offers ? transformOffer(row.tap_offers) : undefined,
  };
}

/**
 * GET - List available TAP offers and user's assignments
 */
async function handleGetOffers(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all active TAP offers
    const { data: offers, error: offersError } = await supabase
      .from('tap_offers')
      .select('*')
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('increased_commission_rate', { ascending: false });

    if (offersError) {
      console.error('Error fetching TAP offers:', offersError);
      return res.status(500).json({ error: 'Failed to fetch offers' });
    }

    // Get user's current assignments with offer details
    const { data: assignments, error: assignmentsError } = await supabase
      .from('creator_tap_assignments')
      .select(`
        *,
        tap_offers (*)
      `)
      .eq('user_id', user.id)
      .in('status', ['pending', 'active']);

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return res.status(500).json({ error: 'Failed to fetch assignments' });
    }

    const response: GetTAPOffersResponse = {
      offers: (offers || []).map(transformOffer),
      myAssignments: (assignments || []).map(transformAssignment),
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('TAP offers fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch TAP offers' });
  }
}

/**
 * POST - Assign a TAP offer to the creator
 * 
 * This generates an increased commission affiliate link for the creator.
 */
async function handleAssignOffer(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body as AssignTAPOfferRequest;
  
  if (!body.offerId) {
    return res.status(400).json({ error: 'offerId is required' });
  }

  try {
    // Get user's TikTok connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from('tiktok_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connError || !connection) {
      return res.status(400).json({ 
        error: 'No TikTok account connected',
        needsConnection: true,
      });
    }

    // Verify offer exists and is active
    const { data: offer, error: offerError } = await supabaseAdmin
      .from('tap_offers')
      .select('*')
      .eq('id', body.offerId)
      .eq('status', 'active')
      .single();

    if (offerError || !offer) {
      return res.status(404).json({ error: 'Offer not found or not active' });
    }

    // Check if already assigned
    const { data: existingAssignment } = await supabaseAdmin
      .from('creator_tap_assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('tap_offer_id', body.offerId)
      .in('status', ['pending', 'active'])
      .single();

    if (existingAssignment) {
      return res.status(400).json({ 
        error: 'Already assigned to this offer',
        assignment: transformAssignment(existingAssignment),
      });
    }

    // Check redemption limits
    if (offer.max_redemptions && offer.current_redemptions >= offer.max_redemptions) {
      return res.status(400).json({ error: 'Offer has reached maximum redemptions' });
    }

    // TODO: Call TikTok API to generate affiliate link for this offer
    // const linkResponse = await callTikTokAPI('/affiliate/202405/offers/assign', {
    //   method: 'POST',
    //   accessToken: connection.access_token,
    //   body: {
    //     offer_id: offer.tiktok_offer_id,
    //     creator_id: connection.tiktok_open_id,
    //   },
    // });

    // Generate placeholder link (in production, this comes from TikTok API)
    const affiliateLink = `https://www.tiktok.com/@titans_shop/video?product_id=${offer.product_id || 'all'}&offer_id=${offer.tiktok_offer_id}&aff=${connection.tiktok_open_id}`;
    const shortLink = `https://vm.tiktok.com/${Math.random().toString(36).substring(7)}`;

    // Create assignment record
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('creator_tap_assignments')
      .insert({
        user_id: user.id,
        tap_offer_id: body.offerId,
        creator_affiliate_id: connection.tiktok_open_id,
        status: 'active',
        affiliate_link: affiliateLink,
        short_link: shortLink,
        expires_at: offer.end_date,
      })
      .select()
      .single();

    if (assignError) {
      console.error('Error creating assignment:', assignError);
      return res.status(500).json({ error: 'Failed to create assignment' });
    }

    // Increment redemption count on offer
    await supabaseAdmin
      .from('tap_offers')
      .update({ 
        current_redemptions: (offer.current_redemptions || 0) + 1 
      })
      .eq('id', body.offerId);

    const response: AssignTAPOfferResponse = {
      success: true,
      assignment: {
        ...transformAssignment(assignment),
        offer: transformOffer(offer),
      },
      affiliateLink: shortLink,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('TAP offer assignment error:', error);
    return res.status(500).json({ error: 'Failed to assign offer' });
  }
}

/**
 * DELETE - Remove a TAP offer assignment
 */
async function handleRemoveAssignment(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const assignmentId = req.query.assignmentId as string;
  
  if (!assignmentId) {
    return res.status(400).json({ error: 'assignmentId is required' });
  }

  try {
    // Verify assignment belongs to user
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from('creator_tap_assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Update assignment status
    const { error: updateError } = await supabaseAdmin
      .from('creator_tap_assignments')
      .update({ status: 'cancelled' })
      .eq('id', assignmentId);

    if (updateError) {
      console.error('Error cancelling assignment:', updateError);
      return res.status(500).json({ error: 'Failed to remove assignment' });
    }

    return res.status(200).json({
      success: true,
      message: 'Assignment removed successfully',
    });

  } catch (error) {
    console.error('TAP assignment removal error:', error);
    return res.status(500).json({ error: 'Failed to remove assignment' });
  }
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      return handleGetOffers(req, res);
    case 'POST':
      return handleAssignOffer(req, res);
    case 'DELETE':
      return handleRemoveAssignment(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
