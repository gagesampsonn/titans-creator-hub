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
  
  // Context fields for better analysis
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [niche, setNiche] = useState('');
  const [videoStyle, setVideoStyle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [keyBenefit, setKeyBenefit] = useState('');
  const [showContext, setShowContext] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video style options
  const videoStyleOptions = [
    { value: '', label: 'Select video style...' },
    { value: 'talking_head', label: 'Talking Head (direct to camera)' },
    { value: 'skit', label: 'Skit / Story-based' },
    { value: 'reply_video', label: 'Reply to Comment' },
    { value: 'product_plug', label: 'Product Plug (authority figure)' },
    { value: 'product_demo', label: 'Product Features Demo' },
    { value: 'unboxing', label: 'Unboxing / First Impressions' },
    { value: 'before_after', label: 'Before & After' },
    { value: 'tutorial', label: 'Tutorial / How-To' },
    { value: 'review', label: 'Honest Review' },
    { value: 'lifestyle', label: 'Lifestyle Integration' },
  ];

  // Product category options
  const productCategoryOptions = [
    { value: '', label: 'Select category...' },
    { value: 'beauty', label: 'Beauty & Skincare' },
    { value: 'supplements', label: 'Supplements & Wellness' },
    { value: 'fitness', label: 'Fitness & Health' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'home', label: 'Home & Kitchen' },
    { value: 'tech', label: 'Tech & Gadgets' },
    { value: 'pets', label: 'Pets' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'baby', label: 'Baby & Kids' },
    { value: 'other', label: 'Other' },
  ];

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
   * Check if we can analyze (file only for now - URL coming soon)
   */
  const canAnalyze = !!file;

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
            productCategory: productCategory || undefined,
            niche: niche.trim() || undefined,
            videoStyle: videoStyle || undefined,
            targetAudience: targetAudience.trim() || undefined,
            keyBenefit: keyBenefit.trim() || undefined,
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
        
        // Build context string from user inputs
        const contextParts: string[] = [];
        if (productName) contextParts.push(`Product: ${productName}`);
        if (productCategory) contextParts.push(`Category: ${productCategoryOptions.find(o => o.value === productCategory)?.label || productCategory}`);
        if (keyBenefit) contextParts.push(`Key Benefit: ${keyBenefit}`);
        if (videoStyle) contextParts.push(`Video Style: ${videoStyleOptions.find(o => o.value === videoStyle)?.label || videoStyle}`);
        if (targetAudience) contextParts.push(`Target Audience: ${targetAudience}`);
        if (niche) contextParts.push(`Niche: ${niche}`);
        
        const contextSection = contextParts.length > 0 
          ? `\n### CONTEXT PROVIDED BY CREATOR\n${contextParts.join('\n')}\n\nUse this context to provide more specific, actionable feedback.\n`
          : '';

        const videoStyleGuidance = videoStyle ? `
### VIDEO STYLE CONSIDERATIONS
The creator indicated this is a "${videoStyleOptions.find(o => o.value === videoStyle)?.label}" style video.

${videoStyle === 'talking_head' ? 'For Talking Head: Focus on eye contact, energy, confidence, and delivery. The hook must be verbally compelling.' : ''}
${videoStyle === 'skit' ? 'For Skit/Story: Evaluate the narrative structure, entertainment value, and how naturally the product is integrated.' : ''}
${videoStyle === 'reply_video' ? 'For Reply Video: Check if the comment context is clear, the response is engaging, and it creates curiosity.' : ''}
${videoStyle === 'product_plug' ? 'For Product Plug: Assess authority positioning, credibility signals, and how convincing the endorsement feels.' : ''}
${videoStyle === 'product_demo' ? 'For Product Demo: Note that showing features alone is often less effective for supplements. Focus on transformation/results.' : ''}
${videoStyle === 'unboxing' ? 'For Unboxing: Evaluate the reveal moment, genuine reactions, and first impressions authenticity.' : ''}
${videoStyle === 'before_after' ? 'For Before/After: Check if the transformation is believable, well-documented, and emotionally compelling.' : ''}
${videoStyle === 'tutorial' ? 'For Tutorial: Assess clarity of instructions, value provided, and product integration.' : ''}
${videoStyle === 'review' ? 'For Review: Evaluate authenticity, specific details, and balance of pros/cons.' : ''}
${videoStyle === 'lifestyle' ? 'For Lifestyle: Check how naturally the product fits into the scene and aspirational value.' : ''}
` : '';

        const systemPrompt = `
        You are a world-class TikTok Shop affiliate strategist and video auditor. 
        Your goal is to help the creator maximize GMV (Gross Merchandise Value) through viral, high-converting content.
        
        The user has uploaded a video. Analyze the visual and audio content deeply.
        ${contextSection}
        ${videoStyleGuidance}
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

              {/* TikTok URL Input - Coming Soon */}
              <div className="mb-5 relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-text-secondary">
                    Or paste TikTok link
                  </label>
                  <span className="px-2 py-0.5 bg-accent-fuchsia/10 text-accent-fuchsia text-[10px] font-semibold rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div className="relative opacity-50 pointer-events-none">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input 
                    type="url" 
                    disabled
                    placeholder="https://tiktok.com/@... or vm.tiktok.com/..." 
                    className="w-full pl-9 pr-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-muted text-sm cursor-not-allowed placeholder-text-muted"
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-1.5 flex items-center gap-1">
                  <Sparkles size={10} className="text-accent-fuchsia" />
                  URL analysis feature launching soon!
                </p>
              </div>

              {/* Video Context Section */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setShowContext(!showContext)}
                  className="w-full flex items-center justify-between p-3 bg-titan-bg rounded border border-titan-border hover:border-titan-border-light transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className="text-accent-teal" />
                    <span className="text-xs font-medium text-text-primary">Add Video Context</span>
                    <span className="text-[10px] text-accent-teal">(Better AI Analysis)</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform ${showContext ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showContext && (
                  <div className="mt-2 p-4 bg-titan-bg rounded border border-titan-border space-y-4">
                    {/* Product Info */}
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
                        Product Information
                      </label>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Product name (e.g., LED Face Mask Pro)" 
                          className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                        />
                        <select
                          value={productCategory}
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors"
                        >
                          {productCategoryOptions.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-titan-surface">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input 
                          type="text" 
                          value={keyBenefit}
                          onChange={(e) => setKeyBenefit(e.target.value)}
                          placeholder="Key benefit (e.g., Clears acne in 2 weeks)" 
                          className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                        />
                      </div>
                    </div>

                    {/* Video Style */}
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
                        Video Style
                      </label>
                      <select
                        value={videoStyle}
                        onChange={(e) => setVideoStyle(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors"
                      >
                        {videoStyleOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-titan-surface">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {['talking_head', 'skit', 'reply_video', 'product_demo'].map(style => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => setVideoStyle(style)}
                            className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                              videoStyle === style
                                ? 'bg-accent-teal/10 border-accent-teal text-accent-teal'
                                : 'bg-titan-surface border-titan-border text-text-muted hover:border-titan-border-light'
                            }`}
                          >
                            {videoStyleOptions.find(o => o.value === style)?.label.split(' (')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Audience */}
                    <div>
                      <label className="block text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
                        Target Audience
                      </label>
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="Who is this for? (e.g., Women 25-45 with acne)" 
                          className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                        />
                        <input 
                          type="text" 
                          value={niche}
                          onChange={(e) => setNiche(e.target.value)}
                          placeholder="Your niche (e.g., Skincare, Fitness)" 
                          className="w-full px-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-xs focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                        />
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="p-2.5 bg-accent-teal/5 border border-accent-teal/20 rounded">
                      <p className="text-[10px] text-accent-teal">
                        💡 <strong>Pro tip:</strong> Adding context helps the AI give you more specific, actionable feedback for your exact product and audience.
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
