import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Upload, Video, Link as LinkIcon, Play, CheckCircle, AlertTriangle, Loader2, Sparkles, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface AuditRecord {
  id: string;
  link?: string;
  fileName?: string;
  date: string;
  score: string;
}

/**
 * Validate TikTok URL format
 * Accepts: tiktok.com, www.tiktok.com, vm.tiktok.com, vt.tiktok.com
 */
function isValidTikTokUrl(url: string): boolean {
  if (!url.trim()) return false;
  try {
    const parsed = new URL(url);
    const validHosts = [
      'tiktok.com',
      'www.tiktok.com',
      'vm.tiktok.com',
      'vt.tiktok.com',
      'm.tiktok.com',
    ];
    return validHosts.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

const VideoAudit = () => {
  const { user, session, loading: authLoading } = useAuth();
  
  // Debug log auth state
  React.useEffect(() => {
    console.log('[VideoAudit] Auth state:', { 
      hasUser: !!user, 
      userId: user?.id?.slice(0, 8),
      hasSession: !!session, 
      authLoading 
    });
  }, [user, session, authLoading]);
  
  // Controlled state for TikTok URL input
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlTouched, setUrlTouched] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([
    { id: '1', link: 'tiktok.com/@creator/video/7234...', date: '2 days ago', score: '78/100' },
    { id: '2', fileName: 'hook_test_v2.mp4', date: '5 days ago', score: '45/100' }
  ]);
  
  // Optional context fields for better analysis
  const [productName, setProductName] = useState('');
  const [niche, setNiche] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle TikTok URL input change with validation
   */
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTiktokUrl(value);
    
    // Validate on change if field was touched
    if (urlTouched && value.trim()) {
      if (!isValidTikTokUrl(value)) {
        setUrlError('Please enter a valid TikTok URL (tiktok.com or vm.tiktok.com)');
      } else {
        setUrlError(null);
      }
    } else if (!value.trim()) {
      setUrlError(null);
    }
  };

  /**
   * Handle URL input blur - validate and show error
   */
  const handleUrlBlur = () => {
    setUrlTouched(true);
    if (tiktokUrl.trim() && !isValidTikTokUrl(tiktokUrl)) {
      setUrlError('Please enter a valid TikTok URL (tiktok.com or vm.tiktok.com)');
    } else {
      setUrlError(null);
    }
  };

  /**
   * Check if we can analyze (file OR valid URL)
   */
  const canAnalyze = file || (tiktokUrl.trim() && isValidTikTokUrl(tiktokUrl));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      // Clear URL when file is selected
      setTiktokUrl('');
      setUrlError(null);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  /**
   * Handle video audit submission
   * - If file is provided: use client-side Gemini (existing flow)
   * - If only tiktokUrl: call server-side /api/audit/url endpoint
   */
  const handleAudit = async () => {
    if (!canAnalyze) return;
    
    setIsAnalyzing(true);
    setResult(null);

    // ═══════════════════════════════════════════════════════════════════════
    // FLOW 1: TikTok URL Analysis (server-side)
    // This takes priority over file upload
    // ═══════════════════════════════════════════════════════════════════════
    if (!file && tiktokUrl.trim() && isValidTikTokUrl(tiktokUrl)) {
      try {
        console.log('[VideoAudit] Using server-side URL analysis for:', tiktokUrl);
        console.log('[VideoAudit] Session from context:', session ? 'exists' : 'none');
        
        // Use session from context, fallback to getSession() if needed
        let accessToken = session?.access_token;
        
        if (!accessToken) {
          console.log('[VideoAudit] No session in context, trying getSession()...');
          const { data } = await supabase.auth.getSession();
          accessToken = data.session?.access_token;
        }
        
        if (!accessToken) {
          console.log('[VideoAudit] No access token available');
          setResult("## Please Log In\n\nTo analyze TikTok URLs, please log in to your account first.\n\n[Log In](#/login)");
          setIsAnalyzing(false);
          return;
        }

        console.log('[VideoAudit] Calling /api/audit/url with token...');
        const response = await fetch('/api/audit/url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tiktokUrl: tiktokUrl.trim(),
            productName: productName.trim() || undefined,
            niche: niche.trim() || undefined,
          }),
        });

        console.log('[VideoAudit] Response status:', response.status);
        const data = await response.json();
        console.log('[VideoAudit] Response data:', data);

        if (!response.ok || !data.success) {
          setResult(`## Analysis Failed\n\n${data.error || "Failed to analyze video. Please try again."}\n\n**Tip:** Make sure you're using a valid TikTok video URL.`);
          setIsAnalyzing(false);
          return;
        }

        setResult(data.feedback);

        // Extract score and add to history
        const extractedScore = data.score !== null ? data.score.toString() : 'N/A';
        const newRecord: AuditRecord = {
          id: data.auditId || Date.now().toString(),
          link: tiktokUrl,
          date: 'Just now',
          score: extractedScore + '/100'
        };
        setAuditHistory([newRecord, ...auditHistory]);
      } catch (error) {
        console.error('[VideoAudit] URL analysis error:', error);
        setResult(`## Error\n\nFailed to analyze TikTok URL. Please try again.\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FLOW 2: File Upload Analysis (client-side Gemini)
    // ═══════════════════════════════════════════════════════════════════════
    if (file) {
      try {
        console.log('[VideoAudit] Using client-side file analysis');
        
        if (!process.env.API_KEY) {
          throw new Error("API Key not found. Please configure VITE_GEMINI_API_KEY.");
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemPrompt = `
        You are a world-class TikTok Shop affiliate strategist and video auditor. 
        Your goal is to help the creator maximize GMV (Gross Merchandise Value) through viral, high-converting content.
        
        The user has uploaded a video. Analyze the visual and audio content deeply.

        ### CRITICAL RULE: OPENING LINE CHECK
        You MUST listen to the first 3 seconds.
        1. **Statement vs. Question**: 
           - **WEAK**: Starts with a question. **PENALTY**: Deduct 15-20 points from Hook Score.
           - **STRONG**: Starts with a bold statement/claim. **BONUS**: Boost Hook Score +10.

        ### EVALUATION RUBRIC (Score 0-10 each)
        1. **Controversy / Pattern Interrupt**: Does the visual/audio break the scroll immediately?
        2. **Snappy Hook**: Is it fast? Does it promise a result?
        3. **Curiosity Gap**: Does it create "information tension"?
        4. **Target Audience Clarity**: Does it call out a specific avatar?
        5. **Pain Point + Product**: Is the problem clear? Is the solution integrated early?
        6. **Call-to-Action (CTA)**: Is it urgent and clear?
        7. **Pacing & Editing**: Is fluff removed? Is it fast and punchy?

        ### OUTPUT FORMAT (Markdown)
        
        ## Overall Score: [0-100]/100
        **Success Probability:** [Percentage]%

        ---

        ### Category Breakdown
        *   **Hook:** [Score]/10 - [Feedback]
        *   **Pattern Interrupt:** [Score]/10 - [Brief analysis]
        *   **Curiosity Gap:** [Score]/10 - [Brief analysis]
        *   **Audience Clarity:** [Score]/10 - [Brief analysis]
        *   **Pain & Product:** [Score]/10 - [Brief analysis]
        *   **CTA Strength:** [Score]/10 - [Brief analysis]
        *   **Pacing:** [Score]/10 - [Brief analysis]

        ---

        ### Actionable Fixes
        *   [Fix 1]
        *   [Fix 2]
        *   [Fix 3]

        ### Summary
        [Brief encouraging summary]
        `;

        const videoPart = await fileToGenerativePart(file);
        const promptParts = [
          videoPart,
          { text: systemPrompt }
        ];

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: { parts: promptParts },
        });

        const responseText = response.text || "Analysis failed. Please try again.";
        setResult(responseText);

        const scoreMatch = responseText.match(/Overall Score:\s*(\d+)/i);
        const extractedScore = scoreMatch ? scoreMatch[1] : 'N/A';

        const newRecord: AuditRecord = {
          id: Date.now().toString(),
          fileName: file.name,
          date: 'Just now',
          score: extractedScore + '/100'
        };
        setAuditHistory([newRecord, ...auditHistory]);
      } catch (error) {
        console.error('[VideoAudit] File analysis error:', error);
        setResult(`## Error\n\nFailed to analyze video file. Please ensure the file is valid and try again.\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-titan-bg py-8 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent-fuchsia/10 border border-accent-fuchsia/20 text-accent-fuchsia text-[10px] font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={10} />
            AI Powered
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Video Audit</h1>
          <p className="text-sm text-text-muted">Analyze your content for viral potential</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-titan-surface rounded border border-titan-border p-5">
              
              {/* File Upload */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Upload Video
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    file 
                      ? 'border-accent-teal/50 bg-accent-teal/5' 
                      : 'border-titan-border hover:border-titan-border-light bg-titan-bg'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*" 
                    className="hidden" 
                  />
                  
                  {file ? (
                    <div className="relative w-full aspect-[9/16] bg-titan-bg rounded overflow-hidden">
                      <video src={previewUrl!} className="w-full h-full object-contain" controls />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-titan-bg/80 hover:bg-accent-fuchsia rounded text-text-primary text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded bg-titan-elevated flex items-center justify-center text-text-muted mb-3">
                        <Video size={18} />
                      </div>
                      <p className="text-xs text-text-secondary mb-0.5">Click to upload</p>
                      <p className="text-[10px] text-text-muted">MP4, MOV up to 50MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* TikTok URL Input */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Or paste TikTok link
                </label>
                <div className="relative">
                  <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 ${urlError ? 'text-accent-fuchsia' : 'text-text-muted'}`} size={14} />
                  <input 
                    type="url" 
                    value={tiktokUrl}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                    placeholder="https://tiktok.com/@... or vm.tiktok.com/..." 
                    className={`w-full pl-9 pr-3 py-2.5 rounded bg-titan-bg border text-text-primary text-sm focus:outline-none transition-colors placeholder-text-muted ${
                      urlError 
                        ? 'border-accent-fuchsia focus:border-accent-fuchsia' 
                        : tiktokUrl && isValidTikTokUrl(tiktokUrl)
                          ? 'border-accent-teal focus:border-accent-teal'
                          : 'border-titan-border focus:border-accent-teal'
                    }`}
                  />
                  {/* Valid URL indicator */}
                  {tiktokUrl && isValidTikTokUrl(tiktokUrl) && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-teal" size={14} />
                  )}
                </div>
                {/* Inline error message */}
                {urlError && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-accent-fuchsia">
                    <AlertCircle size={12} />
                    <span className="text-[10px]">{urlError}</span>
                  </div>
                )}
                <p className="text-[10px] text-text-muted mt-1.5">
                  Supports: tiktok.com, vm.tiktok.com, vt.tiktok.com
                </p>
              </div>

              {/* Optional Context Fields (shown when URL is entered) */}
              {tiktokUrl && isValidTikTokUrl(tiktokUrl) && (
                <div className="mb-5 p-3 bg-titan-bg rounded border border-titan-border space-y-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
                    Optional: Add context for better analysis
                  </p>
                  <div>
                    <input 
                      type="text" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Product name (e.g., LED Face Mask)" 
                      className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="Your niche (e.g., Beauty, Fitness)" 
                      className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleAudit}
                disabled={isAnalyzing || !canAnalyze}
                className="w-full bg-text-primary hover:bg-white text-titan-bg font-medium py-2.5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Analyze Video
                  </>
                )}
              </button>

              {/* Login hint for URL analysis */}
              {!authLoading && !user && tiktokUrl && isValidTikTokUrl(tiktokUrl) && (
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  <a href="#/login" className="text-accent-teal hover:underline">Log in</a> to analyze TikTok URLs
                </p>
              )}
              
              {/* Auth status indicator (for debugging) */}
              {authLoading && (
                <p className="text-[10px] text-text-muted mt-2 text-center flex items-center justify-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  Checking login status...
                </p>
              )}
            </div>

            {/* History */}
            <div className="bg-titan-surface rounded border border-titan-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="text-text-muted" size={14} />
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">History</h3>
              </div>
              <div className="space-y-2">
                {auditHistory.slice(0, 4).map(record => (
                  <div key={record.id} className="flex items-center justify-between p-2.5 rounded bg-titan-bg border border-titan-border">
                    <div>
                      <p className="text-xs text-text-primary truncate max-w-[120px]">
                        {record.fileName || record.link || 'Video'}
                      </p>
                      <p className="text-[10px] text-text-muted">{record.date}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      parseInt(record.score) >= 80 ? 'bg-accent-teal/10 text-accent-teal' : 
                      parseInt(record.score) >= 50 ? 'bg-accent-orange/10 text-accent-orange' : 
                      'bg-accent-fuchsia/10 text-accent-fuchsia'
                    }`}>
                      {record.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="bg-titan-surface rounded border border-titan-border p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-teal to-accent-fuchsia"></div>
                
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle className="text-accent-teal" size={16} />
                  <h2 className="text-sm font-semibold text-text-primary">Results</h2>
                </div>
                
                <div className="prose prose-invert max-w-none text-sm">
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-text-primary mt-4 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-accent-teal mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-text-secondary text-sm leading-relaxed mb-3" {...props} />,
                      li: ({node, ...props}) => <li className="text-text-secondary text-sm mb-1.5" {...props} />,
                      strong: ({node, ...props}) => <span className="text-text-primary font-semibold" {...props} />,
                      hr: ({node, ...props}) => <hr className="border-titan-border my-4" {...props} />,
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>

                <div className="mt-6 pt-4 border-t border-titan-border">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-accent-orange shrink-0 mt-0.5" size={12} />
                    <p className="text-[10px] text-text-muted">
                      AI analysis based on TikTok virality metrics. Results may vary by niche.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] bg-titan-surface rounded border border-titan-border border-dashed flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 bg-titan-elevated rounded flex items-center justify-center text-text-muted mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">Ready to Audit</h3>
                <p className="text-sm text-text-muted max-w-xs mb-6">
                  Upload a video to receive performance analysis and improvement recommendations
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={10} className="text-accent-teal" />
                    Hook Analysis
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={10} className="text-accent-teal" />
                    CTA Strength
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={10} className="text-accent-teal" />
                    Pacing Check
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={10} className="text-accent-teal" />
                    Product Clarity
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default VideoAudit;
