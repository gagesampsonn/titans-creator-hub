import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

const BrandPortal = () => {
  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Hero */}
      <div className="bg-slate-950 pb-20 pt-10 border-b border-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <span className="text-orange-500 font-bold uppercase tracking-wider text-sm mb-6 block border border-orange-500/20 bg-orange-500/10 w-fit mx-auto px-4 py-1 rounded-full">For Brands & Sellers</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Get Your Product in Front of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-tiktok-pink">Top TikTok Creators</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop sending cold DMs. List your product on Titans Creator Hub and let hundreds of qualified creators apply to promote you.
          </p>
          <button onClick={() => document.getElementById('apply-form')?.scrollIntoView({behavior: 'smooth'})} className="bg-white text-slate-950 px-10 py-4 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-[0_0_25px_-5px_rgba(255,255,255,0.3)]">
            Apply to Feature Product
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Info Side */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
              <div className="space-y-10">
                {[
                  { title: "Submit Application", text: "Tell us about your product, budget, and target audience." },
                  { title: "Strategy Review", text: "Our team reviews your offer to ensure high conversion potential." },
                  { title: "Launch to Creators", text: "Your product goes live in the Hub. Creators request samples and start posting." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-orange-500 flex items-center justify-center font-bold text-lg shadow-lg">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-xl mb-2">{step.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="font-bold text-xl text-white mb-6">Placement Options</h3>
              <div className="space-y-4">
                <div className="p-5 border border-slate-800 rounded-xl bg-slate-950/50 hover:border-orange-500/30 transition-colors">
                  <div className="font-bold text-white mb-1">Featured Listing</div>
                  <p className="text-sm text-slate-500">Top of category + Homepage placement</p>
                </div>
                <div className="p-5 border border-slate-800 rounded-xl bg-slate-950/50 hover:border-orange-500/30 transition-colors">
                  <div className="font-bold text-white mb-1">Email Blast</div>
                  <p className="text-sm text-slate-500">Dedicated email to 5,000+ creators</p>
                </div>
                <div className="p-5 border border-slate-800 rounded-xl bg-slate-950/50 hover:border-orange-500/30 transition-colors">
                  <div className="font-bold text-white mb-1">Sample Management</div>
                  <p className="text-sm text-slate-500">We handle vetting and shipping logistics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div id="apply-form" className="bg-slate-900 p-8 md:p-10 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-orange-500 to-tiktok-pink rounded-t-3xl opacity-80"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Application Form</h2>
            <p className="text-slate-400 mb-8">Fill out the details below and our team will get back to you within 24 hours.</p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Brand Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" placeholder="e.g. Lumina Skin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Contact Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" placeholder="john@brand.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">TikTok Shop Product Link</label>
                <input type="url" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" placeholder="https://..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all">
                    <option>Beauty</option>
                    <option>Supplements</option>
                    <option>Fashion</option>
                    <option>Tech</option>
                    <option>Home/Lifestyle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Commission %</label>
                  <input type="number" className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" placeholder="20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes / Campaign Goals</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" placeholder="Tell us about your product USP and what kind of creators you're looking for..."></textarea>
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 mt-4">
                Submit Application <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortal;