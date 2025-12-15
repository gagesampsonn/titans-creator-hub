/**
 * WeeklyPlanner.tsx - Weekly Content Planner Component
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * CRITICAL BUSINESS RULES (DO NOT MODIFY WITHOUT APPROVAL):
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. "This Week's Plan" (eligibleThisWeek):
 *    → ONLY shows products with status = 'delivered'
 *    → Creator has the physical product IN HAND
 *    → Can film content NOW
 *    → NEVER suggest a product for immediate promotion unless delivered
 * 
 * 2. "Next Week (On the Way)" (eligibleNextWeek):
 *    → ONLY shows products with status = 'shipped'
 *    → Product is in transit, creator should PREP hooks/scripts
 *    → Show ETA or shipped_at as "Expected by..."
 *    → Hint: "Prep hooks now – sample arriving soon"
 * 
 * 3. "Need Samples" (needsSamples):
 *    → Products the creator has saved/clicked but NO sample_request row
 *    → Should NOT be suggested for immediate promotion
 *    → Each card has "Request Sample" button
 * 
 * These rules ensure creators only promote products they physically have,
 * maintaining authenticity and preventing content about unseen products.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import {
  Calendar,
  Package,
  Truck,
  Video,
  Clock,
  Sparkles,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Gift,
  Play,
  Plus,
} from 'lucide-react';

// Types
export interface ProductWithSample {
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
  trackingNumber?: string | null;
}

export interface SavedProduct {
  id: string;
  productId: string;
  productName: string | null;
  productImage: string | null;
  brand: string | null;
  commissionRate: number | null;
}

interface WeeklyPlannerProps {
  eligibleThisWeek: ProductWithSample[];  // status = 'delivered' ONLY
  eligibleNextWeek: ProductWithSample[];  // status = 'shipped' ONLY
  needsSamples: SavedProduct[];           // saved products with no sample_request
  onRequestSample: (product: SavedProduct) => Promise<void>;
  onLogVideo?: (product: ProductWithSample) => void;
  loading?: boolean;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  eligibleThisWeek,
  eligibleNextWeek,
  needsSamples,
  onRequestSample,
  onLogVideo,
  loading = false,
}) => {
  const [requestingProductId, setRequestingProductId] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  /**
   * Format date for display
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  /**
   * Calculate expected arrival text
   */
  const getExpectedArrival = (product: ProductWithSample): string => {
    if (product.eta) {
      return `Expected by ${formatDate(product.eta)}`;
    }
    if (product.shippedAt) {
      // Estimate 5-7 days from shipping
      const shipped = new Date(product.shippedAt);
      const estimated = new Date(shipped.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `Expected ~${formatDate(estimated.toISOString())}`;
    }
    return 'Arriving soon';
  };

  /**
   * Handle sample request with loading state
   */
  const handleRequestSample = async (product: SavedProduct) => {
    setRequestingProductId(product.productId);
    try {
      await onRequestSample(product);
      setRequestedIds(prev => new Set(prev).add(product.productId));
    } catch (error) {
      console.error('Failed to request sample:', error);
    } finally {
      setRequestingProductId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-titan-surface border border-titan-border rounded-lg p-8">
        <div className="flex items-center justify-center gap-3 text-text-muted">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading your content plan...</span>
        </div>
      </div>
    );
  }

  // Empty state
  const isEmpty = eligibleThisWeek.length === 0 && eligibleNextWeek.length === 0 && needsSamples.length === 0;
  
  if (isEmpty) {
    return (
      <div className="bg-titan-surface border border-titan-border rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-teal/20 to-accent-fuchsia/20 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-accent-teal" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Your Content Planner
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Save products and request samples to build your weekly content plan.
            Only products you have in hand will appear in "This Week's Plan."
          </p>
          <a
            href="#/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal hover:bg-accent-teal/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Sparkles size={16} />
            Browse Products
          </a>
        </div>
      </div>
    );
  }

  return (
    <div id="weekly-planner" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-teal to-accent-fuchsia flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Weekly Content Planner</h2>
            <p className="text-xs text-text-muted">Plan content based on products you have in hand</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: THIS WEEK'S PLAN
          RULE: ONLY status = 'delivered' products appear here
          Creator has the product physically, can film NOW
          ═══════════════════════════════════════════════════════════════════════ */}
      {eligibleThisWeek.length > 0 && (
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-titan-border bg-gradient-to-r from-accent-teal/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-teal/20 flex items-center justify-center">
                <Video size={16} className="text-accent-teal" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  This Week's Plan
                  <span className="px-2 py-0.5 bg-accent-teal/20 text-accent-teal text-[10px] font-medium rounded">
                    {eligibleThisWeek.length} products
                  </span>
                </h3>
                <p className="text-xs text-text-muted">Products you have in hand – ready to film!</p>
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleThisWeek.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-lg border border-titan-border bg-titan-elevated hover:border-accent-teal/30 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Product Image */}
                  <div className="w-14 h-14 rounded-lg bg-titan-surface overflow-hidden flex-shrink-0">
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-medium text-text-muted bg-gradient-to-br from-titan-elevated to-titan-border">
                        {product.productName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-accent-teal transition-colors">
                      {product.productName}
                    </h4>
                    {product.brand && (
                      <p className="text-xs text-text-muted truncate">{product.brand}</p>
                    )}
                    {product.commissionRate && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-accent-teal font-medium">
                        {product.commissionRate}% commission
                      </span>
                    )}
                  </div>
                </div>

                {/* Status & Goal */}
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="flex items-center gap-1 text-accent-teal">
                    <CheckCircle size={12} />
                    Delivered
                  </span>
                  <span className="text-text-muted">•</span>
                  <span className="text-text-secondary">Goal: 3 videos</span>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onLogVideo?.(product)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-teal/10 hover:bg-accent-teal/20 text-accent-teal rounded-lg text-xs font-medium transition-colors"
                >
                  <Play size={14} />
                  Log Video
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: NEXT WEEK (ON THE WAY)
          RULE: ONLY status = 'shipped' products appear here
          Product is in transit, creator should PREP hooks/scripts
          ═══════════════════════════════════════════════════════════════════════ */}
      {eligibleNextWeek.length > 0 && (
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-titan-border bg-gradient-to-r from-accent-fuchsia/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-fuchsia/20 flex items-center justify-center">
                <Truck size={16} className="text-accent-fuchsia" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  Next Week (On the Way)
                  <span className="px-2 py-0.5 bg-accent-fuchsia/20 text-accent-fuchsia text-[10px] font-medium rounded">
                    {eligibleNextWeek.length} shipping
                  </span>
                </h3>
                <p className="text-xs text-text-muted">Prep your hooks now – samples arriving soon</p>
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibleNextWeek.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-lg border border-titan-border bg-titan-elevated hover:border-accent-fuchsia/30 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  {/* Product Image */}
                  <div className="w-14 h-14 rounded-lg bg-titan-surface overflow-hidden flex-shrink-0 relative">
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-full h-full object-cover opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-medium text-text-muted bg-gradient-to-br from-titan-elevated to-titan-border">
                        {product.productName.charAt(0)}
                      </div>
                    )}
                    {/* Shipping indicator */}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent-fuchsia rounded-full flex items-center justify-center">
                      <Truck size={10} className="text-white" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-accent-fuchsia transition-colors">
                      {product.productName}
                    </h4>
                    {product.brand && (
                      <p className="text-xs text-text-muted truncate">{product.brand}</p>
                    )}
                    {product.commissionRate && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-accent-fuchsia font-medium">
                        {product.commissionRate}% commission
                      </span>
                    )}
                  </div>
                </div>

                {/* ETA */}
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="flex items-center gap-1 text-accent-fuchsia">
                    <Clock size={12} />
                    {getExpectedArrival(product)}
                  </span>
                </div>

                {/* Hint */}
                <div className="flex items-center gap-2 p-2 bg-accent-fuchsia/5 rounded-lg text-xs text-text-muted">
                  <Sparkles size={12} className="text-accent-fuchsia flex-shrink-0" />
                  <span>Prep hooks now – sample arriving soon</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: NEED SAMPLES
          Products saved but NO sample_request row yet
          NOT for immediate promotion – need to request sample first
          ═══════════════════════════════════════════════════════════════════════ */}
      {needsSamples.length > 0 && (
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-titan-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-titan-elevated flex items-center justify-center">
                <Gift size={16} className="text-text-secondary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  Need Samples
                  <span className="px-2 py-0.5 bg-titan-elevated text-text-muted text-[10px] font-medium rounded">
                    {needsSamples.length} products
                  </span>
                </h3>
                <p className="text-xs text-text-muted">Request samples to add to your content plan</p>
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {needsSamples.map((product) => {
              const isRequesting = requestingProductId === product.productId;
              const isRequested = requestedIds.has(product.productId);

              return (
                <div
                  key={product.id}
                  className="p-3 rounded-lg border border-titan-border bg-titan-elevated hover:border-titan-border-light transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {/* Product Image */}
                    <div className="w-10 h-10 rounded-lg bg-titan-surface overflow-hidden flex-shrink-0">
                      {product.productImage ? (
                        <img
                          src={product.productImage}
                          alt={product.productName || 'Product'}
                          className="w-full h-full object-cover opacity-70"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-medium text-text-muted bg-gradient-to-br from-titan-elevated to-titan-border">
                          {(product.productName || 'P').charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium text-text-primary truncate">
                        {product.productName || 'Unknown Product'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted">
                        {product.brand && <span>{product.brand}</span>}
                        {product.commissionRate && (
                          <>
                            {product.brand && <span>•</span>}
                            <span className="text-accent-teal">{product.commissionRate}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Request Button */}
                  <button
                    onClick={() => handleRequestSample(product)}
                    disabled={isRequesting || isRequested}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isRequested
                        ? 'bg-accent-teal/10 text-accent-teal cursor-default'
                        : 'bg-text-primary hover:bg-white text-titan-bg disabled:opacity-50'
                    }`}
                  >
                    {isRequesting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : isRequested ? (
                      <>
                        <CheckCircle size={14} />
                        Requested
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        Request Sample
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-titan-surface/50 border border-titan-border rounded-lg">
        <AlertCircle size={16} className="text-text-muted flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted">
          <strong className="text-text-secondary">Content authenticity:</strong> Only products with delivered samples
          appear in "This Week's Plan." This ensures you only promote products you've actually tried.
          Products in transit will move to "This Week" once delivered.
        </p>
      </div>
    </div>
  );
};

export default WeeklyPlanner;
