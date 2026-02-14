import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Crown, Medal, TrendingUp, Calendar, ExternalLink, Sparkles, Star, Award } from 'lucide-react';

interface TopVideo {
  id: string;
  rank: number;
  handle: string;
  videoId: string;
  videoName: string | null;
  revenue: number;
  comparePct: number;
  contributionPct: number;
}

interface TopVideosData {
  hasVideos: boolean;
  dateRange: { start: string; end: string } | null;
  videos: TopVideo[];
}

const TopVideosBillboard = () => {
  const [data, setData] = useState<TopVideosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/top-videos/public')
      .then(res => res.json())
      .then((data: TopVideosData) => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch top videos:', err);
        setError('Failed to load top videos');
        setLoading(false);
      });
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />;
    } else if (rank === 2) {
      return <Crown className="w-6 h-6 text-gray-300 fill-gray-300" />;
    } else if (rank === 3) {
      return <Crown className="w-6 h-6 text-amber-600 fill-amber-600" />;
    }
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white';
    return 'bg-titan-elevated text-text-secondary border border-titan-border';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading top videos...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.hasVideos) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Trophy className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">No Top Videos Yet</h2>
          <p className="text-text-secondary mb-6">
            The top videos billboard will appear here once data is available.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-titan-bg">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
          {/* Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-medium mb-6">
              <Award size={16} />
              Top Videos of 2026
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="text-text-primary">The </span>
              <span className="text-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Top 20
              </span>
              <br />
              <span className="text-text-primary">Videos</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-6">
              An exclusive honor reserved for the highest-performing creators. 
              These videos drove the most GMV across the entire Titans agency.
            </p>

            {data.dateRange && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-titan-surface border border-titan-border rounded-lg text-sm text-text-muted">
                <Calendar size={16} />
                <span>
                  {formatDate(data.dateRange.start)} - {formatDate(data.dateRange.end)}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Billboard Section */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 pb-20">
        <div className="bg-titan-surface border border-titan-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-b border-titan-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-xl font-bold text-text-primary">Top 20 Videos</h2>
              </div>
              <div className="text-sm text-text-muted">
                Ranked by GMV
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="divide-y divide-titan-border">
            {data.videos.map((video, idx) => {
              const isTopThree = video.rank <= 3;
              const rankIcon = getRankIcon(video.rank);
              
              return (
                <div
                  key={video.id}
                  className={`group hover:bg-titan-elevated/50 transition-colors ${
                    isTopThree ? 'bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent' : ''
                  }`}
                >
                  <div className="px-6 py-5">
                    <div className="flex items-start gap-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${getRankBadgeColor(video.rank)}`}>
                          {rankIcon || video.rank}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-text-primary truncate">
                                {video.videoName || `Video ${video.videoId}`}
                              </h3>
                              {isTopThree && (
                                <Sparkles size={14} className="text-yellow-400 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-text-muted">
                              @{video.handle}
                            </p>
                          </div>
                          
                          {/* Revenue Badge */}
                          <div className="flex-shrink-0 text-right">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                              <TrendingUp size={14} className="text-green-400" />
                              <span className="text-sm font-bold text-green-400">
                                {formatCurrency(video.revenue)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-400" />
                            <span>Contribution: <span className="text-text-primary font-medium">{video.contributionPct.toFixed(2)}%</span></span>
                          </div>
                          {video.comparePct !== 0 && (
                            <div className={`flex items-center gap-1 ${video.comparePct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              <TrendingUp size={12} className={video.comparePct < 0 ? 'rotate-180' : ''} />
                              <span>{video.comparePct > 0 ? '+' : ''}{video.comparePct.toFixed(2)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-titan-surface border border-titan-border rounded-2xl p-8">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Want to make it on the billboard?
            </h3>
            <p className="text-text-secondary mb-6 max-w-xl mx-auto">
              Join Titans to get access to high-GMV products, creator tools, and the support you need to create top-performing videos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/samples"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
              >
                Get Free Samples
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-titan-elevated border border-titan-border text-text-primary font-medium rounded-xl hover:bg-titan-bg transition-all"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TopVideosBillboard;

