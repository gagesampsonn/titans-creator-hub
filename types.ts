export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  tagline: string;
  description: string;
  gmv7Day: number; // Raw number for sorting
  gmv7DayLabel: string; // "High", "Exploding"
  commissionRate: number;
  sampleAvailable: boolean;
  tags: string[];
  hooks: string[];
  contentTypes: string[];
}

export interface UserStats {
  savedProducts: number;
  linksCopied: number;
  samplesRequested: number;
  gmvGenerated: number;
}

export interface Brand {
  name: string;
  logo: string;
}

export type Category = "All" | "Beauty" | "Supplements" | "Pets" | "Lifestyle" | "Tech" | "Fashion";

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLE REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sample request status values
 * 
 * BUSINESS RULES:
 * - 'requested': Initial state, waiting for approval
 * - 'approved': Approved, waiting to ship
 * - 'shipped': In transit, creator should prep hooks (eligible for "Next Week")
 * - 'delivered': Creator has product IN HAND (eligible for "This Week's Plan")
 * - 'cancelled': Request was cancelled
 * 
 * NEVER suggest a product for immediate promotion unless status = 'delivered'
 */
export type SampleRequestStatus = 'requested' | 'approved' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Product with sample request data - used in Weekly Planner
 */
export interface ProductWithSample {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  brand: string | null;
  commissionRate: number | null;
  status: SampleRequestStatus;
  requestedAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  eta: string | null;
  trackingNumber?: string | null;
}

/**
 * Saved product without sample request - used in "Need Samples" section
 */
export interface SavedProductForPlanner {
  id: string;
  productId: string;
  productName: string | null;
  productImage: string | null;
  brand: string | null;
  commissionRate: number | null;
}

/**
 * Response from /api/samples/list endpoint
 */
export interface SamplesListResponse {
  eligibleThisWeek: ProductWithSample[];  // status = 'delivered' - CAN film content now
  eligibleNextWeek: ProductWithSample[];  // status = 'shipped' - prep hooks, arriving soon
  needsSamples: SavedProductForPlanner[]; // saved but no sample_request row
}

/**
 * Request body for /api/samples/request endpoint
 */
export interface SampleRequestBody {
  productId: string;
  productName?: string;
  productImage?: string;
  brand?: string;
  commissionRate?: number;
}

/**
 * Response from /api/samples/request endpoint
 */
export interface SampleRequestResponse {
  success: boolean;
  sampleRequest: ProductWithSample;
  isExisting: boolean;
  message: string;
}
