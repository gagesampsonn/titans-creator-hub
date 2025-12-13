import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Newspaper, Loader2, Globe, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const TrendPulse = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!process.env.API_KEY) {
         throw new Error("API Key not found. Please set a valid API key.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Scan X/Twitter, TikTok, FastMoss, Kalodata, Google Search Trends, Reddit, Amazon Movers & Shakers, YouTube Shorts, and TikTok Shop bestseller data from the last 7 days.

        Prioritize X/Twitter for fast conversation velocity and TikTok/FastMoss/Kalodata for affiliate performance confirmation.

        Identify rising products, phrases, categories, pain points, content patterns, and cultural triggers that TikTok Shop creators can use.

        **Multi-source confirmation rule:** A trend is only valid if at least 2 platforms support it (e.g., trending on X + rising on TikTok Shop).

        FastMoss = real-time TikTok Shop product movement.
        Kalodata = long-term analytics + forecasting.

        For each detected trend, output the following in structured Markdown:
        1. **Trend Name**
        2. **Summary** (What is happening?)
        3. **Platform Sources** (Show which platform triggered it and which confirmed it, e.g., "Trigger: X, Confirmed: FastMoss")
        4. **Affiliate Relevance Score** (0–100)
        5. **Target Audience**
        6. **Best Hook Angles**
        7. **Content Recommendations**
        8. **Confidence Level**

        Your goal: provide creators with actionable, real-time intelligence for TikTok Shop content creation and product selection.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
      });
      
      setData(response.text || "No trends found.");
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
        
      const uniqueSources = Array.from(new Map(extractedSources.map((item:any) => [item['uri'], item])).values());
      setSources(uniqueSources);

    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch trends. Please try again later or check your API configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="min-h-screen bg-titan-bg py-8 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-[10px] font-semibold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-pulse"></span>
              Live
            </div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Trend Pulse</h1>
            <p className="text-sm text-text-muted">Real-time cross-platform intelligence</p>
          </div>
          
          <button 
            onClick={fetchTrends}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-titan-surface hover:bg-titan-elevated border border-titan-border text-text-primary px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            {loading ? 'Scanning...' : 'Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-accent-fuchsia/10 border border-accent-fuchsia/20 text-accent-fuchsia p-4 rounded flex items-start gap-3 mb-6">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Error loading trends</p>
              <p className="text-xs opacity-80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && !data ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-titan-surface rounded border border-titan-border"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-titan-surface rounded border border-titan-border"></div>
              <div className="h-32 bg-titan-surface rounded border border-titan-border"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Report */}
            <div className="lg:col-span-2">
              <div className="bg-titan-surface rounded border border-titan-border p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent-teal/5 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-titan-border">
                  <Newspaper className="text-accent-teal" size={16} />
                  <h2 className="text-sm font-semibold text-text-primary">Intelligence Report</h2>
                </div>
                
                <div className="prose prose-invert max-w-none text-sm">
                  {data ? (
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h3 className="text-base font-semibold text-text-primary mt-6 mb-2 pb-2 border-b border-titan-border" {...props} />,
                        h2: ({node, ...props}) => <h4 className="text-sm font-semibold text-accent-teal mt-5 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h5 className="text-sm font-semibold text-accent-fuchsia mt-4 mb-1" {...props} />,
                        li: ({node, ...props}) => <li className="text-text-secondary text-sm mb-1.5" {...props} />,
                        p: ({node, ...props}) => <p className="text-text-secondary text-sm leading-relaxed mb-3" {...props} />,
                        strong: ({node, ...props}) => <span className="text-text-primary font-semibold" {...props} />,
                      }}
                    >
                      {data}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-text-muted">No trend data available. Hit refresh to scan.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Sources */}
              <div className="bg-titan-surface rounded border border-titan-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="text-text-muted" size={14} />
                  <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">Sources</h3>
                </div>
                {sources.length > 0 ? (
                  <ul className="space-y-2">
                    {sources.slice(0, 6).map((source: any, i) => (
                      <li key={i}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group block p-2.5 rounded bg-titan-bg border border-titan-border hover:border-titan-border-light transition-colors"
                        >
                          <p className="text-xs text-text-secondary group-hover:text-text-primary line-clamp-2 transition-colors">
                            {source.title}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-text-muted mt-1">
                            <span>View</span>
                            <ArrowRight size={8} />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-muted">Sources appear after scanning</p>
                )}
              </div>

              {/* CTA Card */}
              <div className="bg-titan-bg border border-accent-teal/20 rounded p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent-teal/10 rounded-full blur-3xl"></div>
                <h3 className="text-sm font-semibold text-text-primary mb-1 relative z-10">Found a trend?</h3>
                <p className="text-xs text-text-muted mb-4 relative z-10">Match it with products in the library</p>
                <a 
                  href="#/products" 
                  className="inline-flex items-center gap-1.5 bg-text-primary hover:bg-white text-titan-bg px-3 py-1.5 rounded text-xs font-medium transition-colors relative z-10"
                >
                  Browse Products
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
