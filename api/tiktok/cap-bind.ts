/**
 * /api/tiktok/cap-bind
 * 
 * CAP (Creator Agency Partner) Binding API
 * 
 * Handles:
 * - GET: Check current CAP binding status
 * - POST: Initiate CAP binding (link creator to Titans agency)
 * - DELETE: Unlink from CAP agency
 * 
 * This connects creators to Titans as a Creator Agency Partner,
 * enabling us to access their detailed performance data and manage
 * commission sharing.
 * 
 * TikTok Partner Center docs:
 * https://partner.tiktokshop.com/docv2/page/660357886d72f402e3b598fe
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { CAPBinding, CAPBindingRequest, CAPBindingResponse } from '../../lib/tiktokPartnerTypes';

// Initialize Supabase clients
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// TikTok Partner API base URL
const TIKTOK_API_BASE = 'https://open-api.tiktokglobalshop.com';

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
 * GET - Check CAP binding status
 */
async function handleGetStatus(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user's CAP binding status
    const { data: binding, error } = await supabase
      .from('cap_bindings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching CAP binding:', error);
      return res.status(500).json({ error: 'Failed to fetch binding status' });
    }

    if (!binding) {
      return res.status(200).json({
        isLinked: false,
        binding: null,
        message: 'No CAP binding found. Link to Titans agency to access detailed analytics.',
      });
    }

    // Transform to camelCase for frontend
    const transformedBinding: CAPBinding = {
      id: binding.id,
      userId: binding.user_id,
      tiktokConnectionId: binding.tiktok_connection_id,
      creatorId: binding.creator_id,
      agencyId: binding.agency_id,
      bindingStatus: binding.binding_status,
      dataAuthorizationLevel: binding.data_authorization_level,
      commissionShareRate: binding.commission_share_rate,
      commissionAgreementId: binding.commission_agreement_id,
      invitationSentAt: binding.invitation_sent_at,
      linkedAt: binding.linked_at,
      expiresAt: binding.expires_at,
      unlinkedAt: binding.unlinked_at,
      createdAt: binding.created_at,
      updatedAt: binding.updated_at,
    };

    return res.status(200).json({
      isLinked: binding.binding_status === 'linked',
      binding: transformedBinding,
    });

  } catch (error) {
    console.error('CAP status error:', error);
    return res.status(500).json({ error: 'Failed to check CAP status' });
  }
}

/**
 * POST - Initiate CAP binding
 * 
 * Flow:
 * 1. Check if user has TikTok connection
 * 2. Call TikTok Partner API to create invitation
 * 3. Store pending binding in database
 * 4. Return invitation URL for creator to accept
 */
async function handleInitiateBinding(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body as CAPBindingRequest;

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
        error: 'No TikTok account connected. Please connect your TikTok Shop account first.',
        needsConnection: true,
      });
    }

    // Check for existing binding
    const { data: existingBinding } = await supabaseAdmin
      .from('cap_bindings')
      .select('*')
      .eq('user_id', user.id)
      .eq('binding_status', 'linked')
      .single();

    if (existingBinding) {
      return res.status(400).json({
        error: 'Already linked to an agency. Unlink first to change.',
        isLinked: true,
      });
    }

    // Get our CAP agency ID from environment
    const agencyId = process.env.TIKTOK_CAP_AGENCY_ID;
    if (!agencyId) {
      console.error('TIKTOK_CAP_AGENCY_ID not configured');
      return res.status(500).json({ error: 'CAP integration not configured' });
    }

    // TODO: Call TikTok Partner API to create invitation
    // For now, we'll create a pending binding and simulate the flow
    // 
    // Real implementation would look like:
    // const invitationResponse = await callTikTokAPI('/affiliate/202405/creators/invite', {
    //   method: 'POST',
    //   accessToken: connection.access_token,
    //   body: {
    //     creator_id: connection.tiktok_open_id,
    //     agency_id: agencyId,
    //     data_authorization_level: body.dataAuthorizationLevel || 'standard',
    //     commission_share_rate: body.commissionShareRate,
    //   },
    // });

    const creatorId = connection.tiktok_open_id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create or update binding record
    const { error: bindError } = await supabaseAdmin.rpc('upsert_cap_binding', {
      p_user_id: user.id,
      p_tiktok_connection_id: connection.id,
      p_creator_id: creatorId,
      p_agency_id: agencyId,
      p_binding_status: 'pending',
      p_data_authorization_level: body.dataAuthorizationLevel || 'standard',
      p_commission_share_rate: body.commissionShareRate || null,
    });

    if (bindError) {
      console.error('Error creating CAP binding:', bindError);
      return res.status(500).json({ error: 'Failed to create binding' });
    }

    // Update with invitation timestamp
    await supabaseAdmin
      .from('cap_bindings')
      .update({
        invitation_sent_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('user_id', user.id)
      .eq('creator_id', creatorId);

    // In production, this URL would come from TikTok API response
    // For now, return a placeholder
    const invitationUrl = `https://affiliate-us.tiktok.com/connection/invitation?agency_id=${agencyId}&creator_id=${creatorId}`;

    const response: CAPBindingResponse = {
      success: true,
      invitationUrl,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('CAP binding initiation error:', error);
    return res.status(500).json({ error: 'Failed to initiate CAP binding' });
  }
}

/**
 * PUT - Confirm CAP binding (called after creator accepts)
 * 
 * This would typically be called by:
 * 1. A webhook from TikTok when creator accepts
 * 2. Polling to check invitation status
 * 3. Manual confirmation after creator accepts in TikTok app
 */
async function handleConfirmBinding(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get pending binding
    const { data: binding, error: bindingError } = await supabaseAdmin
      .from('cap_bindings')
      .select('*')
      .eq('user_id', user.id)
      .eq('binding_status', 'pending')
      .single();

    if (bindingError || !binding) {
      return res.status(400).json({ error: 'No pending binding found' });
    }

    // TODO: Verify with TikTok API that binding was accepted
    // const verifyResponse = await callTikTokAPI('/affiliate/202405/creators/link_status', {
    //   accessToken: ...,
    //   params: { creator_id: binding.creator_id },
    // });

    // For now, simulate confirmation
    const { error: updateError } = await supabaseAdmin
      .from('cap_bindings')
      .update({
        binding_status: 'linked',
        linked_at: new Date().toISOString(),
      })
      .eq('id', binding.id);

    if (updateError) {
      console.error('Error confirming binding:', updateError);
      return res.status(500).json({ error: 'Failed to confirm binding' });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully linked to Titans agency!',
    });

  } catch (error) {
    console.error('CAP binding confirmation error:', error);
    return res.status(500).json({ error: 'Failed to confirm binding' });
  }
}

/**
 * DELETE - Unlink from CAP agency
 */
async function handleUnlink(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get current binding
    const { data: binding, error: bindingError } = await supabaseAdmin
      .from('cap_bindings')
      .select('*')
      .eq('user_id', user.id)
      .in('binding_status', ['linked', 'pending'])
      .single();

    if (bindingError || !binding) {
      return res.status(400).json({ error: 'No active binding found' });
    }

    // TODO: Call TikTok API to unlink
    // await callTikTokAPI('/affiliate/202405/creators/unlink', {
    //   method: 'POST',
    //   accessToken: ...,
    //   body: { creator_id: binding.creator_id, agency_id: binding.agency_id },
    // });

    // Update binding status
    const { error: updateError } = await supabaseAdmin
      .from('cap_bindings')
      .update({
        binding_status: 'unlinked',
        unlinked_at: new Date().toISOString(),
      })
      .eq('id', binding.id);

    if (updateError) {
      console.error('Error unlinking:', updateError);
      return res.status(500).json({ error: 'Failed to unlink' });
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully unlinked from agency',
    });

  } catch (error) {
    console.error('CAP unlink error:', error);
    return res.status(500).json({ error: 'Failed to unlink' });
  }
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS for preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      return handleGetStatus(req, res);
    case 'POST':
      return handleInitiateBinding(req, res);
    case 'PUT':
      return handleConfirmBinding(req, res);
    case 'DELETE':
      return handleUnlink(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
