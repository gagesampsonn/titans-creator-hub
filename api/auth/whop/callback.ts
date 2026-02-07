import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Whop OAuth2 - Step 2: Handle callback and establish session
 */

const WHOP_CLIENT_ID = process.env.WHOP_CLIENT_ID || '';
const WHOP_CLIENT_SECRET = process.env.WHOP_CLIENT_SECRET || '';
const WHOP_API_KEY = process.env.WHOP_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/whop/callback`
  : 'http://localhost:3000/api/auth/whop/callback';
const PROD_REDIRECT_URI = 'https://titans-creator-hub.vercel.app/api/auth/whop/callback';

// Frontend redirect after auth
const FRONTEND_SUCCESS = 'https://titans-creator-hub.vercel.app/#/dashboard';
const FRONTEND_ERROR = 'https://titans-creator-hub.vercel.app/#/login?error=whop';

interface WhopUser {
  id: string;
  email: string;
  username: string;
  name?: string;
  profile_pic_url?: string;
}

interface WhopMembership {
  id: string;
  product: {
    id: string;
    name: string;
  };
  status: string;
  valid: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: oauthError } = req.query;

  // Handle OAuth errors
  if (oauthError) {
    console.error('[Whop Callback] OAuth error:', oauthError);
    return res.redirect(302, `${FRONTEND_ERROR}&reason=${oauthError}`);
  }

  if (!code || typeof code !== 'string') {
    console.error('[Whop Callback] Missing authorization code');
    return res.redirect(302, `${FRONTEND_ERROR}&reason=missing_code`);
  }

  // Validate state (CSRF protection)
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>) || {};

  const storedState = cookies['whop_oauth_state'];
  if (!storedState || storedState !== state) {
    console.error('[Whop Callback] State mismatch');
    return res.redirect(302, `${FRONTEND_ERROR}&reason=state_mismatch`);
  }

  try {
    // Use production redirect in production
    const redirectUri = process.env.VERCEL_ENV === 'production' 
      ? PROD_REDIRECT_URI 
      : REDIRECT_URI;

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.whop.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: WHOP_CLIENT_ID,
        client_secret: WHOP_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Whop Callback] Token exchange failed:', errorText);
      return res.redirect(302, `${FRONTEND_ERROR}&reason=token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Whop
    const userResponse = await fetch('https://api.whop.com/v5/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('[Whop Callback] Failed to get user info');
      return res.redirect(302, `${FRONTEND_ERROR}&reason=user_fetch_failed`);
    }

    const whopUser: WhopUser = await userResponse.json();
    console.log('[Whop Callback] Whop user:', whopUser.username, whopUser.email);

    // Check user's memberships
    let hasActiveMembership = false;
    let activeProducts: { id: string; name: string }[] = [];

    try {
      const membershipsResponse = await fetch('https://api.whop.com/v5/me/memberships', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (membershipsResponse.ok) {
        const membershipsData = await membershipsResponse.json();
        const memberships: WhopMembership[] = membershipsData.data || [];
        
        activeProducts = memberships
          .filter(m => m.valid && m.status === 'active')
          .map(m => ({ id: m.product.id, name: m.product.name }));
        
        hasActiveMembership = activeProducts.length > 0;
        console.log('[Whop Callback] Active products:', activeProducts);
      }
    } catch (err) {
      console.error('[Whop Callback] Error checking memberships:', err);
    }

    // Create or update user in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const email = whopUser.email;
    
    // Look for existing profile with this Whop ID or email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, whop_id')
      .or(`whop_id.eq.${whopUser.id},email.eq.${email}`)
      .single();

    let userId: string;

    if (existingProfile) {
      // Update existing profile
      userId = existingProfile.id;
      
      await supabase
        .from('profiles')
        .update({
          whop_id: whopUser.id,
          whop_username: whopUser.username,
          whop_avatar: whopUser.profile_pic_url,
          whop_active_products: activeProducts,
          has_whop_membership: hasActiveMembership,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log('[Whop Callback] Updated existing profile:', userId);
    } else {
      // Create new user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: whopUser.name || whopUser.username,
          avatar_url: whopUser.profile_pic_url,
          provider: 'whop',
        },
      });

      if (authError) {
        console.error('[Whop Callback] Error creating user:', authError);
        return res.redirect(302, `${FRONTEND_ERROR}&reason=create_user_failed`);
      }

      userId = authData.user.id;

      // Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: whopUser.name || whopUser.username,
          whop_id: whopUser.id,
          whop_username: whopUser.username,
          whop_avatar: whopUser.profile_pic_url,
          whop_active_products: activeProducts,
          has_whop_membership: hasActiveMembership,
          updated_at: new Date().toISOString(),
        });

      console.log('[Whop Callback] Created new user:', userId);
    }

    // Generate a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: FRONTEND_SUCCESS,
      },
    });

    if (sessionError || !sessionData) {
      console.error('[Whop Callback] Error generating session:', sessionError);
      return res.redirect(302, `${FRONTEND_ERROR}&reason=session_failed`);
    }

    // Clear the state cookie
    res.setHeader('Set-Cookie', 'whop_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    
    // Use the action_link directly to sign in the user
    if (sessionData.properties.action_link) {
      console.log('[Whop Callback] Auth successful, redirecting via magic link...');
      return res.redirect(302, sessionData.properties.action_link);
    }

    // Fallback: redirect to dashboard
    return res.redirect(302, `${FRONTEND_SUCCESS}?whop_auth=success&has_membership=${hasActiveMembership}`);

  } catch (err) {
    console.error('[Whop Callback] Unexpected error:', err);
    return res.redirect(302, `${FRONTEND_ERROR}&reason=unexpected_error`);
  }
}

