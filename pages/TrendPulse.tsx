import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { TrendingUp, Loader2, Globe, ArrowRight, RefreshCw, AlertCircle, Zap } from 'lucide-react';

interface TrendSource {
  title: string;
  uri: string;
}

const TrendPulse = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [sources, setSources] = useState<TrendSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/trends/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to fetch trends');
      }

      setData(result.data);
      setSources(result.sources || []);
      setLastUpdated(new Date().toLocaleTimeString());

    } catch (err: any) {
      console.error('Trend fetch error:', err);
      setError(err.message || 'Failed to fetch trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-titan-bg py-8 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-[10px] font-semibold uppercase tracking-wider mb-3">
              <Zap size={10} className="fill-accent-teal" />
              AI Powered
            </div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Trend Pulse</h1>
            <p className="text-sm text-text-muted">
              Real-time cross-platform intelligence
              {lastUpdated && <span className="text-text-muted/60"> • Updated {lastUpdated}</span>}
            </p>
          </div>
          
          <button 
            onClick={fetchTrends}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-accent-teal to-accent-fuchsia hover:opacity-90 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 shadow-lg shadow-accent-teal/20"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            {loading ? 'Scanning platforms...' : data ? 'Refresh Trends' : 'Scan for Trends'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3 mb-6">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error loading trends</p>
              <p className="text-xs opacity-80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Initial State - No data yet */}
        {!loading && !data && !error && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-teal/20 to-accent-fuchsia/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-accent-teal" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Ready to Scan</h2>
            <p className="text-text-muted text-sm max-w-md mx-auto mb-6">
              Click "Scan for Trends" to analyze TikTok, Twitter, Reddit, and more for viral content opportunities.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-text-muted">
              {['TikTok Shop', 'Twitter/X', 'Reddit', 'YouTube', 'Amazon'].map((platform) => (
                <span key={platform} className="px-3 py-1 bg-titan-surface border border-titan-border rounded-full">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-teal/20 to-accent-fuchsia/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Loader2 className="w-10 h-10 text-accent-teal animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Analyzing Trends...</h2>
            <p className="text-text-muted text-sm">Scanning multiple platforms for viral opportunities</p>
          </div>
        )}

        {/* Content */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Report */}
            <div className="lg:col-span-2">
              <div className="bg-titan-surface rounded-lg border border-titan-border p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent-teal/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-titan-border">
                  <TrendingUp className="text-accent-teal" size={16} />
                  <h2 className="text-sm font-semibold text-text-primary">Intelligence Report</h2>
                  {loading && <Loader2 size={14} className="animate-spin text-accent-teal ml-auto" />}
                </div>
                
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown 
                    components={{
                      h1: ({node, ...props}) => <h3 className="text-lg font-semibold text-text-primary mt-8 mb-3 pb-2 border-b border-titan-border" {...props} />,
                      h2: ({node, ...props}) => <h4 className="text-base font-semibold text-accent-teal mt-6 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h5 className="text-sm font-semibold text-accent-fuchsia mt-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-text-secondary text-sm mb-1.5 ml-4" {...props} />,
                      p: ({node, ...props}) => <p className="text-text-secondary text-sm leading-relaxed mb-3" {...props} />,
                      strong: ({node, ...props}) => <span className="text-text-primary font-semibold" {...props} />,
                      hr: ({node, ...props}) => <hr className="border-titan-border my-6" {...props} />,
                    }}
                  >
                    {data}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Sources */}
              <div className="bg-titan-surface rounded-lg border border-titan-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="text-text-muted" size={14} />
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Sources</h3>
                </div>
                {sources.length > 0 ? (
                  <ul className="space-y-2">
                    {sources.slice(0, 6).map((source, i) => (
                      <li key={i}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group block p-2.5 rounded bg-titan-bg border border-titan-border hover:border-accent-teal/30 transition-colors"
                        >
                          <p className="text-xs text-text-secondary group-hover:text-text-primary line-clamp-2 transition-colors">
                            {source.title}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-accent-teal mt-1.5">
                            <span>View source</span>
                            <ArrowRight size={8} />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-muted">AI-generated insights based on current trends</p>
                )}
              </div>

              {/* Tips Card */}
              <div className="bg-titan-surface border border-titan-border rounded-lg p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-3">💡 Pro Tips</h3>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-teal">•</span>
                    Act fast on trending topics - they move quick!
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-teal">•</span>
                    Combine trends with your niche for unique angles
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-teal">•</span>
                    Test hook variations from the suggestions
                  </li>
                </ul>
              </div>

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-accent-teal/10 to-accent-fuchsia/10 border border-accent-teal/20 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-1">Found a trend?</h3>
                <p className="text-xs text-text-muted mb-4">Test your video idea with our AI audit</p>
                <a 
                  href="#/audit" 
                  className="inline-flex items-center gap-1.5 bg-text-primary hover:bg-white text-titan-bg px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                >
                  Video Audit
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default TrendPulse;
