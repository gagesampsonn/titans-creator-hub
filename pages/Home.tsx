import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShoppingBag, Zap, CheckCircle, TrendingUp } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col bg-[#0B0E14] overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14] to-[#121722] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161B26] border border-[#1F232D] text-slate-400 text-xs font-medium uppercase tracking-wide mb-8">
                Now accepting new creators
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.15] mb-8">
                <span className="text-[#F3F4F6] block">Find Products.</span>
                <span className="text-[#6BEAFB] block">Get Samples.</span>
                <span className="text-[#F97316] block">Get Paid.</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                The operating system for TikTok Shop affiliates. Access high-GMV offers, request samples instantly, and get the scripts you need to scale.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link to="/signup" className="w-full sm:w-auto px-8 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold rounded-full transition-all text-center">
                  Enter Creator Hub
                </Link>
                <button className="w-full sm:w-auto px-8 py-3.5 bg-[#121722] border border-[#1F232D] text-white font-medium rounded-full hover:bg-[#1F232D] transition-all flex items-center justify-center gap-2">
                  View Demo
                </button>
              </div>
              
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0E14] bg-slate-800 overflow-hidden">
                      <img src={`https://picsum.photos/32/32?random=${i}`} className="w-full h-full opacity-80" alt="" />
                    </div>
                  ))}
                </div>
                <p><span className="text-slate-300 font-medium">5,000+</span> creators joined</p>
              </div>
            </div>
            
            {/* Right Mockup - Minimal/Clean */}
            <div className="relative">
              <div className="relative rounded-xl bg-[#0F1219] border border-[#1F232D] p-6 shadow-2xl">
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#2D3342]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#2D3342]"></div>
                  </div>
                  <div className="h-2 w-20 bg-[#1F232D] rounded-full"></div>
                </div>

                {/* Mockup Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-[#161B26] rounded-lg p-4 border border-[#1F232D] hover:border-[#2D3342] transition-colors">
                      <div className="w-full aspect-[4/3] bg-[#0B0E14] rounded-md mb-3 relative overflow-hidden">
                        {/* Placeholder image abstract */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#1F232D] to-[#161B26]"></div>
                        {i === 1 && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-[10px] font-bold rounded">
                            VIRAL
                          </div>
                        )}
                      </div>
                      <div className="h-3 w-3/4 bg-[#2D3342] rounded mb-2"></div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#6BEAFB]/10 rounded text-[#6BEAFB] text-[10px] font-medium">
                          <TrendingUp size={10} />
                          <span>25% Comm.</span>
                        </div>
                        <div className="h-2 w-8 bg-[#2D3342] rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating Metric Card */}
                <div className="absolute -left-6 bottom-12 bg-[#161B26] border border-[#1F232D] p-4 rounded-xl shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                      <Zap size={18} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Weekly Earnings</div>
                      <div className="text-white font-bold text-lg">$2,450.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works - Minimal */}
      <section className="py-24 bg-[#0B0E14] border-t border-[#1F232D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">Streamlined Workflow</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">From discovery to commission in three steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Discover", desc: "Filter products by real-time GMV data and niche performance." },
              { icon: ShoppingBag, title: "Request", desc: "One-click sample requests sent directly to vetted brands." },
              { icon: Zap, title: "Earn", desc: "High-converting scripts and hooks to maximize your RPM." }
            ].map((step, idx) => (
              <div key={idx} className="bg-[#0F1219] p-8 rounded-xl border border-[#1F232D] hover:border-[#2D3342] transition-all">
                <div className="w-12 h-12 rounded-lg bg-[#161B26] flex items-center justify-center mb-6 text-white border border-[#1F232D]">
                  <step.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split Section - Clean */}
      <section className="py-24 bg-[#0F1219]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For Creators */}
            <div className="bg-[#0B0E14] p-10 rounded-2xl border border-[#1F232D]">
              <h3 className="text-2xl font-bold text-white mb-2">For Creators</h3>
              <p className="text-slate-400 mb-8">Access the tools top affiliates use to scale.</p>
              <ul className="space-y-4 mb-10">
                {['Exclusive high-ticket offers', 'Fast-track sample approval', 'Daily trend intelligence'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle className="text-[#6BEAFB] shrink-0 mt-0.5" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="text-white text-sm font-semibold border-b border-[#F97316] hover:text-[#F97316] transition-colors pb-0.5">
                Start Creating &rarr;
              </Link>
            </div>

            {/* For Brands */}
            <div className="bg-[#0B0E14] p-10 rounded-2xl border border-[#1F232D]">
              <h3 className="text-2xl font-bold text-white mb-2">For Brands</h3>
              <p className="text-slate-400 mb-8">Scale your TikTok Shop revenue with authentic UGC.</p>
              <ul className="space-y-4 mb-10">
                {['Access 5,000+ vetted creators', 'Performance-based marketing', 'Automated sample management'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                    <CheckCircle className="text-[#F97316] shrink-0 mt-0.5" size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/brands" className="text-white text-sm font-semibold border-b border-[#F97316] hover:text-[#F97316] transition-colors pb-0.5">
                Partner with Titans &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip - Minimal */}
      <section className="py-20 bg-[#0B0E14] border-t border-[#1F232D]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Ready to start?</h2>
          <Link to="/products" className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#EA580C] transition-colors">
            Browse Product Library <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;