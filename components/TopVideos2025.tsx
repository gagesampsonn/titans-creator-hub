import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, Video, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react';

// Video performance data - YTD 2025
const VIDEO_DATA: { gmv: number; items: number }[] = [
  { gmv: 87226.01, items: 2075 },
  { gmv: 80517.31, items: 2261 },
  { gmv: 38808.53, items: 2025 },
  { gmv: 36964.12, items: 2025 },
  { gmv: 35800.18, items: 2025 },
  { gmv: 35529.59, items: 2443 },
  { gmv: 34829.69, items: 905 },
  { gmv: 34373.88, items: 975 },
  { gmv: 33784.93, items: 919 },
  { gmv: 29815.00, items: 829 },
  { gmv: 28944.70, items: 2025 },
  { gmv: 27892.15, items: 807 },
  { gmv: 27430.08, items: 1292 },
  { gmv: 27088.00, items: 382 },
  { gmv: 24976.27, items: 2025 },
  { gmv: 23242.58, items: 1170 },
  { gmv: 23168.72, items: 2025 },
  { gmv: 21677.79, items: 631 },
  { gmv: 21438.82, items: 1416 },
  { gmv: 20226.13, items: 594 },
  { gmv: 19682.75, items: 657 },
  { gmv: 19054.98, items: 1436 },
  { gmv: 18620.06, items: 904 },
  { gmv: 17480.12, items: 2025 },
  { gmv: 17088.91, items: 564 },
  { gmv: 16222.63, items: 4001 },
  { gmv: 15535.96, items: 1180 },
  { gmv: 15428.29, items: 770 },
  { gmv: 15108.23, items: 2025 },
  { gmv: 14375.77, items: 448 },
  { gmv: 14018.18, items: 373 },
  { gmv: 13304.47, items: 382 },
  { gmv: 13044.93, items: 382 },
  { gmv: 12768.18, items: 359 },
  { gmv: 12433.40, items: 350 },
  { gmv: 11871.26, items: 637 },
  { gmv: 11838.73, items: 308 },
  { gmv: 11796.86, items: 326 },
  { gmv: 11456.14, items: 553 },
  { gmv: 10446.55, items: 469 },
  { gmv: 10273.90, items: 279 },
  { gmv: 10120.04, items: 2596 },
  { gmv: 9139.23, items: 268 },
  { gmv: 8915.61, items: 257 },
  { gmv: 8670.40, items: 171 },
  { gmv: 8553.82, items: 165 },
  { gmv: 8487.43, items: 230 },
  { gmv: 7933.02, items: 553 },
  { gmv: 7815.28, items: 351 },
  { gmv: 7244.68, items: 311 },
];

// Full dataset stats (calculated from all 4,542 videos)
const FULL_STATS = {
  totalVideos: 4542,
  totalGMV: 2703040.81,
  totalItems: 70853,
  avgGMV: 595.12,
  medianGMV: 64.93,
  highestGMV: 87226.01,
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

type SortField = 'gmv' | 'items';
type SortOrder = 'desc' | 'asc';

const TopVideos2025: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const [sortField, setSortField] = useState<SortField>('gmv');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedData = useMemo(() => {
    const sorted = [...VIDEO_DATA].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [sortField, sortOrder]);

  const displayData = showAll ? sortedData : sortedData.slice(0, 10);
  const maxGMV = Math.max(...VIDEO_DATA.map(v => v.gmv));

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/10 to-cyan-500/20 rounded-3xl blur-xl" />
      
      <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-800">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Titans Top Videos — 2025
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                Real performance from our best-performing affiliate videos
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Year to Date</div>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                {formatCurrency(FULL_STATS.totalGMV)}
              </div>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 bg-black/20">
          <div className="text-center p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
              <Video size={14} />
              Total Videos
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(FULL_STATS.totalVideos)}</div>
          </div>
          <div className="text-center p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
              <DollarSign size={14} />
              Total GMV
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              {formatCurrency(FULL_STATS.totalGMV)}
            </div>
          </div>
          <div className="text-center p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
              <ShoppingCart size={14} />
              Items Sold
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(FULL_STATS.totalItems)}</div>
          </div>
          <div className="text-center p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-2">
              <BarChart3 size={14} />
              Avg GMV/Video
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(FULL_STATS.avgGMV)}</div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-gray-800">
          <div className="text-sm text-gray-400">
            Showing {showAll ? 'all' : 'top'} <span className="text-white font-medium">{displayData.length}</span> videos
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort by:</span>
            <button
              onClick={() => toggleSort('gmv')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                sortField === 'gmv'
                  ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              GMV {sortField === 'gmv' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('items')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                sortField === 'items'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              Items {sortField === 'items' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left py-3 px-6 md:px-8 w-16">Rank</th>
                <th className="text-left py-3 px-4">Performance</th>
                <th className="text-right py-3 px-4">GMV</th>
                <th className="text-right py-3 px-6 md:px-8">Items</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((video, index) => {
                const barWidth = (video.gmv / maxGMV) * 100;
                const rank = index + 1;
                const isTop3 = rank <= 3;
                
                return (
                  <tr 
                    key={index} 
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-6 md:px-8">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                        rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                        rank === 3 ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {rank}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full max-w-xs">
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTop3 
                                ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500' 
                                : 'bg-gradient-to-r from-fuchsia-500/60 to-cyan-500/60'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${isTop3 ? 'text-white' : 'text-gray-300'}`}>
                        {formatCurrency(video.gmv)}
                      </span>
                    </td>
                    <td className="py-3 px-6 md:px-8 text-right text-gray-400">
                      {formatNumber(video.items)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* View All Toggle */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 px-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp size={16} />
                Show Top 10 Only
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                View All {VIDEO_DATA.length} Videos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopVideos2025;

