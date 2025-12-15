import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, ChevronDown, Calendar, Download, MoreHorizontal, 
  Link2, CheckCircle, Loader2, TrendingUp, TrendingDown,
  Gift, RefreshCw, Zap, Star, Copy, Check, DollarSign, 
  ShoppingBag, Package, Sparkles, ArrowRight, Crown, AtSign,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { isAdminEmail } from '../lib/isAdmin';
import TikTokHandleModal from '../components/TikTokHandleModal';
import { Link } from 'react-router-dom';

// Metrics types
interface MetricsSummary {
  gmv30Day: number;
  commission30Day: number;
  itemsSold30Day: number;
  orders30Day: number;
  avgVideoCtr: number;
  avgVideoRpm: number;
}

interface DailyMetric {
  date: string;
  affiliate_gmv: number;
  items_sold: number;
  est_commission: number;
  video_ctr: number;
  video_rpm: number;
}

interface MetricsResponse {
  connected: boolean;
  handle: string | null;
  displayName?: string;
  isLinkedToAgency: boolean;
  hasData: boolean;
  summary: MetricsSummary | null;
  dailyMetrics: DailyMetric[];
  message?: string;
}

const Dashboard = () => {
  const { user, session } = useAuth();
  const [timeRange, setTimeRange] = useState('Last 30 days');
  
  // Connection state
  const [loading, setLoading] = useState(true);
  const [showHandleModal, setShowHandleModal] = useState(false);
  
  // Metrics state
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Check if user is admin
  const isAdmin = isAdminEmail(user?.email);

  /**
   * Load user's metrics from API
   */
  const loadMetrics = async () => {
    if (!user || !session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/metrics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetricsData(data);
      } else {
        console.error('Failed to load metrics');
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save TikTok handle
   */
  const handleSaveHandle = async (data: { handle: string; displayName?: string }) => {
    // Try context session first, then fallback to getSession()
    let accessToken = session?.access_token;
    
    if (!accessToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      accessToken = sessionData?.session?.access_token;
    }
    
    if (!accessToken) {
      throw new Error('Please refresh the page and try again');
    }

    const response = await fetch('/api/profile/update-handle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        handle: data.handle,
        displayName: data.displayName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save');
    }

    // Reload metrics after saving
    await loadMetrics();
  };

  /**
   * Refresh metrics
   */
  const handleRefresh = async () => {
    setSyncing(true);
    await loadMetrics();
    setSyncing(false);
  };

  // Load data on mount and when session changes
  useEffect(() => {
    if (session) {
      loadMetrics();
    }
  }, [user, session]);

  // Components
  const Trend = ({ val, positive }: { val: string; positive: boolean }) => (
    <div className={`flex items-center gap-1 text-xs ${positive ? 'text-accent-teal' : 'text-accent-fuchsia'}`}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>{val}</span>
    </div>
  );

  // Chart data
  const chartData = metricsData?.dailyMetrics && metricsData.dailyMetrics.length > 0
    ? metricsData.dailyMetrics.slice(0, 16).reverse().map(d => ({
        date: d.date.slice(5),
        gmv: d.affiliate_gmv,
        comm: d.est_commission,
      }))
    : Array.from({ length: 16 }, (_, i) => ({
        date: `12-${String(i + 1).padStart(2, '0')}`,
        gmv: 0,
        comm: 0,
      }));

  const maxChartValue = Math.max(...chartData.map(d => d.gmv), 1000);
  const isConnected = metricsData?.connected && metricsData?.handle;
  const isLinkedToAgency = metricsData?.isLinkedToAgency ?? false;
  const hasData = metricsData?.hasData;

  return (
    <div className="min-h-screen bg-titan-bg pb-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight mb-2">
                Your Creator Dashboard
              </h1>
              <p className="text-sm text-text-muted">
                Track your earnings, see your performance, and grow your TikTok Shop business
              </p>
            </div>
            
            {/* Admin Links */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/linked-creators"
                  className="flex items-center gap-2 px-3 py-2 bg-titan-surface border border-titan-border text-text-secondary rounded-lg text-sm font-medium hover:text-text-primary hover:border-accent-teal/30 transition-colors"
                >
                  Manage Creators
                </Link>
                <Link
                  to="/admin/metrics-import"
                  className="flex items-center gap-2 px-3 py-2 bg-accent-fuchsia/10 border border-accent-fuchsia/30 text-accent-fuchsia rounded-lg text-sm font-medium hover:bg-accent-fuchsia/20 transition-colors"
                >
                  <Download size={16} />
                  Import Metrics
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Connect TikTok CTA - Not Connected */}
        {!loading && !isConnected && (
          <div className="mb-8 p-6 rounded-lg border-2 border-dashed border-titan-border bg-titan-surface">
            <div className="text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-teal to-accent-fuchsia flex items-center justify-center mx-auto mb-4">
                <AtSign size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Connect Your TikTok Shop Affiliate Account
              </h2>
              <p className="text-sm text-text-muted mb-4">
                Enter your TikTok handle to see your affiliate metrics. If you're linked to Titans agency, 
                your data will appear after the next daily import.
              </p>
              <button
                onClick={() => setShowHandleModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-teal to-accent-fuchsia hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all"
              >
                <Sparkles size={16} />
                Connect Your Account
              </button>
            </div>
          </div>
        )}

        {/* Connected Status Bar */}
        {isConnected && (
          <div className={`mb-6 p-3 rounded-lg flex items-center justify-between flex-wrap gap-3 ${
            isLinkedToAgency 
              ? 'bg-accent-teal/5 border border-accent-teal/20' 
              : 'bg-titan-surface border border-titan-border'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isLinkedToAgency ? 'bg-accent-teal/10' : 'bg-amber-500/10'
              }`}>
                {isLinkedToAgency ? (
                  <CheckCircle size={16} className="text-accent-teal" />
                ) : (
                  <AlertCircle size={16} className="text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  @{metricsData?.handle}
                  {metricsData?.displayName && ` (${metricsData.displayName})`}
                </p>
                <p className="text-xs text-text-muted">
                  {isLinkedToAgency 
                    ? (hasData ? 'Showing last 30 days of data' : 'Linked — waiting for metrics import')
                    : 'Not linked to agency'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => setShowHandleModal(true)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Change Handle
              </button>
            </div>
          </div>
        )}

        {/* Not Linked to Agency Message */}
        {isConnected && !isLinkedToAgency && (
          <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  Your Account is Not Linked to the Agency Yet
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Your TikTok handle <span className="font-medium text-text-primary">@{metricsData?.handle}</span> is not currently linked to the Titans agency. 
                  Please contact your agency manager to get linked in TikTok Partner Center.
                </p>
                <p className="text-xs text-text-muted mt-2">
                  If you believe this is an error, make sure your handle is spelled correctly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Linked but Waiting for Data */}
        {isConnected && isLinkedToAgency && !hasData && (
          <div className="mb-8 p-4 rounded-lg bg-accent-teal/10 border border-accent-teal/20">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-accent-teal flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-accent-teal">
                  You're Linked to Titans Agency!
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Your handle <span className="font-medium text-text-primary">@{metricsData?.handle}</span> is confirmed linked. 
                  Metrics will appear here after the next daily import from TikTok Partner Center.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-titan-surface border border-titan-border p-5 rounded-lg relative overflow-hidden group hover:border-accent-teal/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-teal rounded-r"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                <DollarSign size={16} className="text-accent-teal" />
              </div>
              <span className="text-xs text-text-muted">Your Sales (30d)</span>
            </div>
            <div className="text-2xl font-bold text-text-primary tracking-tight mb-1">
              {isConnected && hasData 
                ? `$${metricsData.summary.gmv30Day.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : '—'}
            </div>
            {!isConnected && (
              <p className="text-xs text-text-muted">Connect to see</p>
            )}
            {isConnected && !hasData && (
              <p className="text-xs text-text-muted">Waiting for data</p>
            )}
          </div>

          <div className="bg-titan-surface border border-titan-border p-5 rounded-lg relative overflow-hidden group hover:border-accent-fuchsia/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-fuchsia rounded-r"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-fuchsia/10 flex items-center justify-center">
                <Star size={16} className="text-accent-fuchsia" />
              </div>
              <span className="text-xs text-text-muted">Your Earnings (30d)</span>
            </div>
            <div className="text-2xl font-bold text-text-primary tracking-tight mb-1">
              {isConnected && hasData 
                ? `$${metricsData.summary.commission30Day.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : '—'}
            </div>
            {!isConnected && (
              <p className="text-xs text-text-muted">Connect to see</p>
            )}
            {isConnected && !hasData && (
              <p className="text-xs text-text-muted">Waiting for data</p>
            )}
          </div>

          <div className="bg-titan-surface border border-titan-border p-5 rounded-lg relative overflow-hidden group hover:border-accent-teal/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-teal rounded-r"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center">
                <Package size={16} className="text-accent-teal" />
              </div>
              <span className="text-xs text-text-muted">Items Sold (30d)</span>
            </div>
            <div className="text-2xl font-bold text-text-primary tracking-tight mb-1">
              {isConnected && hasData 
                ? metricsData.summary.itemsSold30Day.toLocaleString() 
                : '—'}
            </div>
            {!isConnected && (
              <p className="text-xs text-text-muted">Connect to see</p>
            )}
            {isConnected && !hasData && (
              <p className="text-xs text-text-muted">Waiting for data</p>
            )}
          </div>

          <div className="bg-titan-surface border border-titan-border p-5 rounded-lg relative overflow-hidden group hover:border-accent-fuchsia/30 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-fuchsia rounded-r"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-fuchsia/10 flex items-center justify-center">
                <ShoppingBag size={16} className="text-accent-fuchsia" />
              </div>
              <span className="text-xs text-text-muted">Video CTR (Avg)</span>
            </div>
            <div className="text-2xl font-bold text-text-primary tracking-tight mb-1">
              {isConnected && hasData 
                ? `${metricsData.summary.avgVideoCtr.toFixed(2)}%`
                : '—'}
            </div>
            {!isConnected && (
              <p className="text-xs text-text-muted">Connect to see</p>
            )}
            {isConnected && !hasData && (
              <p className="text-xs text-text-muted">Waiting for data</p>
            )}
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-titan-surface border border-titan-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Your Earnings Over Time</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-teal"></div>
                  <span className="text-xs text-text-muted">Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent-fuchsia"></div>
                  <span className="text-xs text-text-muted">Your Earnings</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 bg-titan-elevated border border-titan-border text-text-secondary px-3 py-1.5 rounded text-xs hover:text-text-primary transition-all">
                <Calendar size={12} />
                {timeRange}
                <ChevronDown size={12} />
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-[220px] relative">
            {!isConnected ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-text-muted mb-3">Connect your TikTok Shop account to see your earnings chart</p>
                  <button
                    onClick={() => setShowHandleModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal hover:bg-accent-teal/90 text-white rounded text-sm font-medium transition-colors"
                  >
                    Connect Now
                  </button>
                </div>
              </div>
            ) : !hasData ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-text-muted">Waiting for metrics data to be imported...</p>
              </div>
            ) : (
              <>
                {/* Y-Axis */}
                <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-text-muted">
                  <span>${Math.round(maxChartValue / 1000)}K</span>
                  <span>${Math.round(maxChartValue * 0.66 / 1000)}K</span>
                  <span>${Math.round(maxChartValue * 0.33 / 1000)}K</span>
                  <span>$0</span>
                </div>
                
                {/* Grid Lines */}
                <div className="absolute left-12 right-0 top-0 bottom-6">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="absolute w-full border-t border-titan-border/50" style={{ top: `${i * 33.33}%` }}></div>
                  ))}
                </div>

                {/* SVG Chart */}
                <svg className="absolute left-12 right-0 top-0 bottom-6 w-[calc(100%-48px)] h-[calc(100%-24px)]" preserveAspectRatio="none">
                  <polyline
                    points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100}%,${100 - (d.gmv / maxChartValue) * 100}%`).join(' ')}
                    fill="none"
                    stroke="#00F2EA"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <polyline
                    points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100}%,${100 - ((d.comm * 4) / maxChartValue) * 100}%`).join(' ')}
                    fill="none"
                    stroke="#FF0050"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* X-Axis Labels */}
                <div className="absolute left-12 right-0 bottom-0 h-6 flex justify-between text-[10px] text-text-muted">
                  {chartData.filter((_, i) => i % 4 === 0).map((d, i) => (
                    <span key={i}>{d.date}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Daily Breakdown Table */}
        {isConnected && hasData && metricsData.dailyMetrics.length > 0 && (
          <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-titan-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Daily Performance</h3>
                <p className="text-xs text-text-muted">Your metrics by day</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-titan-bg/50 text-xs text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium text-right">GMV</th>
                    <th className="px-5 py-3 font-medium text-right">Commission</th>
                    <th className="px-5 py-3 font-medium text-right">Items Sold</th>
                    <th className="px-5 py-3 font-medium text-right">Video CTR</th>
                    <th className="px-5 py-3 font-medium text-right">Video RPM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-titan-border">
                  {metricsData.dailyMetrics.slice(0, 14).map((metric, i) => (
                    <tr key={i} className="hover:bg-titan-elevated/50 transition-colors">
                      <td className="px-5 py-4 text-text-primary font-medium">
                        {new Date(metric.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-5 py-4 text-right text-accent-teal font-medium">
                        ${metric.affiliate_gmv.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right text-accent-fuchsia font-medium">
                        ${metric.est_commission.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right text-text-primary">
                        {metric.items_sold}
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">
                        {metric.video_ctr.toFixed(2)}%
                      </td>
                      <td className="px-5 py-4 text-right text-text-muted">
                        ${metric.video_rpm.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* TikTok Handle Modal */}
      <TikTokHandleModal
        isOpen={showHandleModal}
        onClose={() => setShowHandleModal(false)}
        onSave={handleSaveHandle}
        currentHandle={metricsData?.handle || ''}
        currentDisplayName={metricsData?.displayName || ''}
      />
    </div>
  );
};

export default Dashboard;
