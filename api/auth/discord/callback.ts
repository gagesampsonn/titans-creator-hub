import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * Discord OAuth2 - Step 2: Handle callback and check role membership
 * 
 * Discord Server ID: 1201451443031375942
 * Titans Member Role ID: 1241839380935610398
 */

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myylgglbtroabqclzvvn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TITANS_SERVER_ID = '1201451443031375942';
const TITANS_MEMBER_ROLE_ID = '1241839380935610398';

const REDIRECT_URI = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/auth/discord/callback`
  : 'http://localhost:3000/api/auth/discord/callback';
const PROD_REDIRECT_URI = 'https://titans-creator-hub.vercel.app/api/auth/discord/callback';

// Frontend redirect after auth
const FRONTEND_SUCCESS = 'https://titans-creator-hub.vercel.app/#/dashboard';
const FRONTEND_ERROR = 'https://titans-creator-hub.vercel.app/#/login?error=discord';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  global_name?: string;
}

interface GuildMember {
  roles: string[];
  nick?: string;
  user: DiscordUser;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: oauthError } = req.query;

  // Handle OAuth errors
  if (oauthError) {
    console.error('[Discord Callback] OAuth error:', oauthError);
    return res.redirect(302, `${FRONTEND_ERROR}&reason=${oauthError}`);
  }

  if (!code || typeof code !== 'string') {
    console.error('[Discord Callback] Missing authorization code');
    return res.redirect(302, `${FRONTEND_ERROR}&reason=missing_code`);
  }

  // Validate state (CSRF protection)
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>) || {};

  const storedState = cookies['discord_oauth_state'];
  if (!storedState || storedState !== state) {
    console.error('[Discord Callback] State mismatch');
    return res.redirect(302, `${FRONTEND_ERROR}&reason=state_mismatch`);
  }

  try {
    // Use production redirect in production
    const redirectUri = process.env.VERCEL_ENV === 'production' 
      ? PROD_REDIRECT_URI 
      : REDIRECT_URI;

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Discord Callback] Token exchange failed:', errorText);
      return res.redirect(302, `${FRONTEND_ERROR}&reason=token_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      console.error('[Discord Callback] Failed to get user info');
      return res.redirect(302, `${FRONTEND_ERROR}&reason=user_fetch_failed`);
    }

    const discordUser: DiscordUser = await userResponse.json();
    console.log('[Discord Callback] Discord user:', discordUser.username, discordUser.email);

    // Check if user is in the Titans server and has the role
    let hasTitansRole = false;
    
    try {
      const memberResponse = await fetch(
        `https://discord.com/api/users/@me/guilds/${TITANS_SERVER_ID}/member`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (memberResponse.ok) {
        const memberData: GuildMember = await memberResponse.json();
        hasTitansRole = memberData.roles.includes(TITANS_MEMBER_ROLE_ID);
        console.log('[Discord Callback] User roles:', memberData.roles);
        console.log('[Discord Callback] Has Titans role:', hasTitansRole);
      } else {
        console.log('[Discord Callback] User not in Titans server or cannot access member info');
      }
    } catch (err) {
      console.error('[Discord Callback] Error checking guild membership:', err);
    }

    // Create or update user in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists by email or Discord ID
    const email = discordUser.email || `${discordUser.id}@discord.user`;
    
    // Look for existing profile with this Discord ID
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, discord_id')
      .or(`discord_id.eq.${discordUser.id},email.eq.${email}`)
      .single();

    let userId: string;
    let sessionToken: string;

    if (existingProfile) {
      // Update existing profile
      userId = existingProfile.id;
      
      await supabase
        .from('profiles')
        .update({
          discord_id: discordUser.id,
          discord_username: discordUser.global_name || discordUser.username,
          discord_avatar: discordUser.avatar,
          has_titans_role: hasTitansRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log('[Discord Callback] Updated existing profile:', userId);
    } else {
      // Create new user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: discordUser.global_name || discordUser.username,
          avatar_url: discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : undefined,
          provider: 'discord',
        },
      });

      if (authError) {
        // User might exist with different email case, try to find them
        console.error('[Discord Callback] Error creating user:', authError);
        return res.redirect(302, `${FRONTEND_ERROR}&reason=create_user_failed`);
      }

      userId = authData.user.id;

      // Create profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: discordUser.global_name || discordUser.username,
          discord_id: discordUser.id,
          discord_username: discordUser.global_name || discordUser.username,
          discord_avatar: discordUser.avatar,
          has_titans_role: hasTitansRole,
          updated_at: new Date().toISOString(),
        });

      console.log('[Discord Callback] Created new user:', userId);
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
      console.error('[Discord Callback] Error generating session:', sessionError);
      return res.redirect(302, `${FRONTEND_ERROR}&reason=session_failed`);
    }

    // Extract the token from the magic link
    const magicLinkUrl = new URL(sessionData.properties.hashed_token ? 
      `${SUPABASE_URL}/auth/v1/verify?token=${sessionData.properties.hashed_token}&type=magiclink` :
      sessionData.properties.action_link || '');
    
    // Redirect to the magic link which will establish the session
    console.log('[Discord Callback] Auth successful, redirecting...');
    
    // Clear the state cookie
    res.setHeader('Set-Cookie', 'discord_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    
    // Use the action_link directly to sign in the user
    if (sessionData.properties.action_link) {
      return res.redirect(302, sessionData.properties.action_link);
    }

    // Fallback: redirect to dashboard with Discord user info in hash
    return res.redirect(302, `${FRONTEND_SUCCESS}?discord_auth=success&has_role=${hasTitansRole}`);

  } catch (err) {
    console.error('[Discord Callback] Unexpected error:', err);
    return res.redirect(302, `${FRONTEND_ERROR}&reason=unexpected_error`);
  }
}

