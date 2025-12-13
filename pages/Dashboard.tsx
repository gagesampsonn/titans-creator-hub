import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, Calendar, Download, MoreHorizontal, Link2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { MOCK_PRODUCTS } from '../lib/mockData';
import { useAuth } from '../lib/AuthContext';
import { getTikTokStatus, connectTikTok, disconnectTikTok, getTikTokMetrics, TikTokStatus, TikTokMetrics } from '../lib/tiktokService';

// Mock Data for the Chart (will be replaced with real data when TikTok connected)
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

  // Check TikTok connection status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getTikTokStatus();
        setTiktokStatus(status);

        // If connected, fetch metrics
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

    // Check for connection result from URL params
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (params.get('tiktok') === 'connected') {
      checkStatus();
      // Clean URL
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

  // Helper to render trend percentage
  const Trend = ({ val }: { val: string }) => (
    <span className={`text-xs font-medium ${val.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
      {val.startsWith('+') ? '▲' : '▼'} {val.replace('+', '').replace('-', '')} <span className="text-slate-500 font-normal">vs. previous 31 days</span>
    </span>
  );

  // Use real metrics if available, otherwise show placeholders
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
    <div className="min-h-screen bg-[#0B0E14] pb-20 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TikTok Connection Banner */}
        {!loading && (
          <div className={`mb-6 p-4 rounded-xl border ${
            tiktokStatus?.connected 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-orange-500/10 border-orange-500/30'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {tiktokStatus?.connected ? (
                  <>
                    <CheckCircle className="text-emerald-400" size={20} />
                    <div>
                      <p className="text-white font-medium">TikTok Shop Connected</p>
                      <p className="text-sm text-slate-400">
                        Linked as @{tiktokStatus.username || 'Unknown'} • Live data syncing
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-orange-400" size={20} />
                    <div>
                      <p className="text-white font-medium">Connect TikTok Shop</p>
                      <p className="text-sm text-slate-400">
                        Link your account to see real GMV, commissions, and analytics
                      </p>
                    </div>
                  </>
                )}
              </div>

              {tiktokStatus?.connected ? (
                <button
                  onClick={handleDisconnectTikTok}
                  disabled={disconnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {disconnecting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectTikTok}
                  disabled={connecting}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF004F] hover:bg-[#E6004A] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Link2 size={14} />
                  )}
                  Connect TikTok Shop
                </button>
              )}
            </div>

            {tiktokStatus?.needsReauth && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="text-yellow-400" size={16} />
                <span className="text-sm text-yellow-200">
                  Your TikTok session has expired. Please reconnect to continue syncing data.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Data Compass</h1>
            <p className="text-slate-400 text-sm">Overview of your shop performance.</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 bg-[#161B26] border border-[#2D3342] text-slate-300 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors">
               <Calendar size={14} />
               {timeRange}
               <ChevronDown size={14} />
             </button>
             <button className="flex items-center gap-2 bg-[#161B26] border border-[#2D3342] text-slate-300 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors">
               <Download size={14} />
               Export
             </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-lg font-bold text-white">Key metrics</h2>
             <div className="flex items-center gap-2">
               <div className="w-10 h-5 bg-emerald-500/20 rounded-full border border-emerald-500/30 relative cursor-pointer">
                 <div className="absolute right-1 top-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
               </div>
               <span className="text-sm text-slate-300">Show trends</span>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Card 1 - GMV */}
            <div className="bg-[#161B26] border border-[#2D3342] p-5 rounded-lg relative overflow-hidden group hover:border-[#3E4556] transition-colors cursor-pointer">
              <div className="absolute top-0 left-0 w-1 h-full bg-tiktok-cyan"></div>
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked readOnly className="accent-tiktok-cyan w-4 h-4 rounded bg-slate-800 border-slate-600" />
                <span className="text-sm font-semibold text-white">Affiliate GMV</span>
                <HelpCircle size={12} className="text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                ${tiktokStatus?.connected ? metrics.gmv30Day.toLocaleString() : '291,265.57'}
              </div>
              <Trend val="+29.94%" />
              {!tiktokStatus?.connected && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-slate-400">Sample data</span>
                </div>
              )}
            </div>

            {/* Active Card 2 - Commissions */}
            <div className="bg-[#161B26] border border-[#2D3342] p-5 rounded-lg relative overflow-hidden group hover:border-[#3E4556] transition-colors cursor-pointer">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked readOnly className="accent-blue-500 w-4 h-4 rounded bg-slate-800 border-slate-600" />
                <span className="text-sm font-semibold text-white">Est. commissions</span>
                <HelpCircle size={12} className="text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                ${tiktokStatus?.connected ? metrics.commission30Day.toLocaleString() : '51,090.42'}
              </div>
              <Trend val="+25.25%" />
              {!tiktokStatus?.connected && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-slate-400">Sample data</span>
                </div>
              )}
            </div>

            {/* Inactive Cards */}
            {[
              { label: 'Commission base', val: '$301,286.64', trend: '+36.35%' },
              { label: 'Items sold', val: tiktokStatus?.connected ? metrics.itemsSold.toLocaleString() : '13,688', trend: '+35.62%' },
              { label: 'Affiliate orders', val: tiktokStatus?.connected ? metrics.ordersTotal.toLocaleString() : '12,919', trend: '+35.15%' },
              { label: 'Direct GMV', val: '$257,717.10', trend: '+26.45%' },
              { label: 'Direct refund GMV', val: '$13,279.94', trend: '+15.84%' },
              { label: 'Refunded items', val: '631', trend: '-1.71%' },
            ].map((metric, i) => (
               <div key={i} className="bg-[#0B0E14] border border-[#1F232D] p-5 rounded-lg hover:bg-[#161B26] transition-colors cursor-pointer">
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-4 h-4 rounded border border-slate-600 bg-transparent"></div>
                   <span className="text-sm font-medium text-slate-400">{metric.label}</span>
                   <HelpCircle size={12} className="text-slate-600" />
                 </div>
                 <div className="text-2xl font-bold text-slate-200 mb-2">{metric.val}</div>
                 <Trend val={metric.trend} />
               </div>
            ))}
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-[#0B0E14] border-t border-b border-[#1F232D] py-8 mb-12 relative">
           <div className="flex items-center gap-6 mb-6 px-2">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-tiktok-cyan"></div>
               <span className="text-sm text-slate-400">Affiliate GMV</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-blue-500"></div>
               <span className="text-sm text-slate-400">Est. commissions</span>
             </div>
           </div>

           {/* Custom SVG Chart */}
           <div className="w-full h-[300px] relative">
             {/* Y-Axis Grid Lines */}
             <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-600">
               {[18, 12, 6, 0].map((val) => (
                 <div key={val} className="border-b border-[#1F232D] w-full h-0 flex items-center">
                   <span className="absolute -left-8">{val}K</span>
                 </div>
               ))}
             </div>
             
             {/* SVG Graph */}
             <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
               {/* GMV Line (Teal) */}
               <path 
                 d={`M ${CHART_DATA.map((d, i) => `${(i / (CHART_DATA.length - 1)) * 100}% ${100 - (d.gmv / 18000) * 100}%`).join(' L ')}`}
                 fill="none" 
                 stroke="#25F4EE" 
                 strokeWidth="2"
                 vectorEffect="non-scaling-stroke"
               />
               
               {/* Commission Line (Blue) */}
               <path 
                 d={`M ${CHART_DATA.map((d, i) => `${(i / (CHART_DATA.length - 1)) * 100}% ${100 - ((d.comm * 4) / 18000) * 100}%`).join(' L ')}`}
                 fill="none" 
                 stroke="#3B82F6" 
                 strokeWidth="2"
                 vectorEffect="non-scaling-stroke"
               />

               {/* Area under curve */}
               <defs>
                 <linearGradient id="gmvGradient" x1="0" x2="0" y1="0" y2="1">
                   <stop offset="0%" stopColor="#25F4EE" stopOpacity="0.1" />
                   <stop offset="100%" stopColor="#25F4EE" stopOpacity="0" />
                 </linearGradient>
               </defs>
               <path 
                 d={`M 0 100% L ${CHART_DATA.map((d, i) => `${(i / (CHART_DATA.length - 1)) * 100}% ${100 - (d.gmv / 18000) * 100}%`).join(' L ')} L 100% 100%`}
                 fill="url(#gmvGradient)" 
                 stroke="none"
               />
             </svg>
             
             {/* X-Axis Labels */}
             <div className="absolute bottom-[-24px] w-full flex justify-between text-[10px] text-slate-600">
               {CHART_DATA.map((d, i) => (
                 <span key={i} className={i % 2 === 0 ? 'visible' : 'invisible md:visible'}>{d.date}</span>
               ))}
             </div>
           </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-[#161B26] border border-[#2D3342] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2D3342] flex items-center justify-between">
            <h3 className="font-bold text-white">Top Performing Products</h3>
            <button className="text-sm text-tiktok-cyan hover:text-white transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-[#0F1219] text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-right">Est. GMV</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3342]">
                {MOCK_PRODUCTS.slice(0, 5).map((product, i) => (
                  <tr key={i} className="hover:bg-[#1C2230] transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      <img src={product.image} className="w-8 h-8 rounded bg-slate-800 object-cover" alt="" />
                      <span className="truncate max-w-[200px]">{product.name}</span>
                    </td>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4 text-right text-emerald-400">${product.gmv7Day.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">{product.commissionRate}%</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white">
                        <MoreHorizontal size={16} />
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
