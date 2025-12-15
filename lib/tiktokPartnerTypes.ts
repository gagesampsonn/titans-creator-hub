/**
 * TikTok Shop Partner Center Types
 * 
 * Type definitions for TSP (TikTok Shop Partner), CAP (Creator Agency Partner),
 * and TAP (TikTok Affiliate Partner) integrations.
 * 
 * Based on TikTok Shop Partner Center documentation:
 * https://partner.tiktokshop.com/docv2/page/about-partner-center-console
 */

// ============================================
// CAP (Creator Agency Partner) Types
// ============================================

export type CAPBindingStatus = 
  | 'pending'    // Invitation sent, waiting for creator
  | 'linked'     // Creator accepted, fully linked
  | 'expired'    // Invitation expired
  | 'rejected'   // Creator rejected invitation
  | 'unlinked';  // Previously linked, now unlinked

export type DataAuthorizationLevel = 
  | 'basic'      // Basic profile + aggregate stats
  | 'standard'   // + Order data, product performance
  | 'full';      // + Commission details, revenue share

export interface CAPBinding {
  id: string;
  userId: string;
  tiktokConnectionId: string | null;
  
  // TikTok identifiers
  creatorId: string;
  agencyId: string;
  
  // Status
  bindingStatus: CAPBindingStatus;
  dataAuthorizationLevel: DataAuthorizationLevel;
  
  // Commission sharing
  commissionShareRate: number | null;
  commissionAgreementId: string | null;
  
  // Timestamps
  invitationSentAt: string | null;
  linkedAt: string | null;
  expiresAt: string | null;
  unlinkedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CAPBindingRequest {
  creatorId: string;
  dataAuthorizationLevel?: DataAuthorizationLevel;
  commissionShareRate?: number;
}

export interface CAPBindingResponse {
  success: boolean;
  binding?: CAPBinding;
  invitationUrl?: string;
  error?: string;
}

// ============================================
// TAP (TikTok Affiliate Partner) Types
// ============================================

export type TAPOfferType = 
  | 'increased_commission'   // Higher commission rate
  | 'bonus_commission'       // Extra bonus on top of base
  | 'flash_commission'       // Time-limited boost
  | 'exclusive_commission';  // Exclusive to specific creators

export type TAPOfferStatus = 
  | 'draft'
  | 'active'
  | 'paused'
  | 'expired'
  | 'cancelled';

export interface TAPOffer {
  id: string;
  
  // TikTok identifiers
  tiktokOfferId: string;
  tiktokCampaignId: string | null;
  partnerId: string;
  
  // Offer details
  offerName: string;
  offerType: TAPOfferType;
  
  // Product association
  productId: string | null;
  productName: string | null;
  productCategory: string | null;
  
  // Commission details
  baseCommissionRate: number;
  increasedCommissionRate: number;
  commissionBonusFlat: number | null;
  
  // Status and validity
  status: TAPOfferStatus;
  startDate: string;
  endDate: string;
  
  // Limits
  maxRedemptions: number | null;
  currentRedemptions: number;
  budgetLimit: number | null;
  budgetUsed: number;
  
  // Links
  offerUrl: string | null;
  termsConditions: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export type TAPAssignmentStatus = 
  | 'pending'      // Offer assigned, not yet accepted
  | 'active'       // Creator actively using offer
  | 'completed'    // Offer period ended
  | 'cancelled';   // Cancelled by either party

export interface CreatorTAPAssignment {
  id: string;
  userId: string;
  tapOfferId: string;
  
  // TikTok identifiers
  creatorAffiliateId: string;
  assignmentId: string | null;
  
  // Status
  status: TAPAssignmentStatus;
  
  // Generated links
  affiliateLink: string | null;
  shortLink: string | null;
  
  // Performance
  clicks: number;
  orders: number;
  gmv: number;
  commissionEarned: number;
  
  // Timestamps
  assignedAt: string;
  acceptedAt: string | null;
  expiresAt: string | null;
  
  // Expanded offer details (from join)
  offer?: TAPOffer;
}

// ============================================
// Performance Metrics Types
// ============================================

export interface CreatorPerformanceMetrics {
  id: string;
  userId: string;
  tiktokConnectionId: string | null;
  
  // Dimensions
  metricDate: string;
  productId: string | null;
  productName: string | null;
  tapOfferId: string | null;
  
  // Traffic metrics
  impressions: number;
  clicks: number;
  clickThroughRate: number;
  
  // Conversion metrics
  addToCarts: number;
  orders: number;
  conversionRate: number;
  
  // Revenue metrics
  gmv: number;
  commissionEarned: number;
  commissionRate: number;
  
  // Order quality
  itemsSold: number;
  avgOrderValue: number;
  refunds: number;
  refundAmount: number;
  refundRate: number;
  
  // Video metrics
  videoViews: number;
  videoLikes: number;
  videoShares: number;
  videoComments: number;
  
  // Metadata
  syncedFromTiktokAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSummary {
  // Aggregated metrics for dashboard
  gmv7Day: number;
  gmv30Day: number;
  gmvAllTime: number;
  
  commission7Day: number;
  commission30Day: number;
  commissionAllTime: number;
  
  orders7Day: number;
  orders30Day: number;
  ordersAllTime: number;
  
  itemsSold7Day: number;
  itemsSold30Day: number;
  
  avgCommissionRate: number;
  avgRefundRate: number;
  
  // Trends
  gmvTrend7Day: number;   // Percentage change vs previous 7 days
  gmvTrend30Day: number;  // Percentage change vs previous 30 days
}

export interface DailyMetric {
  date: string;
  gmv: number;
  commission: number;
  orders: number;
  clicks: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  productCategory: string | null;
  gmv: number;
  orders: number;
  commission: number;
  commissionRate: number;
}

// ============================================
// TikTok Partner Center API Types
// Based on Open API documentation
// ============================================

/**
 * TikTok API response wrapper
 */
export interface TikTokAPIResponse<T> {
  code: number;       // 0 = success
  message: string;
  request_id?: string;
  data?: T;
}

/**
 * Common pagination for list APIs
 */
export interface TikTokPagination {
  page_size: number;
  page_token?: string;
  total_count?: number;
  next_page_token?: string;
}

/**
 * Affiliate Partner API - Creator info
 */
export interface TikTokCreatorInfo {
  creator_id: string;
  creator_name: string;
  avatar_url?: string;
  follower_count?: number;
  is_linked: boolean;
  link_status?: string;
  performance_tier?: string;
}

/**
 * Affiliate Partner API - Creator performance
 */
export interface TikTokCreatorPerformance {
  creator_id: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  metrics: {
    gmv: number;
    order_count: number;
    commission: number;
    item_sold: number;
    refund_amount: number;
    refund_count: number;
    click_count: number;
    impression_count: number;
  };
}

/**
 * Affiliate Partner API - Campaign/Offer
 */
export interface TikTokPartnerCampaign {
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  status: string;
  start_time: number;
  end_time: number;
  commission_rate?: number;
  products?: Array<{
    product_id: string;
    product_name: string;
    commission_rate: number;
  }>;
}

// ============================================
// API Request/Response Types for Titans
// ============================================

export interface SyncMetricsRequest {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  forceRefresh?: boolean;
}

export interface SyncMetricsResponse {
  success: boolean;
  syncedRecords: number;
  lastSyncedAt: string;
  summary?: PerformanceSummary;
  error?: string;
}

export interface GetTAPOffersResponse {
  offers: TAPOffer[];
  myAssignments: CreatorTAPAssignment[];
}

export interface AssignTAPOfferRequest {
  offerId: string;
}

export interface AssignTAPOfferResponse {
  success: boolean;
  assignment?: CreatorTAPAssignment;
  affiliateLink?: string;
  error?: string;
}

// ============================================
// Dashboard State Types
// ============================================

export interface TitansPartnerState {
  // CAP binding
  capBinding: CAPBinding | null;
  isCapLinked: boolean;
  
  // TAP offers
  availableOffers: TAPOffer[];
  myAssignments: CreatorTAPAssignment[];
  
  // Metrics
  performanceSummary: PerformanceSummary | null;
  dailyMetrics: DailyMetric[];
  topProducts: TopProduct[];
  
  // Sync status
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncError: string | null;
}

// ============================================
// Environment Configuration
// ============================================

export interface TikTokPartnerConfig {
  // App credentials (server-side only)
  appKey: string;
  appSecret: string;
  
  // Our partner IDs
  capAgencyId: string;     // Our CAP agency ID
  tapPartnerId: string;    // Our TAP partner ID
  tspPartnerId: string;    // Our TSP partner ID
  
  // API endpoints
  apiBaseUrl: string;
  authBaseUrl: string;
  
  // Callback URLs
  redirectUrl: string;
  capBindingCallbackUrl: string;
}

/**
 * Get partner config from environment
 * NOTE: Only call this server-side!
 */
export function getPartnerConfig(): TikTokPartnerConfig {
  return {
    appKey: process.env.TIKTOK_APP_KEY || '',
    appSecret: process.env.TIKTOK_APP_SECRET || '',
    capAgencyId: process.env.TIKTOK_CAP_AGENCY_ID || '',
    tapPartnerId: process.env.TIKTOK_TAP_PARTNER_ID || '',
    tspPartnerId: process.env.TIKTOK_TSP_PARTNER_ID || '',
    apiBaseUrl: 'https://open-api.tiktokglobalshop.com',
    authBaseUrl: 'https://auth.tiktok-shops.com',
    redirectUrl: process.env.TIKTOK_REDIRECT_URL || '',
    capBindingCallbackUrl: process.env.TIKTOK_CAP_CALLBACK_URL || '',
  };
}
