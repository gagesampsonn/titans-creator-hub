/**
 * TikTok Service - Frontend Client
 * 
 * SECURITY:
 * - This file runs in the browser
 * - It ONLY calls our secure backend APIs
 * - No TikTok secrets are ever used here
 * - All sensitive operations happen server-side
 */

import { supabase } from './supabase';

const API_BASE = '/api/tiktok';

/**
 * Get the current auth token for API calls
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Make authenticated API request
 */
async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

/**
 * Check if user has a connected TikTok account
 */
export async function getTikTokStatus() {
  return authFetch('/status');
}

/**
 * Get the TikTok authorization URL
 * @param userId - The current user's ID
 */
export async function getTikTokAuthUrl(userId: string): Promise<string> {
  // Generate CSRF token
  const csrf = crypto.randomUUID();
  
  // Store CSRF in sessionStorage for validation
  sessionStorage.setItem('tiktok_csrf', csrf);
  
  // Create state parameter with user ID and CSRF
  const state = btoa(JSON.stringify({ userId, csrf }));
  
  const response = await fetch(`${API_BASE}/auth-url?state=${encodeURIComponent(state)}`);
  
  if (!response.ok) {
    throw new Error('Failed to get auth URL');
  }
  
  const data = await response.json();
  return data.authUrl;
}

/**
 * Start the TikTok connection flow
 * Opens TikTok OAuth in current window
 */
export async function connectTikTok(userId: string) {
  const authUrl = await getTikTokAuthUrl(userId);
  window.location.href = authUrl;
}

/**
 * Disconnect TikTok account
 */
export async function disconnectTikTok() {
  return authFetch('/disconnect', { method: 'POST' });
}

/**
 * Get TikTok Shop metrics
 */
export async function getTikTokMetrics() {
  return authFetch('/metrics');
}

/**
 * Types for TikTok data
 */
export interface TikTokStatus {
  connected: boolean;
  needsReauth?: boolean;
  username?: string;
  sellerType?: string;
  hasShop?: boolean;
  connectedAt?: string;
}

export interface TikTokMetrics {
  connected: boolean;
  username?: string;
  metrics?: {
    summary: {
      gmv7Day: number;
      gmv30Day: number;
      commission7Day: number;
      commission30Day: number;
      ordersTotal: number;
      itemsSold: number;
      refundRate: number;
    };
    dailyGMV: Array<{ date: string; value: number }>;
    topProducts: Array<{ name: string; sales: number; revenue: number }>;
    lastUpdated: string;
  };
  needsConnection?: boolean;
  needsReconnection?: boolean;
}
