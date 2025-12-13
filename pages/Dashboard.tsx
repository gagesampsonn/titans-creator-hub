import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, Calendar, Download, MoreHorizontal, Link2, AlertCircle, CheckCircle, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { MOCK_PRODUCTS } from '../lib/mockData';
import { useAuth } from '../lib/AuthContext';
import { getTikTokStatus, connectTikTok, disconnectTikTok, getTikTokMetrics, TikTokStatus, TikTokMetrics } from '../lib/tiktokService';

const CHART_DATA = [
  { date: '11-10', gmv: 6500, comm: 1200 },
  { date: '11-12', gmv: 5800, comm: 1100 },
  { date: '11-14', gmv: 7200, comm: 1400 },
  { date: '11-16', gmv: 9500, comm: 1800 },
  { date: '11-18', gmv: 6200, comm: 1100 },
  { date: '11-20', gmv: 8100, comm: 1500 },
  { date: '11-22', gmv: 8300, comm: 1550 },
  { date: '11-24', gmv: 9100, comm: 1700 },
  { date: '11-26', gmv: 10500, comm: 2100 },
  { date: '11-28', gmv: 14200, comm: 2900 },
  { date: '11-30', gmv: 8500, comm: 1600 },
  { date: '12-02', gmv: 7500, comm: 1400 },
  { date: '12-04', gmv: 9200, comm: 1750 },
  { date: '12-06', gmv: 8800, comm: 1650 },
  { date: '12-08', gmv: 7900, comm: 1500 },
  { date: '12-10', gmv: 9500, comm: 1850 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('Last 30 days');
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatus | null>(null);
  const [tiktokMetrics, setTiktokMetrics] = useState<TikTokMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getTikTokStatus();
        setTiktokStatus(status);
        if (status.connected) {
          const metrics = await getTikTokMetrics();
          setTiktokMetrics(metrics);
        }
      } catch (error) {
        console.error('Failed to check TikTok status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkStatus();
    } else {
      setLoading(false);
    }

    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (params.get('tiktok') === 'connected') {
      checkStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  const handleConnectTikTok = async () => {
    if (!user) return;
    setConnecting(true);
    try {
      await connectTikTok(user.id);
    } catch (error) {
      console.error('Failed to start TikTok connection:', error);
      setConnecting(false);
    }
  };

  const handleDisconnectTikTok = async () => {
    setDisconnecting(true);
    try {
      await disconnectTikTok();
      setTiktokStatus({ connected: false });
      setTiktokMetrics(null);
    } catch (error) {
      console.error('Failed to disconnect TikTok:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  const Trend = ({ val, positive }: { val: string; positive: boolean }) => (
    <div className={`flex items-center gap-1 text-xs ${positive ? 'text-accent-teal' : 'text-accent-fuchsia'}`}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>{val}</span>
    </div>
  );

  const metrics = tiktokMetrics?.metrics?.summary || {
    gmv7Day: 0,
    gmv30Day: 0,
    commission7Day: 0,
    commission30Day: 0,
    ordersTotal: 0,
    itemsSold: 0,
    refundRate: 0,
  };

  return (
    <div className="min-h-screen bg-titan-bg pb-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        
        {/* TikTok Connection Banner */}
        {!loading && (
          <div className={`mb-6 p-4 rounded border ${
            tiktokStatus?.connected 
              ? 'bg-accent-teal/5 border-accent-teal/20' 
              : 'bg-titan-surface border-titan-border'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {tiktokStatus?.connected ? (
                  <>
                    <div className="w-8 h-8 rounded bg-accent-teal/10 flex items-center justify-center">
                      <CheckCircle size={16} className="text-accent-teal" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">TikTok Shop Connected</p>
                      <p className="text-xs text-text-muted">
                        @{tiktokStatus.username || 'Unknown'} • Syncing data
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded bg-titan-elevated flex items-center justify-center">
                      <Link2 size={16} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Connect TikTok Shop</p>
                      <p className="text-xs text-text-muted">
                        Link your account for live analytics
                      </p>
                    </div>
                  </>
                )}
              </div>

              {tiktokStatus?.connected ? (
                <button
                  onClick={handleDisconnectTikTok}
                  disabled={disconnecting}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
                >
                  {disconnecting && <Loader2 size={12} className="animate-spin" />}
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectTikTok}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 bg-text-primary hover:bg-white text-titan-bg rounded text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {connecting && <Loader2 size={14} className="animate-spin" />}
                  Connect
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Dashboard</h1>
            <p className="text-sm text-text-muted">Your performance overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-titan-surface border border-titan-border text-text-secondary px-3 py-1.5 rounded text-xs hover:text-text-primary hover:border-titan-border-light transition-all">
              <Calendar size={12} />
              {timeRange}
              <ChevronDown size={12} />
            </button>
            <button className="flex items-center gap-2 bg-titan-surface border border-titan-border text-text-secondary px-3 py-1.5 rounded text-xs hover:text-text-primary hover:border-titan-border-light transition-all">
              <Download size={12} />
              Export
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Primary Metrics */}
          <div className="bg-titan-surface border border-titan-border p-5 rounded relative overflow-hidden group hover:border-titan-border-light transition-colors">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-accent-teal"></div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-text-muted">Affiliate GMV</span>
              <HelpCircle size={10} className="text-text-muted" />
            </div>
            <div className="text-2xl font-semibold text-text-primary tracking-tight mb-1">
              ${tiktokStatus?.connected ? metrics.gmv30Day.toLocaleString() : '291,265'}
            </div>
            <Trend val="+29.94%" positive={true} />
          </div>

          <div className="bg-titan-surface border border-titan-border p-5 rounded relative overflow-hidden group hover:border-titan-border-light transition-colors">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-accent-fuchsia"></div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-text-muted">Est. Commission</span>
              <HelpCircle size={10} className="text-text-muted" />
            </div>
            <div className="text-2xl font-semibold text-text-primary tracking-tight mb-1">
              ${tiktokStatus?.connected ? metrics.commission30Day.toLocaleString() : '51,090'}
            </div>
            <Trend val="+25.25%" positive={true} />
          </div>

          <div className="bg-titan-surface border border-titan-border p-5 rounded relative overflow-hidden group hover:border-titan-border-light transition-colors">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-accent-teal"></div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-text-muted">Items Sold</span>
              <HelpCircle size={10} className="text-text-muted" />
            </div>
            <div className="text-2xl font-semibold text-text-primary tracking-tight mb-1">
              {tiktokStatus?.connected ? metrics.itemsSold.toLocaleString() : '13,688'}
            </div>
            <Trend val="+35.62%" positive={true} />
          </div>

          <div className="bg-titan-surface border border-titan-border p-5 rounded relative overflow-hidden group hover:border-titan-border-light transition-colors">
            <div className="absolute top-0 left-0 w-0.5 h-full bg-accent-fuchsia"></div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-text-muted">Orders</span>
              <HelpCircle size={10} className="text-text-muted" />
            </div>
            <div className="text-2xl font-semibold text-text-primary tracking-tight mb-1">
              {tiktokStatus?.connected ? metrics.ordersTotal.toLocaleString() : '12,919'}
            </div>
            <Trend val="+35.15%" positive={true} />
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-titan-surface border border-titan-border rounded p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-teal"></div>
                <span className="text-xs text-text-muted">GMV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-fuchsia"></div>
                <span className="text-xs text-text-muted">Commission</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="w-full h-[240px] relative">
            {/* Y-Axis */}
            <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-[10px] text-text-muted">
              <span>18K</span>
              <span>12K</span>
              <span>6K</span>
              <span>0</span>
            </div>
            
            {/* Grid Lines */}
            <div className="absolute left-12 right-0 top-0 bottom-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="absolute w-full border-t border-titan-border" style={{ top: `${i * 33.33}%` }}></div>
              ))}
            </div>

            {/* SVG Chart */}
            <svg className="absolute left-12 right-0 top-0 bottom-6 w-[calc(100%-48px)] h-[calc(100%-24px)]" preserveAspectRatio="none">
              {/* GMV Line */}
              <polyline
                points={CHART_DATA.map((d, i) => `${(i / (CHART_DATA.length - 1)) * 100}%,${100 - (d.gmv / 18000) * 100}%`).join(' ')}
                fill="none"
                stroke="#00F2EA"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              {/* Commission Line */}
              <polyline
                points={CHART_DATA.map((d, i) => `${(i / (CHART_DATA.length - 1)) * 100}%,${100 - ((d.comm * 4) / 18000) * 100}%`).join(' ')}
                fill="none"
                stroke="#FF0050"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* X-Axis Labels */}
            <div className="absolute left-12 right-0 bottom-0 h-6 flex justify-between text-[10px] text-text-muted">
              {CHART_DATA.filter((_, i) => i % 3 === 0).map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-titan-surface border border-titan-border rounded overflow-hidden">
          <div className="px-5 py-4 border-b border-titan-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Top Products</h3>
            <button className="text-xs text-accent-teal hover:text-text-primary transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-titan-bg text-xs text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium text-right">GMV</th>
                  <th className="px-5 py-3 font-medium text-right">Commission</th>
                  <th className="px-5 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-titan-border">
                {MOCK_PRODUCTS.slice(0, 5).map((product, i) => (
                  <tr key={i} className="hover:bg-titan-elevated transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-titan-elevated overflow-hidden">
                          <img src={product.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <span className="font-medium text-text-primary truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-muted">{product.category}</td>
                    <td className="px-5 py-4 text-right text-accent-teal font-medium">${product.gmv7Day.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-text-secondary">{product.commissionRate}%</td>
                    <td className="px-5 py-4 text-right">
                      <button className="p-1.5 hover:bg-titan-border rounded text-text-muted hover:text-text-primary transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
