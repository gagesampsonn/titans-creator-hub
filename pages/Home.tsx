import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShoppingBag, Zap, Check, TrendingUp, BarChart3, Video } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col bg-titan-bg overflow-hidden">
      {/* Hero Section - Cinematic */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-fuchsia/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(245,245,245,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(245,245,245,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-titan-surface border border-titan-border text-text-secondary text-xs font-medium tracking-wide mb-8">
              <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-pulse"></span>
              Now accepting creators
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-text-primary">The command center</span>
              <br />
              <span className="text-text-primary">for </span>
              <span className="text-gradient-teal">TikTok Shop</span>
            </h1>
            
            <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Access high-GMV products, request samples instantly, and get data-driven insights to scale your affiliate revenue.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto px-6 py-2.5 bg-text-primary hover:bg-white text-titan-bg font-semibold rounded text-sm transition-colors"
              >
                Get Started
              </Link>
              <Link 
                to="/products" 
                className="w-full sm:w-auto px-6 py-2.5 bg-titan-surface border border-titan-border text-text-primary font-medium rounded text-sm hover:bg-titan-elevated hover:border-titan-border-light transition-all flex items-center justify-center gap-2"
              >
                View Products
                <ArrowRight size={14} />
              </Link>
            </div>
            
            {/* Social Proof */}
            <div className="mt-14 flex items-center justify-center gap-8 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-semibold">5,000+</span>
                <span>Creators</span>
              </div>
              <div className="w-px h-4 bg-titan-border"></div>
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-semibold">$2.4M+</span>
                <span>GMV Generated</span>
              </div>
              <div className="w-px h-4 bg-titan-border hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-text-primary font-semibold">850+</span>
                <span>Brands</span>
              </div>
            </div>
          </div>
          
          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="glass-panel rounded-lg p-1 max-w-5xl mx-auto">
              <div className="bg-titan-bg rounded border border-titan-border overflow-hidden">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-titan-border bg-titan-surface">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-titan-border"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-titan-border"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-titan-border"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 bg-titan-elevated rounded px-3 flex items-center">
                      <span className="text-xs text-text-muted">titans.co/dashboard</span>
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="p-6 grid grid-cols-4 gap-4">
                  {/* Metric Cards */}
                  {[
                    { label: 'Weekly GMV', value: '$12,450', trend: '+24%', color: 'teal' },
                    { label: 'Commission', value: '$1,867', trend: '+18%', color: 'fuchsia' },
                    { label: 'Orders', value: '342', trend: '+32%', color: 'teal' },
                    { label: 'Conversion', value: '4.2%', trend: '+0.8%', color: 'fuchsia' },
                  ].map((metric, i) => (
                    <div key={i} className="bg-titan-surface rounded p-4 border border-titan-border relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-0.5 h-full ${metric.color === 'teal' ? 'bg-accent-teal' : 'bg-accent-fuchsia'}`}></div>
                      <p className="text-xs text-text-muted mb-1">{metric.label}</p>
                      <p className="text-xl font-bold text-text-primary">{metric.value}</p>
                      <p className={`text-xs mt-1 ${metric.color === 'teal' ? 'text-accent-teal' : 'text-accent-fuchsia'}`}>{metric.trend}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating Card */}
            <div className="absolute -left-4 bottom-24 glass-panel rounded p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-accent-teal/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-accent-teal" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">New viral product</p>
                  <p className="text-sm font-semibold text-text-primary">+340% GMV</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-titan-bg border-t border-titan-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-4">Built for performance</h2>
            <p className="text-text-secondary">Everything you need to find products, create content, and maximize your affiliate revenue.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                icon: Search, 
                title: "Product Discovery", 
                desc: "Filter by real-time GMV, commission rates, and trending niches. Find what's actually selling.",
                accent: 'teal'
              },
              { 
                icon: Video, 
                title: "Video Audit", 
                desc: "AI-powered analysis of your content. Get actionable feedback to improve conversion.",
                accent: 'fuchsia'
              },
              { 
                icon: BarChart3, 
                title: "Trend Pulse", 
                desc: "Real-time market intelligence. See what's trending before it peaks.",
                accent: 'teal'
              }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="group bg-titan-surface p-6 rounded border border-titan-border hover:border-titan-border-light transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded flex items-center justify-center mb-5 ${
                  feature.accent === 'teal' 
                    ? 'bg-accent-teal/10 text-accent-teal' 
                    : 'bg-accent-fuchsia/10 text-accent-fuchsia'
                }`}>
                  <feature.icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Column Section */}
      <section className="py-24 bg-titan-surface border-t border-titan-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Creators */}
            <div className="bg-titan-bg p-8 rounded border border-titan-border">
              <div className="flex items-center gap-2 text-accent-teal text-xs font-medium uppercase tracking-wider mb-4">
                <span className="w-1 h-1 bg-accent-teal rounded-full"></span>
                For Creators
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">Scale your affiliate income</h3>
              <p className="text-text-secondary mb-8 text-sm leading-relaxed">Access the same tools and data that top TikTok Shop affiliates use to generate six figures.</p>
              
              <ul className="space-y-3 mb-8">
                {['Exclusive high-ticket product offers', 'Fast-track sample approval', 'AI-generated hooks and scripts', 'Real-time performance analytics'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-primary text-sm">
                    <div className="w-4 h-4 rounded bg-accent-teal/10 flex items-center justify-center">
                      <Check size={10} className="text-accent-teal" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-medium text-accent-teal hover:text-text-primary transition-colors">
                Start creating
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* For Brands */}
            <div className="bg-titan-bg p-8 rounded border border-titan-border">
              <div className="flex items-center gap-2 text-accent-fuchsia text-xs font-medium uppercase tracking-wider mb-4">
                <span className="w-1 h-1 bg-accent-fuchsia rounded-full"></span>
                For Brands
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">Drive authentic sales</h3>
              <p className="text-text-secondary mb-8 text-sm leading-relaxed">Connect with vetted creators who understand your product and can drive real conversions.</p>
              
              <ul className="space-y-3 mb-8">
                {['Access to 5,000+ verified creators', 'Performance-based partnerships', 'Automated sample management', 'Full analytics dashboard'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-primary text-sm">
                    <div className="w-4 h-4 rounded bg-accent-fuchsia/10 flex items-center justify-center">
                      <Check size={10} className="text-accent-fuchsia" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link to="/brands" className="inline-flex items-center gap-2 text-sm font-medium text-accent-fuchsia hover:text-text-primary transition-colors">
                Partner with us
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-titan-bg border-t border-titan-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-text-primary tracking-tight mb-4">Ready to scale?</h2>
          <p className="text-text-secondary mb-8">Join thousands of creators already using Titans to grow their TikTok Shop revenue.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              to="/signup" 
              className="px-6 py-2.5 bg-text-primary hover:bg-white text-titan-bg font-semibold rounded text-sm transition-colors"
            >
              Get Started Free
            </Link>
            <Link 
              to="/products" 
              className="px-6 py-2.5 text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Browse Products →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
