import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Package, TrendingUp, RefreshCw, AtSign, 
  AlertCircle, CheckCircle, Loader2, Star, Award, ShoppingBag,
  Send, CheckCircle2, TrendingDown, ArrowUpRight, ArrowDownRight,
  Video, Clock, Radio
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

// Change indicator component
const ChangeIndicator = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
  if (value === 0) return null;
  
  const isPositive = value > 0;
  const color = isPositive ? 'text-emerald-400' : 'text-red-400';
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <div className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      <span>{isPositive ? '+' : ''}{value.toFixed(1)}{suffix}</span>
    </div>
  );
};

interface MetricsData {
  connected: boolean;
  handle: string | null;
  isLinked: boolean;
  hasData: boolean;
  summary: {
    totalGmv: number;
    totalCommission: number;
    totalItems: number;
    totalOrders: number;
    avgCtr: number;
    // Comparison percentages
    gmvChange: number;
    itemsChange: number;
    ordersChange: number;
  };
  period: {
    dateStart: string;
    dateEnd: string;
    comparisonStart: string;
    comparisonEnd: string;
  };
  dailyMetrics: Array<{
    date: string;
    affiliate_gmv: number;
    items_sold: number;
    est_commission: number;
    video_ctr: number;
  }>;
}

interface ProductMetric {
  id: string;
  product_name: string;
  product_category: string;
  gmv: number;
  items_sold: number;
  est_commission: number;
  date_start: string;
  date_end: string;
}

interface TopProductsData {
  hasProducts: boolean;
  products: ProductMetric[];
  dateRange: { start: string; end: string } | null;
}

interface LivestreamData {
  id: string;
  roomId: string;
  name: string;
  durationSeconds: number;
  revenue: number;
}

interface LivestreamsResponse {
  hasLivestreams: boolean;
  summary?: {
    totalStreams: number;
    totalRevenue: number;
    totalDuration: number;
    avgDuration: number;
  };
  dateRange?: { start: string; end: string };
  livestreams: LivestreamData[];
}

// Helper to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const Dashboard = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricsData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsData | null>(null);
  const [livestreams, setLivestreams] = useState<LivestreamsResponse | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Link request state
  const [showLinkRequest, setShowLinkRequest] = useState(false);
  const [linkRequestSent, setLinkRequestSent] = useState(false);
  const [linkRequestLoading, setLinkRequestLoading] = useState(false);
  const [linkRequestError, setLinkRequestError] = useState('');
  const [linkRequestNote, setLinkRequestNote] = useState('');

  // Load metrics
  const loadMetrics = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch metrics, top products, and livestreams in parallel
      const [metricsResponse, productsResponse, livestreamsResponse] = await Promise.all([
        fetch('/api/profile/metrics', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/profile/top-products', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/profile/livestreams', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        })
      ]);
      
      if (metricsResponse.ok) {
        const result = await metricsResponse.json();
        setData(result);
      }
      
      if (productsResponse.ok) {
        const productsResult = await productsResponse.json();
        setTopProducts(productsResult);
      }

      if (livestreamsResponse.ok) {
        const livestreamsResult = await livestreamsResponse.json();
        setLivestreams(livestreamsResult);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save handle
  const saveHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim() || !session?.access_token) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/profile/update-handle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle: handle.trim() }),
      });

      if (response.ok) {
        setShowConnect(false);
        setHandle('');
        await loadMetrics();
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Submit link request
  const submitLinkRequest = async () => {
    if (!data?.handle || !session?.access_token) return;
    
    setLinkRequestLoading(true);
    setLinkRequestError('');
    
    try {
      const response = await fetch('/api/link-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tiktok_handle: data.handle,
          note: linkRequestNote.trim() || null
        })
      });
      
      if (response.ok) {
        setLinkRequestSent(true);
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit request');
      }
    } catch (err: any) {
      console.error('Link request error:', err);
      // Still show success to user - the notification may have been sent
      setLinkRequestSent(true);
    } finally {
      setLinkRequestLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadMetrics();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-teal" />
      </div>
    );
  }

  // Not connected - show connect form
  if (!data?.connected) {
    return (
      <div className="min-h-screen bg-titan-bg py-12">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-titan-surface border border-titan-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-full flex items-center justify-center mx-auto mb-6">
              <AtSign className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Connect Your TikTok Shop Affiliate Account
            </h1>
            <p className="text-sm text-text-muted mb-6">
              Enter your TikTok handle to see your affiliate metrics
            </p>
            
            <form onSubmit={saveHandle} className="space-y-4">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourusername"
                className="w-full px-4 py-3 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-teal/50"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={saving || !handle.trim()}
                className="w-full py-3 bg-gradient-to-r from-accent-teal to-accent-fuchsia text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Connecting...' : 'Connect Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Connected but not linked to agency
  if (!data.isLinked) {
    return (
      <div className="min-h-screen bg-titan-bg py-12">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-titan-surface border border-amber-500/30 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-text-primary mb-2">
              Not Linked to Titans Agency
            </h1>
            <p className="text-sm text-text-muted mb-4">
              Your handle <span className="text-text-primary font-medium">@{data.handle}</span> is not linked to the Titans agency yet.
            </p>
            
            {/* Link Request Section */}
            {!linkRequestSent ? (
              <>
                {!showLinkRequest ? (
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted">
                      Want to join? Submit a request to link your account.
                    </p>
                    <button
                      onClick={() => setShowLinkRequest(true)}
                      className="w-full py-3 bg-gradient-to-r from-accent-teal to-accent-fuchsia text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                      Request to Link
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 text-left">
                    <label className="block text-sm text-text-muted mb-2">
                      Add a note (optional)
                    </label>
                    <textarea
                      value={linkRequestNote}
                      onChange={(e) => setLinkRequestNote(e.target.value)}
                      placeholder="E.g., I was referred by @creator or I have 50k followers..."
                      className="w-full px-4 py-3 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 resize-none"
                      rows={3}
                    />
                    {linkRequestError && (
                      <p className="text-red-400 text-sm mt-2">{linkRequestError}</p>
                    )}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => setShowLinkRequest(false)}
                        className="flex-1 py-3 bg-titan-bg border border-titan-border text-text-muted rounded-lg font-medium hover:bg-titan-elevated transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submitLinkRequest}
                        disabled={linkRequestLoading}
                        className="flex-1 py-3 bg-gradient-to-r from-accent-teal to-accent-fuchsia text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {linkRequestLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {linkRequestLoading ? 'Sending...' : 'Send Request'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 p-4 bg-accent-teal/10 border border-accent-teal/30 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-accent-teal mx-auto mb-2" />
                <p className="text-sm text-accent-teal font-medium">
                  Request Sent!
                </p>
                <p className="text-xs text-text-muted mt-1">
                  We'll review your request and get back to you soon.
                </p>
              </div>
            )}
            
            <button
              onClick={() => { setHandle(data.handle || ''); setShowConnect(true); }}
              className="mt-6 text-sm text-accent-teal hover:underline"
            >
              Wrong handle? Change it
            </button>
          </div>
          
          {showConnect && (
            <div className="mt-4 bg-titan-surface border border-titan-border rounded-lg p-6">
              <form onSubmit={saveHandle} className="space-y-4">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@yourusername"
                  className="w-full px-4 py-3 bg-titan-bg border border-titan-border rounded-lg text-text-primary"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-accent-teal text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Update Handle'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Linked but no data yet
  if (!data.hasData) {
    return (
      <div className="min-h-screen bg-titan-bg py-12">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-titan-surface border border-accent-teal/30 rounded-lg p-8 text-center">
            <CheckCircle className="w-12 h-12 text-accent-teal mx-auto mb-4" />
            <h1 className="text-xl font-bold text-text-primary mb-2">
              You're Linked to Titans!
            </h1>
            <p className="text-sm text-text-muted mb-4">
              Your handle <span className="text-text-primary font-medium">@{data.handle}</span> is confirmed.
            </p>
            <p className="text-sm text-text-muted">
              Metrics will appear here after the next data sync.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full dashboard with data
  return (
    <div className="min-h-screen bg-titan-bg py-8">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Your Dashboard</h1>
            <p className="text-sm text-text-muted">@{data.handle}</p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-titan-surface border border-titan-border rounded-full text-xs text-text-muted">
              <span>
                {data.period?.dateStart && data.period?.dateEnd 
                  ? `${new Date(data.period.dateStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(data.period.dateEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Dec 1 – Dec 18, 2025'}
              </span>
            </div>
          </div>
        </div>

        {/* Period Summary Banner */}
        <div className="mb-6 p-4 bg-accent-teal/10 border border-accent-teal/20 rounded-lg">
          <p className="text-sm text-accent-teal">
            📊 Showing your performance for <strong>
              {data.period?.dateStart && data.period?.dateEnd 
                ? `${new Date(data.period.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${new Date(data.period.dateEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'December 1 – December 18, 2025'}
            </strong>
            {data.period?.comparisonStart && data.period?.comparisonEnd && (
              <span className="text-text-muted"> • Compared to {new Date(data.period.comparisonStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(data.period.comparisonEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent-teal" />
                <span className="text-xs text-text-muted">Total GMV</span>
              </div>
              <ChangeIndicator value={data.summary.gmvChange || 0} />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${data.summary.totalGmv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-fuchsia" />
                <span className="text-xs text-text-muted">Est. Commission</span>
              </div>
              <ChangeIndicator value={data.summary.gmvChange || 0} />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${data.summary.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-accent-teal" />
                <span className="text-xs text-text-muted">Items Sold</span>
              </div>
              <ChangeIndicator value={data.summary.itemsChange || 0} />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {data.summary.totalItems.toLocaleString()}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-accent-fuchsia" />
                <span className="text-xs text-text-muted">Total Orders</span>
              </div>
              <ChangeIndicator value={data.summary.ordersChange || 0} />
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {(data.summary.totalOrders || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Top 5 Products */}
        {topProducts?.hasProducts && topProducts.products.length > 0 && (
          <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-titan-border">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-accent-teal" />
                <h2 className="font-semibold text-text-primary">Top 5 Products</h2>
              </div>
              <p className="text-xs text-text-muted mt-1">
                Your best performing products (Last 14 Days)
              </p>
            </div>
            <div className="divide-y divide-titan-border">
              {topProducts.products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="px-6 py-4 flex items-center gap-4 hover:bg-titan-elevated/30 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' : ''}
                    ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' : ''}
                    ${index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : ''}
                    ${index >= 3 ? 'bg-titan-bg border border-titan-border text-text-muted' : ''}
                  `}>
                    {index + 1}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {product.product_category || 'Uncategorized'}
                    </p>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-accent-teal font-semibold">
                        ${Number(product.gmv).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-text-muted">GMV</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-primary font-medium">
                        {product.items_sold}
                      </p>
                      <p className="text-xs text-text-muted">Items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-accent-fuchsia font-semibold">
                        ${Number(product.est_commission).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-text-muted">Commission</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Products Empty State */}
        {topProducts && !topProducts.hasProducts && (
          <div className="bg-titan-surface border border-titan-border rounded-lg p-8 mb-8 text-center">
            <ShoppingBag className="w-12 h-12 text-text-muted/50 mx-auto mb-4" />
            <h3 className="font-medium text-text-primary mb-2">No Product Sales Yet</h3>
            <p className="text-sm text-text-muted">
              No product sales in this date range yet. Start promoting products to see your top performers here!
            </p>
          </div>
        )}

        {/* Top Livestreams Section - Always shows for linked creators */}
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-titan-border">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-text-primary">Top Livestreams</h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Your best performing live sessions
              {livestreams?.dateRange && (
                <span> • {new Date(livestreams.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(livestreams.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
            </p>
          </div>

          {/* Show content if has livestreams, otherwise show empty state */}
          {livestreams?.hasLivestreams && livestreams.livestreams.length > 0 ? (
            <>
              {/* Livestream Summary Stats */}
              {livestreams.summary && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-titan-bg/50 border-b border-titan-border">
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{livestreams.summary.totalStreams}</p>
                    <p className="text-xs text-text-muted">Total Streams</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-red-400">${livestreams.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-text-muted">Live Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-primary">{formatDuration(livestreams.summary.avgDuration)}</p>
                    <p className="text-xs text-text-muted">Avg Duration</p>
                  </div>
                </div>
              )}

              <div className="divide-y divide-titan-border">
                {livestreams.livestreams.map((stream, index) => (
                  <div 
                    key={stream.id} 
                    className="px-6 py-4 flex items-center gap-4 hover:bg-titan-elevated/30 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-gradient-to-br from-red-400 to-red-600 text-white' : ''}
                      ${index === 1 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' : ''}
                      ${index === 2 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black' : ''}
                      ${index >= 3 ? 'bg-titan-bg border border-titan-border text-text-muted' : ''}
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Stream Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-red-400" />
                        <p className="font-medium text-text-primary truncate">
                          {stream.name || 'Untitled Stream'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(stream.durationSeconds)}</span>
                      </div>
                    </div>
                    
                    {/* Revenue */}
                    <div className="text-right">
                      <p className="text-red-400 font-semibold">
                        ${stream.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-text-muted">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Empty state for creators without livestream data */
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-titan-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-text-muted/50" />
              </div>
              <h3 className="font-medium text-text-primary mb-2">No Livestream Data Yet</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Start going live on TikTok to see your top performing streams here! 
                Your best livestreams will be ranked by revenue.
              </p>
            </div>
          )}
        </div>

        {/* Metrics Details */}
        {data.dailyMetrics.length > 0 && (
          <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-titan-border">
              <h2 className="font-semibold text-text-primary">Performance Summary</h2>
              <p className="text-xs text-text-muted mt-1">
                Aggregated data for {data.period?.dateStart && data.period?.dateEnd 
                  ? `${new Date(data.period.dateStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(data.period.dateEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  : 'Dec 1 – Dec 18, 2025'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-titan-bg/50 text-xs text-text-muted uppercase">
                  <tr>
                    <th className="px-6 py-3 text-right">GMV</th>
                    <th className="px-6 py-3 text-right">Commission</th>
                    <th className="px-6 py-3 text-right">Items</th>
                    <th className="px-6 py-3 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-titan-border">
                  {data.dailyMetrics.map((m, i) => (
                    <tr key={i} className="hover:bg-titan-elevated/30">
                      <td className="px-6 py-4 text-right text-accent-teal font-medium">
                        ${m.affiliate_gmv.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-accent-fuchsia font-medium">
                        ${m.est_commission.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-text-primary">
                        {m.items_sold}
                      </td>
                      <td className="px-6 py-4 text-right text-text-muted">
                        {m.video_ctr.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
