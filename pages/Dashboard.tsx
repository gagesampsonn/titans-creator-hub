import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Package, TrendingUp, RefreshCw, AtSign, 
  AlertCircle, CheckCircle, Loader2, Star, Award, ShoppingBag,
  Send, CheckCircle2, TrendingDown, ArrowUpRight, ArrowDownRight,
  Video, Clock, Radio, Info, Trophy, PlayCircle, Copy, Tag, Sparkles,
  Download, Film
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import videoCounts from '../data/video-counts.json';

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

// Date formatting helpers to avoid timezone issues
const formatDateShort = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${day}`;
};

const formatDateLong = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${day}, ${year}`;
};

const formatDateFull = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[month - 1]} ${day}`;
};

const formatDateFullYear = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[month - 1]} ${day}, ${year}`;
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
    // Top niche
    topNiche: string;
    topNicheGmv: number;
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
  product_id: string | null;
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

// Export data to CSV
const exportToCSV = (
  handle: string,
  summary: MetricsData['summary'],
  period: MetricsData['period'],
  products: ProductMetric[]
) => {
  const dateRange = period?.dateStart && period?.dateEnd 
    ? `${period.dateStart}_to_${period.dateEnd}`
    : 'performance_data';
  
  // Build CSV content
  let csv = '';
  
  // Header info
  csv += `Titans Agency Performance Report\n`;
  csv += `Creator: @${handle}\n`;
  csv += `Period: ${period?.dateStart || 'N/A'} to ${period?.dateEnd || 'N/A'}\n`;
  csv += `Exported: ${new Date().toLocaleDateString()}\n\n`;
  
  // Summary section
  csv += `PERFORMANCE SUMMARY\n`;
  csv += `Metric,Value\n`;
  csv += `Total GMV,$${summary.totalGmv.toFixed(2)}\n`;
  csv += `Items Sold,${summary.totalItems}\n`;
  csv += `Orders,${summary.totalOrders}\n`;
  csv += `Top Niche,${summary.topNiche || 'N/A'}\n`;
  csv += `GMV Change %,${summary.gmvChange?.toFixed(1) || 0}%\n`;
  csv += `Items Change %,${summary.itemsChange?.toFixed(1) || 0}%\n\n`;
  
  // Products section
  if (products && products.length > 0) {
    csv += `PRODUCT BREAKDOWN\n`;
    csv += `Product Name,Category,GMV,Items Sold,Videos Posted\n`;
    products.forEach(p => {
      // Escape product names that might contain commas
      const safeName = `"${p.product_name.replace(/"/g, '""')}"`;
      const videoCount = (videoCounts as Record<string, number>)[`${handle}:::${p.product_name}`] || 0;
      csv += `${safeName},${p.product_category || 'Uncategorized'},$${p.gmv.toFixed(2)},${p.items_sold},${videoCount}\n`;
    });
  }
  
  // Create and download the file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `titans_${handle}_${dateRange}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface TopVideoData {
  id: string;
  handle: string;
  videoId: string;
  videoName: string;
  revenue: number;
  comparePct: number;
  contributionPct: number;
  rank: number;
}

interface TopVideosResponse {
  hasTopVideos: boolean;
  dateRange?: { start: string; end: string };
  userVideos: TopVideoData[];
  allTopVideos: TopVideoData[];
}

const Dashboard = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricsData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsData | null>(null);
  const [livestreams, setLivestreams] = useState<LivestreamsResponse | null>(null);
  const [topVideos, setTopVideos] = useState<TopVideosResponse | null>(null);
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
  
  // Copy product ID state
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);
  
  // Copy product ID handler
  const copyProductId = async (productId: string) => {
    try {
      await navigator.clipboard.writeText(productId);
      setCopiedProductId(productId);
      setTimeout(() => setCopiedProductId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Load metrics
  const loadMetrics = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch metrics, top products, livestreams, and top videos in parallel
      const [metricsResponse, productsResponse, livestreamsResponse, topVideosResponse] = await Promise.all([
        fetch('/api/profile/metrics', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/profile/top-products', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/profile/livestreams', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        }),
        fetch('/api/profile/top-videos', {
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

      if (topVideosResponse.ok) {
        const topVideosResult = await topVideosResponse.json();
        setTopVideos(topVideosResult);
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
    <div className="min-h-screen bg-titan-bg py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Your Dashboard</h1>
              <p className="text-sm text-text-muted">@{data.handle}</p>
            </div>
            <button
              onClick={() => exportToCSV(
                data.handle || 'creator',
                data.summary,
                data.period,
                topProducts?.products || []
              )}
              className="shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-accent-teal to-accent-fuchsia text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              title="Download your performance data to share with brands"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
          {/* Date range - separate row on mobile */}
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-titan-surface border border-titan-border rounded-full text-xs text-text-muted">
            <span>
              {data.period?.dateStart && data.period?.dateEnd 
                ? `${formatDateShort(data.period.dateStart)} – ${formatDateLong(data.period.dateEnd)}`
                : 'Dec 1, 2025 – Jan 6, 2026'}
            </span>
          </div>
        </div>

        {/* Period Summary Banner */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-accent-teal/10 border border-accent-teal/20 rounded-lg">
          <p className="text-xs sm:text-sm text-accent-teal">
            📊 <strong>
              {data.period?.dateStart && data.period?.dateEnd 
                ? `${formatDateShort(data.period.dateStart)} – ${formatDateLong(data.period.dateEnd)}`
                : 'Dec 1 – Jan 6, 2026'}
            </strong>
          </p>
          <p className="text-[10px] sm:text-xs text-text-muted mt-1 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Your performance since linking with Titans
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-titan-surface border border-titan-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <DollarSign className="w-4 sm:w-5 h-4 sm:h-5 text-accent-teal" />
                <span className="text-[10px] sm:text-xs text-text-muted">GMV</span>
              </div>
              <ChangeIndicator value={data.summary.gmvChange || 0} />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-text-primary">
              ${data.summary.totalGmv.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <Star className="w-4 sm:w-5 h-4 sm:h-5 text-accent-fuchsia" />
                <span className="text-[10px] sm:text-xs text-text-muted">Top Niche</span>
              </div>
            </div>
            <p className="text-sm sm:text-lg font-bold text-text-primary truncate" title={data.summary.topNiche || 'N/A'}>
              {data.summary.topNiche || 'N/A'}
            </p>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">
              ${(data.summary.topNicheGmv || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <Package className="w-4 sm:w-5 h-4 sm:h-5 text-accent-teal" />
                <span className="text-[10px] sm:text-xs text-text-muted">Items</span>
              </div>
              <ChangeIndicator value={data.summary.itemsChange || 0} />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-text-primary">
              {data.summary.totalItems.toLocaleString()}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-3 sm:p-5">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <ShoppingBag className="w-4 sm:w-5 h-4 sm:h-5 text-accent-fuchsia" />
                <span className="text-[10px] sm:text-xs text-text-muted">Orders</span>
              </div>
              <ChangeIndicator value={data.summary.ordersChange || 0} />
            </div>
            <p className="text-lg sm:text-2xl font-bold text-text-primary">
              {(data.summary.totalOrders || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Top Niche Banner */}
        {data.summary.topNiche && data.summary.topNiche !== 'Uncategorized' && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-accent-fuchsia/10 to-accent-teal/10 border border-accent-fuchsia/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-gradient-to-br from-accent-fuchsia to-accent-teal rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-text-muted">Top Niche</p>
                <p className="text-sm sm:text-lg font-bold text-text-primary truncate">{data.summary.topNiche}</p>
                <p className="text-[10px] sm:text-xs text-text-muted">
                  ${data.summary.topNicheGmv.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} GMV
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 5 Products */}
        {topProducts?.hasProducts && topProducts.products.length > 0 && (
          <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden mb-6 sm:mb-8">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-titan-border">
              <div className="flex items-center gap-2">
                <Award className="w-4 sm:w-5 h-4 sm:h-5 text-accent-teal" />
                <h2 className="font-semibold text-sm sm:text-base text-text-primary">Top 5 Products</h2>
              </div>
              <p className="text-[10px] sm:text-xs text-text-muted mt-1">
                Best performers • Tap to copy ID
              </p>
            </div>
            <div className="divide-y divide-titan-border">
              {topProducts.products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-titan-elevated/30 transition-colors group relative"
                >
                  {/* Mobile: Stack layout / Desktop: Row layout */}
                  <div className="flex items-start gap-3">
                    {/* Rank Badge */}
                    <div className={`
                      w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' : ''}
                      ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' : ''}
                      ${index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : ''}
                      ${index >= 3 ? 'bg-titan-bg border border-titan-border text-text-muted' : ''}
                    `}>
                      {index + 1}
                    </div>
                    
                    {/* Product Info + Stats Container */}
                    <div className="flex-1 min-w-0">
                      {/* Product Name - Full width, better truncation */}
                      <p className="font-medium text-text-primary text-sm sm:text-base line-clamp-2 sm:truncate leading-tight">
                        {product.product_name}
                      </p>
                      
                      {/* Stats Row - Mobile optimized */}
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-accent-teal font-semibold">
                            ${Number(product.gmv).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-text-muted ml-1 hidden sm:inline">GMV</span>
                        </div>
                        <div>
                          <span className="text-text-primary font-medium">{product.items_sold}</span>
                          <span className="text-text-muted ml-1">Items</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Film className="w-3 h-3 text-accent-fuchsia" />
                          <span className="text-accent-fuchsia font-semibold">
                            {(videoCounts as Record<string, number>)[`${data.handle}:::${product.product_name}`] || 0}
                          </span>
                          <span className="text-text-muted hidden sm:inline">Videos</span>
                        </div>
                      </div>
                      
                      {/* Category + Copy Button Row */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-xs rounded-full">
                          <Tag className="w-3 h-3" />
                          {product.product_category || 'Uncategorized'}
                        </span>
                        {product.product_id && (
                          <button
                            onClick={() => copyProductId(product.product_id!)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-titan-bg hover:bg-titan-elevated text-text-muted hover:text-text-primary text-xs rounded-full transition-colors border border-titan-border"
                            title="Copy Product ID"
                          >
                            {copiedProductId === product.product_id ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                <span className="text-green-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy ID</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Help text for copying product IDs */}
            <div className="px-3 sm:px-6 py-2 sm:py-3 bg-titan-bg/50 border-t border-titan-border">
              <p className="text-[10px] sm:text-xs text-text-muted flex items-center gap-1.5 sm:gap-2">
                <Info className="w-3 h-3 shrink-0" />
                <span>Share product IDs in Discord for higher commission rates!</span>
              </p>
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
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden mb-6 sm:mb-8">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-titan-border">
            <div className="flex items-center gap-2">
              <Radio className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
              <h2 className="font-semibold text-sm sm:text-base text-text-primary">Top Livestreams</h2>
            </div>
            <p className="text-[10px] sm:text-xs text-text-muted mt-1">
              Best live sessions
              {livestreams?.dateRange && (
                <span className="hidden sm:inline"> • {new Date(livestreams.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(livestreams.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
            </p>
          </div>

          {/* Show content if has livestreams, otherwise show empty state */}
          {livestreams?.hasLivestreams && livestreams.livestreams.length > 0 ? (
            <>
              {/* Livestream Summary Stats */}
              {livestreams.summary && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-titan-bg/50 border-b border-titan-border">
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-text-primary">{livestreams.summary.totalStreams}</p>
                    <p className="text-[10px] sm:text-xs text-text-muted">Streams</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-red-400">${livestreams.summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] sm:text-xs text-text-muted">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-text-primary">{formatDuration(livestreams.summary.avgDuration)}</p>
                    <p className="text-[10px] sm:text-xs text-text-muted">Avg Time</p>
                  </div>
                </div>
              )}

              <div className="divide-y divide-titan-border">
                {livestreams.livestreams.map((stream, index) => (
                  <div 
                    key={stream.id} 
                    className="px-3 sm:px-6 py-3 sm:py-4 flex items-start gap-3 hover:bg-titan-elevated/30 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div className={`
                      w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm
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
                        <Video className="w-4 h-4 shrink-0 text-red-400" />
                        <p className="font-medium text-text-primary text-sm sm:text-base line-clamp-2 sm:truncate leading-tight">
                          {stream.name || 'Untitled Stream'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 text-text-muted">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(stream.durationSeconds)}</span>
                        </div>
                        <div className="text-red-400 font-semibold">
                          ${stream.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      </div>
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

        {/* Top Ranked Videos in Titans Agency */}
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-titan-border">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-text-primary">Top Ranked Videos in Titans Agency</h2>
              {/* Info tooltip */}
              <div className="relative group">
                <Info className="w-4 h-4 text-text-muted cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-titan-elevated border border-titan-border rounded-lg shadow-xl text-xs text-text-muted z-50">
                  <p className="font-medium text-text-primary mb-1">How Rankings Work</p>
                  <p>As a linked Titans Agency creator, your videos compete in our agency-wide Top 20 ranking. Videos are ranked by revenue generated during this period.</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Agency-wide video rankings by revenue
              {topVideos?.dateRange && (
                <span> • {new Date(topVideos.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(topVideos.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
            </p>
          </div>

          {topVideos?.hasTopVideos && topVideos.userVideos.length > 0 ? (
            <>
              {/* User's videos in top 20 */}
              <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-titan-border">
                <p className="text-sm font-medium text-yellow-400 mb-2">
                  🎉 You have {topVideos.userVideos.length} video{topVideos.userVideos.length > 1 ? 's' : ''} in the Top 20!
                </p>
              </div>
              <div className="divide-y divide-titan-border">
                {topVideos.userVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="px-6 py-4 flex items-center gap-4 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                  >
                    {/* Rank Badge */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${video.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black' : ''}
                      ${video.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' : ''}
                      ${video.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' : ''}
                      ${video.rank > 3 ? 'bg-titan-bg border-2 border-yellow-500/50 text-yellow-400' : ''}
                    `}>
                      #{video.rank}
                    </div>
                    
                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <p className="font-medium text-text-primary truncate">
                          {video.videoName || 'Untitled Video'}
                        </p>
                      </div>
                      <p className="text-xs text-text-muted mt-1 truncate">
                        {video.contributionPct.toFixed(2)}% of agency revenue
                      </p>
                    </div>
                    
                    {/* Revenue & Change */}
                    <div className="text-right">
                      <p className="text-yellow-400 font-bold">
                        ${video.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <ChangeIndicator value={video.comparePct} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Empty state for creators without videos in top 20 */
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-titan-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-text-muted/50" />
              </div>
              <h3 className="font-medium text-text-primary mb-2">Not in the Top 20 Yet</h3>
              <p className="text-sm text-text-muted max-w-sm mx-auto">
                Keep creating great content! When your videos rank in the agency's Top 20 by revenue, they'll appear here.
              </p>
            </div>
          )}
        </div>

        {/* Performance Summary - Shows period totals */}
        {data.hasData && (
          <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-titan-border">
              <h2 className="font-semibold text-text-primary">Performance Summary</h2>
              <p className="text-xs text-text-muted mt-1">
                Aggregated data for {data.period?.dateStart && data.period?.dateEnd 
                  ? `${formatDateShort(data.period.dateStart)} – ${formatDateLong(data.period.dateEnd)}`
                  : 'Dec 1, 2025 – Jan 6, 2026'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-titan-bg/50 text-xs text-text-muted uppercase">
                  <tr>
                    <th className="px-6 py-3 text-right">GMV</th>
                    <th className="px-6 py-3 text-right">Items</th>
                    <th className="px-6 py-3 text-right">Orders</th>
                    <th className="px-6 py-3 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-titan-border">
                  <tr className="hover:bg-titan-elevated/30">
                    <td className="px-6 py-4 text-right text-accent-teal font-medium">
                      ${data.summary.totalGmv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-text-primary">
                      {data.summary.totalItems}
                    </td>
                    <td className="px-6 py-4 text-right text-accent-fuchsia font-medium">
                      {(data.summary.totalOrders || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-text-muted">
                      {data.summary.avgCtr.toFixed(2)}%
                    </td>
                  </tr>
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
