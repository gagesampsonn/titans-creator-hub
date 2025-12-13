import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Newspaper, Loader, Globe, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

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
      
      // Extract grounding metadata if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const extractedSources = chunks
        .filter((c: any) => c.web?.uri && c.web?.title)
        .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
        
      // Deduplicate sources
      const uniqueSources = Array.from(new Map(extractedSources.map((item:any) => [item['uri'], item])).values());
      setSources(uniqueSources);

    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch trends. Please try again later or check your API configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tiktok-cyan/10 border border-tiktok-cyan/20 text-tiktok-cyan text-xs font-bold uppercase tracking-wide mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tiktok-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tiktok-cyan"></span>
              </span>
              Live Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Trend <span className="text-transparent bg-clip-text bg-gradient-to-r from-tiktok-cyan to-tiktok-pink">Pulse</span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Real-time cross-platform intelligence (FastMoss, Kalodata, X, TikTok).</p>
          </div>
          
          <button 
            onClick={fetchTrends}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold border border-slate-700 hover:border-tiktok-cyan/50 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            {loading ? 'Scanning Networks...' : 'Refresh Trends'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-start gap-4 mb-8">
            <AlertCircle className="shrink-0 mt-1" />
            <div>
              <h3 className="font-bold mb-1">Error Loading Trends</h3>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading && !data ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="h-40 bg-slate-900 rounded-2xl border border-slate-800"></div>
               <div className="h-40 bg-slate-900 rounded-2xl border border-slate-800"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main AI Report */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-tiktok-cyan/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                  <Newspaper className="text-orange-500" size={24} />
                  <h2 className="text-xl font-bold text-white">Latest Affiliate Briefing</h2>
                </div>
                
                <div className="prose prose-invert prose-orange max-w-none">
                  {data ? (
                    <ReactMarkdown 
                      components={{
                        h1: ({node, ...props}) => <h3 className="text-xl font-bold text-white mt-6 mb-3 border-b border-slate-800 pb-2" {...props} />,
                        h2: ({node, ...props}) => <h4 className="text-lg font-bold text-tiktok-cyan mt-5 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h5 className="text-base font-bold text-orange-400 mt-4 mb-1" {...props} />,
                        li: ({node, ...props}) => <li className="text-slate-300 mb-2" {...props} />,
                        strong: ({node, ...props}) => <span className="text-white font-bold" {...props} />,
                      }}
                    >
                      {data}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-slate-500 italic">No trend data available. Hit refresh to scan.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sources Sidebar */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="text-slate-400" size={18} />
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Verified Sources</h3>
                </div>
                {sources.length > 0 ? (
                  <ul className="space-y-3">
                    {sources.map((source: any, i) => (
                      <li key={i}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group block p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-tiktok-cyan/30 hover:bg-slate-900 transition-all"
                        >
                          <div className="text-sm font-medium text-slate-300 group-hover:text-tiktok-cyan line-clamp-2 transition-colors mb-1">
                            {source.title}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <span>Read Source</span>
                            <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500 text-sm">Sources will appear here after a search.</div>
                )}
              </div>

              <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-6 text-white border border-white/10 relative overflow-hidden">
                <h3 className="font-bold text-lg mb-2 relative z-10">Spot a Winning Product?</h3>
                <p className="text-orange-100 text-sm mb-4 relative z-10">Use the Product Library to find matching offers instantly.</p>
                <a href="#/products" className="inline-block bg-white text-orange-600 px-4 py-2 rounded-lg text-sm font-bold relative z-10 shadow-lg hover:bg-orange-50 transition-colors">
                  Find Products
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