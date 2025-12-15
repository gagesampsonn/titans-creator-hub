/**
 * TikTok Service - Frontend Client
 * 
 * Provides frontend API for:
 * - TikTok OAuth connection
 * - CAP (Creator Agency Partner) binding
 * - TAP (TikTok Affiliate Partner) offers
 * - Performance metrics sync
 * 
 * SECURITY:
 * - This file runs in the browser
 * - It ONLY calls our secure backend APIs
 * - No TikTok secrets are ever used here
 * - All sensitive operations happen server-side
 */

import { supabase } from './supabase';
import type {
  CAPBinding,
  CAPBindingRequest,
  CAPBindingResponse,
  TAPOffer,
  CreatorTAPAssignment,
  GetTAPOffersResponse,
  AssignTAPOfferResponse,
  PerformanceSummary,
  DailyMetric,
  TopProduct,
} from './tiktokPartnerTypes';

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
async function authFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

// ============================================
// TikTok Connection (OAuth)
// ============================================

/**
 * Check if user has a connected TikTok account
 */
export async function getTikTokStatus(): Promise<TikTokStatus> {
  return authFetch<TikTokStatus>('/status');
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

// ============================================
// CAP (Creator Agency Partner) Binding
// ============================================

export interface CAPBindingStatus {
  isLinked: boolean;
  binding: CAPBinding | null;
  message?: string;
}

/**
 * Get CAP binding status
 */
export async function getCAPBindingStatus(): Promise<CAPBindingStatus> {
  return authFetch<CAPBindingStatus>('/cap-bind');
}

/**
 * Initiate CAP binding (link to Titans agency)
 */
export async function initiateCAPBinding(
  options?: CAPBindingRequest
): Promise<CAPBindingResponse> {
  return authFetch<CAPBindingResponse>('/cap-bind', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
}

/**
 * Confirm CAP binding after creator accepts
 */
export async function confirmCAPBinding(): Promise<{ success: boolean; message: string }> {
  return authFetch('/cap-bind', { method: 'PUT' });
}

/**
 * Unlink from CAP agency
 */
export async function unlinkCAP(): Promise<{ success: boolean; message: string }> {
  return authFetch('/cap-bind', { method: 'DELETE' });
}

// ============================================
// TAP (TikTok Affiliate Partner) Offers
// ============================================

/**
 * Get available TAP offers and user's assignments
 */
export async function getTAPOffers(): Promise<GetTAPOffersResponse> {
  return authFetch<GetTAPOffersResponse>('/tap-offers');
}

/**
 * Assign a TAP offer to the creator
 */
export async function assignTAPOffer(offerId: string): Promise<AssignTAPOfferResponse> {
  return authFetch<AssignTAPOfferResponse>('/tap-offers', {
    method: 'POST',
    body: JSON.stringify({ offerId }),
  });
}

/**
 * Remove a TAP offer assignment
 */
export async function removeTAPAssignment(
  assignmentId: string
): Promise<{ success: boolean; message: string }> {
  return authFetch(`/tap-offers?assignmentId=${assignmentId}`, {
    method: 'DELETE',
  });
}

// ============================================
// Performance Metrics
// ============================================

export interface MetricsResponse {
  connected: boolean;
  needsConnection?: boolean;
  summary?: PerformanceSummary;
  dailyMetrics?: DailyMetric[];
  topProducts?: TopProduct[];
  lastSyncedAt?: string;
}

export interface SyncMetricsResponse extends MetricsResponse {
  success: boolean;
  syncedRecords: number;
  cached?: boolean;
}

/**
 * Get cached performance metrics
 */
export async function getMetrics(): Promise<MetricsResponse> {
  return authFetch<MetricsResponse>('/sync-metrics');
}

/**
 * Sync metrics from TikTok (with rate limiting)
 */
export async function syncMetrics(options?: {
  forceRefresh?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<SyncMetricsResponse> {
  return authFetch<SyncMetricsResponse>('/sync-metrics', {
    method: 'POST',
    body: JSON.stringify({
      forceRefresh: options?.forceRefresh,
      dateRange: options?.startDate && options?.endDate
        ? { startDate: options.startDate, endDate: options.endDate }
        : undefined,
    }),
  });
}

/**
 * Legacy metrics function for backward compatibility
 * @deprecated Use getMetrics() instead
 */
export async function getTikTokMetrics(): Promise<TikTokMetrics> {
  const response = await getMetrics();
  
  if (!response.connected || !response.summary) {
    return {
      connected: response.connected,
      needsConnection: response.needsConnection,
    };
  }

  return {
    connected: true,
    metrics: {
      summary: {
        gmv7Day: response.summary.gmv7Day,
        gmv30Day: response.summary.gmv30Day,
        commission7Day: response.summary.commission7Day,
        commission30Day: response.summary.commission30Day,
        ordersTotal: response.summary.ordersAllTime,
        itemsSold: response.summary.itemsSold30Day,
        refundRate: response.summary.avgRefundRate * 100,
      },
      dailyGMV: (response.dailyMetrics || []).map(d => ({
        date: d.date,
        value: d.gmv,
      })),
      topProducts: (response.topProducts || []).map(p => ({
        name: p.productName,
        sales: p.orders,
        revenue: p.gmv,
      })),
      lastUpdated: response.lastSyncedAt || new Date().toISOString(),
    },
  };
}

// ============================================
// Types for TikTok data
// ============================================

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

// Re-export types from tiktokPartnerTypes for convenience
export type {
  CAPBinding,
  CAPBindingRequest,
  CAPBindingResponse,
  TAPOffer,
  CreatorTAPAssignment,
  GetTAPOffersResponse,
  AssignTAPOfferResponse,
  PerformanceSummary,
  DailyMetric,
  TopProduct,
} from './tiktokPartnerTypes';
