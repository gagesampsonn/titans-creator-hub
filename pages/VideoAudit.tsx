import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Upload, Video, Link as LinkIcon, Play, CheckCircle, AlertTriangle, Loader2, Sparkles, History, ExternalLink } from 'lucide-react';

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

      ### 🚨 CRITICAL RULE: OPENING LINE CHECK
      You MUST listen to the first 3 seconds.
      1. **Statement vs. Question**: 
         - **WEAK**: Starts with a question (e.g., "Do you want clear skin?", "Have you ever...?"). **PENALTY**: Deduct 15-20 points from Hook Score.
         - **STRONG**: Starts with a bold statement/claim (e.g., "This fixed my acne in 3 days", "Stop using retinol"). **BONUS**: Boost Hook Score +10.

      ### 🔬 EVALUATION RUBRIC (Score 0-10 each)
      1. **Controversy / Pattern Interrupt**: Does the visual/audio break the scroll immediately? Is there shock value or tension?
      2. **Snappy Hook**: Is it fast? Does it promise a result? (Apply Opening Line Rule here).
      3. **Curiosity Gap**: Does it create "information tension" (e.g. "What you don't know is...")?
      4. **Target Audience Clarity**: Does it call out a specific avatar? (e.g. "If you're a busy mom...", "Gym bros, listen up").
      5. **Pain Point + Product**: Is the problem clear? Is the solution (product) integrated early?
      6. **Call-to-Action (CTA)**: Is it urgent and clear? ("Link in bio", "Grab the sample").
      7. **Pacing & Editing**: Is fluff removed? Is it fast and punchy?

      ### 📤 OUTPUT FORMAT (Markdown)
      
      # 🚀 Audit Results

      ## 🏆 Overall Score: [0-100] / 100
      **Success Probability:** [Percentage]% (Estimate based on hook & pacing)

      ---

      ### 📊 Category Breakdown
      *   **Hook (Opening):** [Score]/10 - [State CLEARLY: "You started with a Question/Statement". Give feedback.]
      *   **Pattern Interrupt:** [Score]/10 - [Brief analysis]
      *   **Curiosity Gap:** [Score]/10 - [Brief analysis]
      *   **Audience Clarity:** [Score]/10 - [Brief analysis]
      *   **Pain & Product:** [Score]/10 - [Brief analysis]
      *   **CTA Strength:** [Score]/10 - [Brief analysis]
      *   **Pacing & Editing:** [Score]/10 - [Brief analysis]

      ---

      ### 💡 Actionable Fixes (Brutal & Specific)
      *   [Fix 1]
      *   [Fix 2]
      *   [Fix 3]

      ### 📝 Summary
      [Brief encouraging summary]
      `;

      if (file) {
        const videoPart = await fileToGenerativePart(file);
        promptParts = [
          videoPart,
          { text: systemPrompt }
        ];
      } else {
         // Fallback if only link is provided
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

      // Extract a score if possible for the history (simple regex)
      const scoreMatch = responseText.match(/Overall Score:\s*(\d+)/i);
      const extractedScore = scoreMatch ? scoreMatch[1] : 'N/A';

      // Save to history
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
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-wide mb-4">
            <Sparkles size={14} />
            AI Powered Audit
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Rate My <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Creative</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload your TikTok video draft. Our AI analyzes your hook, pacing, and CTA to predict viral potential using the 7-Point GMV Matrix.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
              
              {/* File Upload */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Upload Video File <span className="text-orange-500">*Recommended</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${file ? 'border-tiktok-cyan/50 bg-tiktok-cyan/5' : 'border-slate-700 hover:border-slate-500 bg-slate-950'}`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*" 
                    className="hidden" 
                  />
                  
                  {file ? (
                    <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-lg">
                      <video src={previewUrl!} className="w-full h-full object-contain" controls />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors"
                      >
                        <Upload size={14} className="rotate-45" /> 
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                        <Video size={32} />
                      </div>
                      <p className="text-white font-medium mb-1">Click to upload video</p>
                      <p className="text-slate-500 text-xs">MP4, MOV up to 50MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Link Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  TikTok Link <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="url" 
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://tiktok.com/@..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600"
                  />
                </div>
              </div>

              <button 
                onClick={handleAudit}
                disabled={isAnalyzing || (!file && !videoLink)}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    Audit My Video
                  </>
                )}
              </button>
            </div>

            {/* History */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
               <div className="flex items-center gap-2 mb-4">
                 <History className="text-slate-400" size={18} />
                 <h3 className="font-bold text-white text-sm uppercase tracking-wide">Recent Audits</h3>
               </div>
               <div className="space-y-3">
                 {auditHistory.map(record => (
                   <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
                     <div className="flex flex-col">
                       <span className="text-sm font-medium text-white truncate max-w-[150px]">
                         {record.fileName || record.link || 'Video Audit'}
                       </span>
                       <span className="text-xs text-slate-500">{record.date}</span>
                     </div>
                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                       parseInt(record.score) >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                       parseInt(record.score) >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                       'bg-red-500/10 text-red-400 border border-red-500/20'
                     }`}>
                       {record.score}
                     </span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2 min-h-[500px]">
            {result ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden animate-fade-in">
                 <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-tiktok-cyan to-tiktok-pink"></div>
                 <div className="flex items-center gap-3 mb-6">
                   <CheckCircle className="text-green-400" size={24} />
                   <h2 className="text-2xl font-bold text-white">Audit Results</h2>
                 </div>
                 
                 <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-headings:font-bold prose-strong:text-orange-400 prose-ul:text-slate-300">
                   <ReactMarkdown>{result}</ReactMarkdown>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-800 bg-slate-950/30 rounded-lg p-4">
                   <div className="flex items-start gap-3">
                     <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                     <p className="text-sm text-slate-500 italic">
                       *AI analysis is based on standard TikTok virality metrics and standard affiliate marketing principles. Results may vary based on your specific niche and audience.
                     </p>
                   </div>
                 </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center text-slate-600 mb-6 relative">
                  <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl animate-pulse-slow"></div>
                  <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Audit</h3>
                <p className="text-slate-500 max-w-sm leading-relaxed mb-8">
                  Upload your video draft to receive a 7-point performance breakdown, hook score, and conversion probability estimate.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 max-w-md">
                   <div className="flex items-center gap-2 justify-center"><CheckCircle size={14} className="text-tiktok-cyan"/> Hook Analysis</div>
                   <div className="flex items-center gap-2 justify-center"><CheckCircle size={14} className="text-tiktok-cyan"/> CTA Strength</div>
                   <div className="flex items-center gap-2 justify-center"><CheckCircle size={14} className="text-tiktok-cyan"/> Pacing Check</div>
                   <div className="flex items-center gap-2 justify-center"><CheckCircle size={14} className="text-tiktok-cyan"/> Product Clarity</div>
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