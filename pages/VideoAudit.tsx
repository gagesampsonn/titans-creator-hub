import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Upload, Video, Link as LinkIcon, Play, CheckCircle, AlertTriangle, Loader2, Sparkles, History, AlertCircle, Radio, Copy, Download, Mail, Phone, Send, ChevronDown, BookOpen, Lightbulb } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { liveTemplates, templateCategories, LiveTemplate } from '../lib/liveTemplates';

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

// Tab type
type TabType = 'audit' | 'live';

const VideoAudit = () => {
  const { user, session, loading: authLoading } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('audit');
  
  // Debug log auth state
  React.useEffect(() => {
    console.log('[VideoAudit] Auth state:', { 
      hasUser: !!user, 
      userId: user?.id?.slice(0, 8),
      hasSession: !!session, 
      authLoading 
    });
  }, [user, session, authLoading]);
  
  // ═══════════════════════════════════════════════════════════════════════
  // VIDEO AUDIT STATE
  // ═══════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════
  // LIVE SCRIPT GENERATOR STATE
  // ═══════════════════════════════════════════════════════════════════════
  const [liveBrandName, setLiveBrandName] = useState('');
  const [liveProductName, setLiveProductName] = useState('');
  const [liveCategory, setLiveCategory] = useState('');
  const [liveAudience, setLiveAudience] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [liveKeyBenefit, setLiveKeyBenefit] = useState('');
  const [liveEmail, setLiveEmail] = useState('');
  const [livePhone, setLivePhone] = useState('');
  const [showEmailCapture, setShowEmailCapture] = useState(false); // Show email form after clicking generate
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [infographicData, setInfographicData] = useState<{ data: string; mimeType: string } | null>(null);
  const [infographicSuggestion, setInfographicSuggestion] = useState<{ title: string; steps: string[]; colors: string } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  
  // Template library state
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LiveTemplate | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('supplements');

  // Apply template to form
  const applyTemplate = (template: LiveTemplate) => {
    setSelectedTemplate(template);
    setLiveProductName(template.name);
    // Map template category to form category
    const categoryMap: Record<string, string> = {
      'supplements': 'supplements',
      'beauty': 'beauty',
      'grooming': 'cologne',
      'wellness': 'fitness',
      'household': 'home',
    };
    setLiveCategory(categoryMap[template.category] || '');
    setLiveKeyBenefit(template.infographicConcept);
    // Set description with authority words hint
    setLiveDescription(`Authority words: ${template.authorityWords.slice(0, 4).join(', ')}`);
    setShowTemplateLibrary(false);
  };

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

  // Product category options (shared)
  const productCategoryOptions = [
    { value: '', label: 'Select category...' },
    { value: 'supplements', label: 'Supplements & Wellness' },
    { value: 'beauty', label: 'Beauty & Skincare' },
    { value: 'cologne', label: 'Cologne & Fragrance' },
    { value: 'tech', label: 'Tech & Gadgets' },
    { value: 'fitness', label: 'Fitness & Health' },
    { value: 'home', label: 'Home & Kitchen' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'pets', label: 'Pets' },
    { value: 'baby', label: 'Baby & Kids' },
    { value: 'other', label: 'Other' },
  ];

  // Target audience options for LIVE script
  const audienceOptions = [
    { value: '', label: 'Select target audience...' },
    { value: 'men_18_24', label: 'Men 18-24' },
    { value: 'men_25_34', label: 'Men 25-34' },
    { value: 'men_35_44', label: 'Men 35-44' },
    { value: 'men_45_54', label: 'Men 45-54' },
    { value: 'men_55_plus', label: 'Men 55+' },
    { value: 'women_18_24', label: 'Women 18-24' },
    { value: 'women_25_34', label: 'Women 25-34' },
    { value: 'women_35_44', label: 'Women 35-44' },
    { value: 'women_45_54', label: 'Women 45-54' },
    { value: 'women_55_plus', label: 'Women 55+' },
    { value: 'all', label: 'All Audiences' },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // VIDEO AUDIT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTiktokUrl(value);
    
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

  const handleUrlBlur = () => {
    setUrlTouched(true);
    if (tiktokUrl.trim() && !isValidTikTokUrl(tiktokUrl)) {
      setUrlError('Please enter a valid TikTok URL (tiktok.com or vm.tiktok.com)');
    } else {
      setUrlError(null);
    }
  };

  const canAnalyze = !!file;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
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

  const handleAudit = async () => {
    if (!canAnalyze) return;
    
    setIsAnalyzing(true);
    setResult(null);

    if (!file && tiktokUrl.trim() && isValidTikTokUrl(tiktokUrl)) {
      try {
        console.log('[VideoAudit] Using server-side URL analysis for:', tiktokUrl);
        
        let accessToken = session?.access_token;
        
        if (!accessToken) {
          const { data } = await supabase.auth.getSession();
          accessToken = data.session?.access_token;
        }
        
        if (!accessToken) {
          setResult("## Please Log In\n\nTo analyze TikTok URLs, please log in to your account first.\n\n[Log In](#/login)");
          setIsAnalyzing(false);
          return;
        }

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

        const data = await response.json();

        if (!response.ok || !data.success) {
          setResult(`## Analysis Failed\n\n${data.error || "Failed to analyze video. Please try again."}`);
          setIsAnalyzing(false);
          return;
        }

        setResult(data.feedback);

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
        setResult(`## Error\n\nFailed to analyze TikTok URL. Please try again.`);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    if (file) {
      try {
        if (!process.env.API_KEY) {
          throw new Error("API Key not found. Please configure VITE_GEMINI_API_KEY.");
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
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
        setResult(`## Error\n\nFailed to analyze video file. Please ensure the file is valid and try again.`);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // LIVE SCRIPT GENERATOR HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  const productInfoComplete = liveProductName.trim() && liveCategory && liveAudience;
  const [pendingScript, setPendingScript] = useState<string | null>(null); // Script waiting for email unlock
  const [scriptUnlocked, setScriptUnlocked] = useState(false); // Whether email was submitted

  // First click: Generate script (will be gated if not logged in)
  const handleGenerateScript = async () => {
    if (!productInfoComplete) return;
    
    setIsGeneratingScript(true);
    setGeneratedScript(null);
    setPendingScript(null);
    setScriptUnlocked(false);
    setShowEmailCapture(false);
    setInfographicData(null);
    setInfographicSuggestion(null);

    try {
      // Get access token if logged in
      let accessToken: string | undefined;
      if (session?.access_token) {
        accessToken = session.access_token;
      } else {
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token;
      }

      // For non-logged-in users, we generate without email first (just to get the script)
      // We'll send email later when they unlock
      const response = await fetch('/api/live/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          action: 'script',
          brandName: liveBrandName.trim() || undefined,
          productName: liveProductName.trim(),
          category: liveCategory,
          targetAudience: liveAudience,
          productDescription: liveDescription.trim() || undefined,
          keyBenefit: liveKeyBenefit.trim() || undefined,
          // Pass template data if selected
          template: selectedTemplate ? {
            authorityWords: selectedTemplate.authorityWords,
            coreAngles: selectedTemplate.coreAngles,
            demoIdeas: selectedTemplate.demoIdeas,
            infographicPrompt: selectedTemplate.infographicPrompt,
          } : undefined,
          // Only include email if user is logged in (logged in users don't need gate)
          email: user ? undefined : 'pending@unlock.temp', // Placeholder to pass validation
          phone: undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setGeneratedScript(`## Error\n\n${data.error || "Failed to generate script. Please try again."}`);
        setIsGeneratingScript(false);
        return;
      }

      // If user is logged in, show script directly
      if (user) {
        setGeneratedScript(data.script);
        setScriptUnlocked(true);
      } else {
        // If not logged in, store script but show email gate
        setPendingScript(data.script);
        setShowEmailCapture(true);
      }

      // Generate infographic in background
      generateInfographic();

    } catch (error) {
      console.error('[LiveScript] Generation error:', error);
      setGeneratedScript(`## Error\n\nFailed to generate script. Please try again.`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Second step: Unlock script with email
  const handleUnlockScript = async () => {
    if (!liveEmail.trim() || !pendingScript) return;

    // Save lead and send email via API
    try {
      await fetch('/api/live/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-lead',
          email: liveEmail.trim(),
          phone: livePhone.trim() || undefined,
          productName: liveProductName.trim(),
          category: liveCategory,
          targetAudience: liveAudience,
          script: pendingScript,
        }),
      });
    } catch (error) {
      console.error('[LiveScript] Lead save error:', error);
    }

    // Reveal the script
    setGeneratedScript(pendingScript);
    setPendingScript(null);
    setScriptUnlocked(true);
    setShowEmailCapture(false);
  };

  const generateInfographic = async () => {
    setIsGeneratingImage(true);
    
    try {
      const response = await fetch('/api/live/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'infographic',
          brandName: liveBrandName.trim() || undefined,
          productName: liveProductName.trim(),
          category: liveCategory,
          keyBenefit: liveKeyBenefit.trim() || undefined,
          // Pass template's custom infographic prompt if selected
          infographicPrompt: selectedTemplate?.infographicPrompt || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.hasImage && data.image) {
          setInfographicData(data.image);
        } else if (data.suggestion) {
          setInfographicSuggestion(data.suggestion);
        }
      }
    } catch (error) {
      console.error('[Infographic] Generation error:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyScript = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
    }
  };

  const handleDownloadInfographic = () => {
    if (infographicData) {
      const link = document.createElement('a');
      link.href = `data:${infographicData.mimeType};base64,${infographicData.data}`;
      link.download = `live-background-${liveProductName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      link.click();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-titan-bg py-8 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent-fuchsia/10 border border-accent-fuchsia/20 text-accent-fuchsia text-[10px] font-semibold uppercase tracking-wider mb-3">
            <Sparkles size={10} />
            AI Powered
          </div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight">Creator Tools</h1>
          <p className="text-sm text-text-muted">AI-powered tools to maximize your TikTok Shop success</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-titan-surface rounded-lg p-1 border border-titan-border w-fit">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-text-primary text-titan-bg'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Video size={14} />
            Video Audit
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'live'
                ? 'bg-accent-fuchsia text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Radio size={14} />
            LIVE Script Generator
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* VIDEO AUDIT TAB */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'audit' && (
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
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* LIVE SCRIPT GENERATOR TAB */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-1 space-y-4">
              
              {/* Template Library Panel */}
              <div className="bg-titan-surface rounded border border-titan-border overflow-hidden">
                <button
                  onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}
                  className="w-full p-4 flex items-center justify-between hover:bg-titan-elevated transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-accent-fuchsia" />
                    <span className="text-sm font-semibold text-text-primary">Product Templates</span>
                    <span className="px-2 py-0.5 bg-accent-fuchsia/10 text-accent-fuchsia text-[10px] font-semibold rounded-full">
                      {liveTemplates.length}
                    </span>
                  </div>
                  <ChevronDown size={16} className={`text-text-muted transition-transform ${showTemplateLibrary ? 'rotate-180' : ''}`} />
                </button>
                
                {showTemplateLibrary && (
                  <div className="border-t border-titan-border max-h-[400px] overflow-y-auto">
                    {templateCategories.map(cat => (
                      <div key={cat.value} className="border-b border-titan-border last:border-b-0">
                        <button
                          onClick={() => setExpandedCategory(expandedCategory === cat.value ? null : cat.value)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-titan-bg hover:bg-titan-elevated transition-colors"
                        >
                          <span className="text-xs font-medium text-text-secondary">{cat.label}</span>
                          <ChevronDown size={12} className={`text-text-muted transition-transform ${expandedCategory === cat.value ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedCategory === cat.value && (
                          <div className="px-2 py-2 space-y-1 bg-titan-surface">
                            {liveTemplates.filter(t => t.category === cat.value).map(template => (
                              <button
                                key={template.id}
                                onClick={() => applyTemplate(template)}
                                className={`w-full text-left p-3 rounded border transition-all ${
                                  selectedTemplate?.id === template.id
                                    ? 'bg-accent-fuchsia/10 border-accent-fuchsia/30'
                                    : 'bg-titan-bg border-titan-border hover:border-titan-border-light'
                                }`}
                              >
                                <p className="text-xs font-medium text-text-primary mb-1">{template.name}</p>
                                <p className="text-[10px] text-text-muted line-clamp-1">
                                  {template.authorityWords.slice(0, 3).join(' • ')}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-titan-surface rounded border border-titan-border p-5">
                
                {/* Header */}
                <div className="mb-5 pb-4 border-b border-titan-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Radio className="text-accent-fuchsia" size={16} />
                    <h3 className="text-sm font-semibold text-text-primary">LIVE Script Generator</h3>
                  </div>
                  <p className="text-xs text-text-muted">
                    Generate talking points for your TikTok LIVE stream. Works for any product!
                  </p>
                </div>

                {/* Brand Name */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Brand Name <span className="text-text-muted">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={liveBrandName}
                    onChange={(e) => setLiveBrandName(e.target.value)}
                    placeholder="e.g., Beast Bites, Goli, Tom Ford" 
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted"
                  />
                </div>

                {/* Product Type */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Product Type <span className="text-accent-fuchsia">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={liveProductName}
                    onChange={(e) => setLiveProductName(e.target.value)}
                    placeholder="e.g., Creatine, Ashwagandha, Cologne, Pre-workout" 
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted"
                  />
                  <p className="text-[10px] text-text-muted mt-1">AI will research what this product does</p>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Product Category <span className="text-accent-fuchsia">*</span>
                  </label>
                  <select
                    value={liveCategory}
                    onChange={(e) => setLiveCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors"
                  >
                    {productCategoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-titan-surface">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Target Audience <span className="text-accent-fuchsia">*</span>
                  </label>
                  <select
                    value={liveAudience}
                    onChange={(e) => setLiveAudience(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors"
                  >
                    {audienceOptions.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-titan-surface">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Extra Notes */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    Extra Notes <span className="text-text-muted">(Optional)</span>
                  </label>
                  <textarea 
                    value={liveDescription}
                    onChange={(e) => setLiveDescription(e.target.value)}
                    placeholder="Any specific details about THIS product (e.g., 60 gummies per bottle, tastes like candy, etc.)"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted resize-none"
                  />
                </div>

                {/* Image Description (Optional) */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    What should the infographic show? <span className="text-text-muted">(Optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={liveKeyBenefit}
                    onChange={(e) => setLiveKeyBenefit(e.target.value)}
                    placeholder="e.g., How ingredients absorb, Blood flow diagram, Scent layers" 
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted"
                  />
                </div>

                {/* Selected Template Guidance */}
                {selectedTemplate && (
                  <div className="mb-4 p-3 bg-accent-fuchsia/5 border border-accent-fuchsia/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={12} className="text-accent-fuchsia" />
                      <p className="text-xs font-medium text-accent-fuchsia">Template: {selectedTemplate.name}</p>
                    </div>
                    
                    {/* Authority Words */}
                    <div className="mb-2">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Authority Words</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.authorityWords.map((word, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-titan-bg border border-titan-border rounded text-[10px] text-text-secondary">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Demo Ideas */}
                    <div className="mb-2">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Demo Ideas</p>
                      <ul className="space-y-0.5">
                        {selectedTemplate.demoIdeas.map((idea, i) => (
                          <li key={i} className="text-[10px] text-text-secondary flex items-start gap-1">
                            <span className="text-accent-teal">•</span> {idea}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Core Angles */}
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Core Angles</p>
                      <p className="text-[10px] text-text-secondary">{selectedTemplate.coreAngles.join(' • ')}</p>
                    </div>

                    <button
                      onClick={() => setSelectedTemplate(null)}
                      className="mt-2 text-[10px] text-text-muted hover:text-text-secondary"
                    >
                      Clear template
                    </button>
                  </div>
                )}

                {/* Generate Button - Only shows if script not yet generated */}
                {!pendingScript && !generatedScript && (
                  <button 
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript || !productInfoComplete}
                    className="w-full bg-accent-fuchsia hover:bg-accent-fuchsia/90 text-white font-medium py-2.5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate LIVE Script
                      </>
                    )}
                  </button>
                )}

                {/* Email Gate - Shows AFTER script is generated for non-logged-in users */}
                {!user && pendingScript && showEmailCapture && (
                  <div className="p-4 bg-accent-fuchsia/5 border border-accent-fuchsia/20 rounded animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={14} className="text-accent-teal" />
                      <p className="text-xs text-accent-teal font-medium">
                        Your script is ready!
                      </p>
                    </div>
                    <p className="text-xs text-text-muted mb-3">
                      Enter your email to unlock it. We'll also send you a copy:
                    </p>
                    <div className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input 
                          type="email" 
                          value={liveEmail}
                          onChange={(e) => setLiveEmail(e.target.value)}
                          placeholder="your@email.com" 
                          className="w-full pl-9 pr-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted"
                          autoFocus
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                        <input 
                          type="tel" 
                          value={livePhone}
                          onChange={(e) => setLivePhone(e.target.value)}
                          placeholder="Phone (optional - for SMS reminder)" 
                          className="w-full pl-9 pr-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted"
                        />
                      </div>
                      <button 
                        onClick={handleUnlockScript}
                        disabled={!liveEmail.trim()}
                        className="w-full bg-accent-teal hover:bg-accent-teal/90 text-titan-bg font-medium py-2.5 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <Send size={14} />
                        Unlock My Script
                      </button>
                    </div>
                  </div>
                )}

                {/* Generate Another Button - Shows after script is unlocked */}
                {(generatedScript && scriptUnlocked) && (
                  <button 
                    onClick={() => {
                      setGeneratedScript(null);
                      setPendingScript(null);
                      setScriptUnlocked(false);
                      setShowEmailCapture(false);
                      setInfographicData(null);
                      setInfographicSuggestion(null);
                    }}
                    className="w-full bg-titan-bg hover:bg-titan-elevated border border-titan-border text-text-primary font-medium py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    Generate Another Script
                  </button>
                )}

                {!user && !showEmailCapture && !generatedScript && (
                  <p className="text-[10px] text-text-muted text-center mt-3">
                    Already have an account?{' '}
                    <a href="#/login" className="text-accent-fuchsia hover:underline">Log in</a>
                  </p>
                )}

              </div>

              {/* Tips Card */}
              <div className="bg-titan-surface rounded border border-titan-border p-5">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">
                  LIVE Stream Tips
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-accent-teal mt-0.5 shrink-0" />
                    <p className="text-xs text-text-muted">Read the script naturally - don't sound robotic</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-accent-teal mt-0.5 shrink-0" />
                    <p className="text-xs text-text-muted">Repeat urgency and CTA every 2-3 minutes</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-accent-teal mt-0.5 shrink-0" />
                    <p className="text-xs text-text-muted">Use the infographic as your LIVE background</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle size={12} className="text-accent-teal mt-0.5 shrink-0" />
                    <p className="text-xs text-text-muted">Engage with comments while staying on script</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Script Result */}
              {generatedScript ? (
                <div className="bg-titan-surface rounded border border-titan-border p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-fuchsia to-accent-teal"></div>
                  
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="text-accent-teal" size={16} />
                      <h2 className="text-sm font-semibold text-text-primary">Your LIVE Script</h2>
                    </div>
                    <button
                      onClick={handleCopyScript}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-titan-bg border border-titan-border rounded text-xs text-text-secondary hover:text-text-primary hover:border-titan-border-light transition-colors"
                    >
                      {scriptCopied ? (
                        <>
                          <CheckCircle size={12} className="text-accent-teal" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy Script
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown
                      components={{
                        h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-text-primary mt-4 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-accent-fuchsia mt-4 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="text-text-secondary text-sm leading-relaxed mb-3" {...props} />,
                        li: ({node, ...props}) => <li className="text-text-secondary text-sm mb-1.5" {...props} />,
                        strong: ({node, ...props}) => <span className="text-text-primary font-semibold" {...props} />,
                        hr: ({node, ...props}) => <hr className="border-titan-border my-4" {...props} />,
                      }}
                    >
                      {generatedScript}
                    </ReactMarkdown>
                  </div>

                  {!user && liveEmail && (
                    <div className="mt-6 pt-4 border-t border-titan-border">
                      <div className="flex items-center gap-2 text-accent-teal">
                        <Send size={12} />
                        <p className="text-xs">
                          Script sent to <strong>{liveEmail}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[300px] bg-titan-surface rounded border border-titan-border border-dashed flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 bg-titan-elevated rounded flex items-center justify-center text-text-muted mb-4">
                    <Radio size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">Ready to Generate</h3>
                  <p className="text-sm text-text-muted max-w-xs mb-6">
                    Fill out the form to get a customized LIVE selling script for your product
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={10} className="text-accent-fuchsia" />
                      8th Grade Level
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={10} className="text-accent-fuchsia" />
                      Authority Words
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={10} className="text-accent-fuchsia" />
                      Urgency Triggers
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={10} className="text-accent-fuchsia" />
                      Strong CTAs
                    </div>
                  </div>
                </div>
              )}

              {/* Infographic Result */}
              {(isGeneratingImage || infographicData || infographicSuggestion) && (
                <div className="bg-titan-surface rounded border border-titan-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-accent-teal" size={16} />
                      <h3 className="text-sm font-semibold text-text-primary">LIVE Background</h3>
                    </div>
                    {infographicData && (
                      <button
                        onClick={handleDownloadInfographic}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-teal text-titan-bg rounded text-xs font-medium hover:bg-accent-teal/90 transition-colors"
                      >
                        <Download size={12} />
                        Download
                      </button>
                    )}
                  </div>

                  {isGeneratingImage && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin text-accent-fuchsia" size={24} />
                      <span className="ml-3 text-sm text-text-muted">Generating infographic...</span>
                    </div>
                  )}

                  {infographicData && (
                    <div className="rounded overflow-hidden border border-titan-border">
                      <img 
                        src={`data:${infographicData.mimeType};base64,${infographicData.data}`}
                        alt="LIVE Stream Background"
                        className="w-full"
                      />
                    </div>
                  )}

                  {infographicSuggestion && !infographicData && !isGeneratingImage && (
                    <div className="bg-titan-bg rounded border border-titan-border p-4">
                      <p className="text-xs text-text-muted mb-3">
                        Image generation is temporarily unavailable. Here's a guide to create your own:
                      </p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-text-primary">{infographicSuggestion.title}</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {infographicSuggestion.steps.map((step, i) => (
                            <li key={i} className="text-xs text-text-secondary">{step}</li>
                          ))}
                        </ol>
                        <p className="text-xs text-accent-teal mt-2">Colors: {infographicSuggestion.colors}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-text-muted mt-3">
                    Use this as your LIVE stream background. The clean design won't distract from you or your product.
                  </p>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default VideoAudit;
