import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Package, TrendingUp, RefreshCw, AtSign, 
  AlertCircle, CheckCircle, Loader2, Star
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface MetricsData {
  connected: boolean;
  handle: string | null;
  isLinked: boolean;
  hasData: boolean;
  summary: {
    totalGmv: number;
    totalCommission: number;
    totalItems: number;
    avgCtr: number;
  };
  dailyMetrics: Array<{
    date: string;
    affiliate_gmv: number;
    items_sold: number;
    est_commission: number;
    video_ctr: number;
  }>;
}

const Dashboard = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MetricsData | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [handle, setHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load metrics
  const loadMetrics = async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/metrics', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
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
            <p className="text-sm text-text-muted">
              Please contact your agency manager to get linked.
            </p>
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
          <button
            onClick={loadMetrics}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-accent-teal" />
              <span className="text-xs text-text-muted">Total GMV</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${data.summary.totalGmv.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-accent-fuchsia" />
              <span className="text-xs text-text-muted">Commission</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              ${data.summary.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-accent-teal" />
              <span className="text-xs text-text-muted">Items Sold</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {data.summary.totalItems.toLocaleString()}
            </p>
          </div>

          <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent-fuchsia" />
              <span className="text-xs text-text-muted">Avg Video CTR</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">
              {data.summary.avgCtr.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Daily Metrics Table */}
        {data.dailyMetrics.length > 0 && (
          <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-titan-border">
              <h2 className="font-semibold text-text-primary">Daily Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-titan-bg/50 text-xs text-text-muted uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-right">GMV</th>
                    <th className="px-6 py-3 text-right">Commission</th>
                    <th className="px-6 py-3 text-right">Items</th>
                    <th className="px-6 py-3 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-titan-border">
                  {data.dailyMetrics.map((m, i) => (
                    <tr key={i} className="hover:bg-titan-elevated/30">
                      <td className="px-6 py-4 text-text-primary">
                        {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
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
