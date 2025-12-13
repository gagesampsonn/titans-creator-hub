import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

const BrandPortal = () => {
  return (
    <div className="bg-titan-bg min-h-screen">
      {/* Hero */}
      <div className="bg-titan-bg py-16 border-b border-titan-border relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent-fuchsia/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 text-accent-fuchsia text-[10px] font-semibold uppercase tracking-wider mb-4 px-2.5 py-1 rounded bg-accent-fuchsia/10 border border-accent-fuchsia/20">
            For Brands
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight tracking-tight">
            Get your product in front of
            <br />
            <span className="text-gradient-fuchsia">top TikTok creators</span>
          </h1>
          <p className="text-base text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
            List your product on Titans and let qualified creators apply to promote you. No cold outreach needed.
          </p>
          <button 
            onClick={() => document.getElementById('apply-form')?.scrollIntoView({behavior: 'smooth'})} 
            className="bg-text-primary hover:bg-white text-titan-bg px-6 py-2.5 rounded text-sm font-medium transition-colors"
          >
            Apply to List Product
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Info Side */}
          <div className="space-y-10">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-6">How it works</h2>
              <div className="space-y-6">
                {[
                  { title: "Submit Application", text: "Tell us about your product, budget, and target audience." },
                  { title: "Strategy Review", text: "Our team reviews your offer to ensure high conversion potential." },
                  { title: "Launch to Creators", text: "Your product goes live. Creators request samples and start posting." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded bg-accent-teal/10 text-accent-teal flex items-center justify-center font-semibold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary text-sm mb-1">{step.title}</h3>
                      <p className="text-sm text-text-muted leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-titan-surface p-6 rounded border border-titan-border">
              <h3 className="font-semibold text-sm text-text-primary mb-4">Placement Options</h3>
              <div className="space-y-3">
                {[
                  { title: "Featured Listing", desc: "Top of category + Homepage placement" },
                  { title: "Email Blast", desc: "Dedicated email to 5,000+ creators" },
                  { title: "Sample Management", desc: "We handle vetting and shipping logistics" }
                ].map((option, i) => (
                  <div key={i} className="p-3 border border-titan-border rounded bg-titan-bg hover:border-titan-border-light transition-colors">
                    <p className="font-medium text-text-primary text-sm">{option.title}</p>
                    <p className="text-xs text-text-muted">{option.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "5,000+", label: "Creators" },
                { value: "$2.4M+", label: "GMV Generated" },
                { value: "850+", label: "Brands" }
              ].map((stat, i) => (
                <div key={i} className="text-center p-4 bg-titan-surface rounded border border-titan-border">
                  <p className="text-lg font-semibold text-text-primary">{stat.value}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form Side */}
          <div id="apply-form" className="bg-titan-surface p-6 md:p-8 rounded border border-titan-border relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-teal to-accent-fuchsia rounded-t"></div>
            <h2 className="text-base font-semibold text-text-primary mb-1">Application Form</h2>
            <p className="text-sm text-text-muted mb-6">We'll get back to you within 24 hours.</p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Brand Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
                    placeholder="Your brand" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Contact Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
                    placeholder="you@brand.com" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Product Name</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
                  placeholder="Product to feature" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">TikTok Shop URL</label>
                <input 
                  type="url" 
                  className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
                  placeholder="https://tiktok.com/..." 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Commission Rate (%)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
                  placeholder="15" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Can you send samples?</label>
                <div className="flex gap-3">
                  {['Yes', 'No', 'Case-by-case'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                      <input type="radio" name="samples" className="hidden peer" />
                      <div className="w-4 h-4 rounded-full border border-titan-border bg-titan-bg peer-checked:border-accent-teal peer-checked:bg-accent-teal/20 transition-colors flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-teal opacity-0 peer-checked:opacity-100"></div>
                      </div>
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Additional Notes</label>
                <textarea 
                  rows={3} 
                  className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted resize-none" 
                  placeholder="Tell us about your campaign goals..."
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-text-primary hover:bg-white text-titan-bg font-medium py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2"
              >
                Submit Application
                <ArrowRight size={14} />
              </button>

              <p className="text-[10px] text-text-muted text-center">
                By submitting, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortal;
