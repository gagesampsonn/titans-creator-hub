import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Upload, Video, Link as LinkIcon, Play, CheckCircle, AlertTriangle, Loader2, Sparkles, History } from 'lucide-react';

interface AuditRecord {
  id: string;
  link?: string;
  fileName?: string;
  date: string;
  score: string;
}

const VideoAudit = () => {
  const [videoLink, setVideoLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([
    { id: '1', link: 'tiktok.com/@creator/video/7234...', date: '2 days ago', score: '78/100' },
    { id: '2', fileName: 'hook_test_v2.mp4', date: '5 days ago', score: '45/100' }
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
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
    if (!file && !videoLink) return;
    
    setIsAnalyzing(true);
    setResult(null);

    try {
      if (!process.env.API_KEY) {
         throw new Error("API Key not found.");
      }
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let promptParts: any[] = [];
      
      const systemPrompt = `
      You are a world-class TikTok Shop affiliate strategist and video auditor. 
      Your goal is to help the creator maximize GMV (Gross Merchandise Value) through viral, high-converting content.
      
      The user has uploaded a video or provided a link. Analyze the visual and audio content deeply.

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

      if (file) {
        const videoPart = await fileToGenerativePart(file);
        promptParts = [
          videoPart,
          { text: systemPrompt }
        ];
      } else {
         promptParts = [
           { text: `${systemPrompt}\n\nNOTE: The user only provided a link: ${videoLink}. I cannot watch external links directly. Please provide a general checklist for a viral TikTok Shop video based on the URL structure or remind the user to upload the video file for a real audit.` }
         ];
      }

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
        link: videoLink || undefined,
        fileName: file?.name,
        date: 'Just now',
        score: extractedScore + '/100'
      };
      setAuditHistory([newRecord, ...auditHistory]);

    } catch (error) {
      console.error(error);
      setResult("Error analyzing video. Please ensure the file is valid and try again.");
    } finally {
      setIsAnalyzing(false);
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

              {/* Link Input */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Or paste TikTok link
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input 
                    type="url" 
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://tiktok.com/@..." 
                    className="w-full pl-9 pr-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted"
                  />
                </div>
              </div>

              <button 
                onClick={handleAudit}
                disabled={isAnalyzing || (!file && !videoLink)}
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
