import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, TrendingUp, BarChart3, Video, ChevronLeft, ChevronRight, Quote, Gift, Zap, Package, Clock, ShieldCheck, Users, ExternalLink, Trophy } from 'lucide-react';

// Testimonials data
const TESTIMONIALS = [
  {
    name: "Levi",
    role: "Top Live Seller",
    headline: "From New Creator to Top Live Seller",
    quote: "Titans showed me exactly how to go live and sell. Once I followed the game plan, my lives stopped being random — every session had a purpose and the sales started stacking.",
    stat: "350k+ GMV across all accounts • Top live seller for a 15-day cleanse campaign",
    accent: "teal"
  },
  {
    name: "Chris",
    role: "Creator Coach",
    headline: "Went From 0 TikTok Experience to Coaching Creators",
    quote: "I joined Titans with zero TikTok experience. Within my first 3 days, I was already seeing results. Now I coach inside the community and help other members do the same thing.",
    stat: "From complete beginner → profitable in 3 days → Titans coach",
    accent: "fuchsia"
  },
  {
    name: "Mark",
    role: "Affiliate Creator",
    headline: "Hit His First $1K Week… Then Passed $120K GMV",
    quote: "I set a goal for my first $1k week on Titans and just locked in. The community kept me motivated and the assignments gave me a clear path. That turned into over $120K GMV and completely changed how I look at content.",
    stat: "$120k+ GMV • First $1k/week on TikTok Shop",
    accent: "teal"
  },
  {
    name: "Gabby",
    role: "Consistency Machine",
    headline: "Proved What Consistency on TikTok Shop Really Looks Like",
    quote: "Since joining Titans, I've stayed consistent with the assignments, showed up for every brand, and never missed posts. That consistency is exactly why my deals and results keep growing.",
    stat: "Multiple brand deals • Ongoing growth from strict consistency",
    accent: "fuchsia"
  },
  {
    name: "DigitallyHer",
    role: "Top Performer",
    headline: "Turned Long-Term Effort Into 960K GMV",
    quote: "I've been with Titans for a long time, and staying locked in has paid off. Every day I show up for brands, follow the plan, and my GMV keeps climbing. Titans keeps me focused on the right moves.",
    stat: "960k GMV on TikTok Shop",
    accent: "teal"
  },
  {
    name: "GoatAB",
    role: "High Performer",
    headline: "$50,000+ Profit in 3 Days",
    quote: "Showing up every single day is what changed everything. Titans gave me the blueprint, but it was about putting in reps. Three days of the right strategy turned into over $50,000 profit.",
    stat: "$50k+ profit in 3 days • Daily assignments + execution",
    accent: "fuchsia"
  },
  {
    name: "Brittany",
    role: "Brand Partner",
    headline: "Closed Huge Brand Deals With Titans Support",
    quote: "Titans has been my backbone for the last 8 months. The assignments, coaching, and accountability helped me land huge deals I never thought I'd touch as a creator.",
    stat: "$171,941+ Affiliate GMV • 5,305 affiliate orders",
    accent: "teal"
  },
  {
    name: "Krystal Kanarii",
    role: "Viral Creator",
    headline: "From Discouraged Creator to 'Printing' With TikTok Shop",
    quote: "I posted my first TikTok Shop video and it didn't sell. I was discouraged but didn't quit. Finding Titans changed everything. The daily assignments made my videos start to print. I've hit multiple virals, closed brand deals, and finally feel like I'm living up to my potential.",
    stat: "Why Not Natural brand deal • Multiple viral videos • Consistent GMV growth",
    accent: "fuchsia"
  },
  {
    name: "Beau",
    role: "Side Hustle Success",
    headline: "Used Titans to Turn a Side Hustle Into Real Opportunities",
    quote: "I joined Titans just wanting to make a little money on the side. A year later I'm still posting, growing, and now I'm getting packages from brands like YSL. TikTok Shop gave me options I never thought were possible, and Titans gave me the roadmap.",
    stat: "1+ year consistent posting • Brand gifts from YSL & more",
    accent: "teal"
  }
];

// Check if mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const isMobile = useIsMobile();

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <div className="flex flex-col bg-titan-bg overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-16 md:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-fuchsia/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(245,245,245,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(245,245,245,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* FOMO Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] sm:text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
              Limited creator slots open this week
            </div>

            {/* Urgency Line */}
            <p className="text-sm text-accent-teal font-medium mb-4">
              Creators inside are requesting samples in under 60 seconds
            </p>
            
            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.15] mb-4 sm:mb-6">
              <span className="text-text-primary">The command center</span>
              <br />
              <span className="text-text-primary">for </span>
              <span className="text-gradient-teal">TikTok Shop</span>
            </h1>
            
            {/* Outcome-Focused Subtext */}
            <p className="text-base sm:text-lg text-text-secondary mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Get products shipped to you, promote viral items, and earn commission — all from one dashboard.
            </p>
            
            {/* Primary CTA */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <Link 
                to="/samples" 
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl text-base transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
              >
                <Gift size={18} />
                Get Free Samples
              </Link>
              <p className="text-sm text-text-muted">
                Already have an account? <Link to="/login" className="text-accent-teal hover:text-text-primary font-medium underline underline-offset-2">Log in</Link>
              </p>
            </div>

            {/* Proof Strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-muted mb-16">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-accent-teal" />
                <span>Free to join</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-accent-teal" />
                <span>Access in 30 seconds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package size={14} className="text-accent-teal" />
                <span>Products ship to you</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-accent-teal" />
                <span>3,600+ creators</span>
              </div>
            </div>

            {/* Phone Mockups with Embedded Videos */}
            <div className="mb-10">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-6">Real creators using products from inside the platform</p>
              <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-6">
                {/* Phone 1 */}
                <div className="hidden sm:block w-[100px] sm:w-[130px] md:w-[150px] lg:w-[170px]">
                  <div className="relative bg-titan-elevated rounded-[20px] md:rounded-[26px] p-[3px] border border-titan-border shadow-card">
                    <div className="relative bg-titan-bg rounded-[18px] md:rounded-[24px] overflow-hidden" style={{ aspectRatio: '9/16' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-4 md:h-5 bg-titan-elevated rounded-b-xl z-10"></div>
                      <div className="absolute inset-0 pointer-events-none">
                        <iframe
                          loading="lazy"
                          src="https://www.youtube-nocookie.com/embed/957v74a3QJM?autoplay=1&mute=1&loop=1&playlist=957v74a3QJM&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&playsinline=1&iv_load_policy=3&fs=0"
                          allow="autoplay; encrypted-media"
                          title="Creator Video 1"
                          className="w-full h-full border-0 scale-[1.2]"
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Phone 2 - Center */}
                <div className="w-[160px] sm:w-[150px] md:w-[170px] lg:w-[190px]">
                  <div className="relative bg-titan-elevated rounded-[26px] md:rounded-[32px] p-[3px] border border-accent-teal/30 shadow-glow-teal">
                    <div className="relative bg-titan-bg rounded-[24px] md:rounded-[30px] overflow-hidden" style={{ aspectRatio: '9/16' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-5 md:h-6 bg-titan-elevated rounded-b-xl z-10"></div>
                      <div className="absolute inset-0 pointer-events-none">
                        <iframe
                          loading="lazy"
                          src="https://www.youtube-nocookie.com/embed/nkZJpMzvb3Q?autoplay=1&mute=1&loop=1&playlist=nkZJpMzvb3Q&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&playsinline=1&iv_load_policy=3&fs=0"
                          allow="autoplay; encrypted-media"
                          title="Creator Video 2"
                          className="w-full h-full border-0 scale-[1.2]"
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Phone 3 */}
                <div className="hidden sm:block w-[100px] sm:w-[130px] md:w-[150px] lg:w-[170px]">
                  <div className="relative bg-titan-elevated rounded-[20px] md:rounded-[26px] p-[3px] border border-titan-border shadow-card">
                    <div className="relative bg-titan-bg rounded-[18px] md:rounded-[24px] overflow-hidden" style={{ aspectRatio: '9/16' }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-4 md:h-5 bg-titan-elevated rounded-b-xl z-10"></div>
                      <div className="absolute inset-0 pointer-events-none">
                        <iframe
                          loading="lazy"
                          src="https://www.youtube-nocookie.com/embed/5QVxzXW1ZAw?autoplay=1&mute=1&loop=1&playlist=5QVxzXW1ZAw&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&playsinline=1&iv_load_policy=3&fs=0"
                          allow="autoplay; encrypted-media"
                          title="Creator Video 3"
                          className="w-full h-full border-0 scale-[1.2]"
                          style={{ pointerEvents: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Section CTA */}
            <Link 
              to="/samples" 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-titan-surface border border-titan-border text-text-primary font-medium rounded-lg text-sm hover:bg-titan-elevated hover:border-accent-teal/30 transition-all"
            >
              Get Access to These Products
              <ArrowRight size={14} />
            </Link>
            
            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-x-8 sm:gap-y-4 text-xs sm:text-sm text-text-muted">
              <div className="flex items-center gap-2 justify-center">
                <span className="text-text-primary font-semibold">$5.2M+</span>
                <span>GMV</span>
              </div>
              <div className="w-px h-4 bg-titan-border hidden sm:block"></div>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-text-primary font-semibold">3,600</span>
                <span>Creators</span>
              </div>
              <div className="w-px h-4 bg-titan-border hidden sm:block"></div>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-text-primary font-semibold">60+</span>
                <span>Brands</span>
              </div>
              <div className="w-px h-4 bg-titan-border hidden md:block"></div>
              <div className="flex items-center gap-2 justify-center">
                <span className="text-text-primary font-semibold">78K</span>
                <span>Videos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Section */}
      <section className="py-16 sm:py-20 bg-titan-surface border-t border-titan-border">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">Start earning in 3 steps</h2>
            <p className="text-text-secondary text-sm">No applications. No approval delays. Start immediately.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '1', icon: Users, title: 'Create account', desc: 'Sign up free in 30 seconds. No credit card required.', color: 'teal' },
              { step: '2', icon: Package, title: 'Pick products', desc: 'Browse high-GMV products and request free samples.', color: 'fuchsia' },
              { step: '3', icon: Video, title: 'Post & earn', desc: 'Create content, post with your link, and earn commission.', color: 'teal' },
            ].map((item) => (
              <div key={item.step} className="relative text-center p-6">
                {/* Step number */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                  item.color === 'teal' ? 'bg-accent-teal/10' : 'bg-accent-fuchsia/10'
                }`}>
                  <item.icon size={22} className={item.color === 'teal' ? 'text-accent-teal' : 'text-accent-fuchsia'} />
                </div>
                <div className={`text-xs font-bold mb-2 ${
                  item.color === 'teal' ? 'text-accent-teal' : 'text-accent-fuchsia'
                }`}>STEP {item.step}</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div className="text-center mt-10">
            <Link 
              to="/samples" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20"
            >
              <Gift size={16} />
              Request Your First Sample
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-titan-bg border-t border-titan-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">Everything you need to earn</h2>
            <p className="text-text-secondary text-sm">Products, tools, and data — all in one place.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                icon: Package, 
                title: "Free Product Samples", 
                desc: "Request samples from top brands. Products ship direct to you. Promote what you love.",
                accent: 'teal'
              },
              { 
                icon: Video, 
                title: "Video Audit", 
                desc: "AI-powered feedback on your content. Know exactly what to fix to get more sales.",
                accent: 'fuchsia'
              },
              { 
                icon: BarChart3, 
                title: "Creator Dashboard", 
                desc: "Track your GMV, commissions, and performance. See what's working in real time.",
                accent: 'teal'
              },
              { 
                icon: Trophy, 
                title: "Top Videos Billboard", 
                desc: "See the top 20 videos of 2026. An exclusive honor for the highest-performing creators.",
                accent: 'yellow',
                link: '/top-videos'
              }
            ].map((feature, idx) => {
              const Component = feature.link ? Link : 'div';
              const props = feature.link ? { to: feature.link, className: 'group bg-titan-surface p-6 rounded border border-titan-border hover:border-titan-border-light transition-all duration-300 cursor-pointer' } : { className: 'group bg-titan-surface p-6 rounded border border-titan-border hover:border-titan-border-light transition-all duration-300' };
              
              return (
                <Component key={idx} {...props}>
                  <div className={`w-10 h-10 rounded flex items-center justify-center mb-5 ${
                    feature.accent === 'teal' 
                      ? 'bg-accent-teal/10 text-accent-teal' 
                      : feature.accent === 'fuchsia'
                      ? 'bg-accent-fuchsia/10 text-accent-fuchsia'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    <feature.icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
                </Component>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-titan-surface border-t border-titan-border relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-teal/3 rounded-full blur-[150px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-titan-bg border border-titan-border text-text-secondary text-xs font-medium tracking-wide mb-4">
              <span className="w-1.5 h-1.5 bg-accent-fuchsia rounded-full"></span>
              Success Stories
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">Real creators. Real results.</h2>
            <p className="text-text-secondary text-sm max-w-xl mx-auto">See how Titans members are scaling their TikTok Shop income.</p>
          </div>

          {/* Featured Testimonial */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="bg-titan-bg rounded border border-titan-border p-6 sm:p-8 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
                TESTIMONIALS[currentTestimonial].accent === 'teal' 
                  ? 'from-accent-teal to-accent-teal/20' 
                  : 'from-accent-fuchsia to-accent-fuchsia/20'
              }`}></div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold ${
                    TESTIMONIALS[currentTestimonial].accent === 'teal'
                      ? 'bg-accent-teal/10 text-accent-teal'
                      : 'bg-accent-fuchsia/10 text-accent-fuchsia'
                  }`}>
                    {TESTIMONIALS[currentTestimonial].name.charAt(0)}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-text-primary">{TESTIMONIALS[currentTestimonial].name}</h3>
                    <span className="text-xs text-text-muted">•</span>
                    <span className={`text-xs font-medium ${
                      TESTIMONIALS[currentTestimonial].accent === 'teal' ? 'text-accent-teal' : 'text-accent-fuchsia'
                    }`}>{TESTIMONIALS[currentTestimonial].role}</span>
                  </div>
                  
                  <p className="text-sm text-text-muted mb-3">{TESTIMONIALS[currentTestimonial].headline}</p>
                  
                  <div className="relative mb-4">
                    <Quote size={20} className="absolute -left-1 -top-1 text-titan-border opacity-50" />
                    <p className="text-sm text-text-secondary leading-relaxed pl-5">
                      "{TESTIMONIALS[currentTestimonial].quote}"
                    </p>
                  </div>
                  
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${
                    TESTIMONIALS[currentTestimonial].accent === 'teal'
                      ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/20'
                      : 'bg-accent-fuchsia/10 text-accent-fuchsia border border-accent-fuchsia/20'
                  }`}>
                    <TrendingUp size={12} />
                    {TESTIMONIALS[currentTestimonial].stat}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button 
              onClick={prevTestimonial}
              className="w-9 h-9 rounded border border-titan-border bg-titan-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentTestimonial ? 'bg-accent-teal w-5' : 'bg-titan-border hover:bg-text-muted'
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={nextTestimonial}
              className="w-9 h-9 rounded border border-titan-border bg-titan-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Mini testimonial grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TESTIMONIALS.slice(0, 6).map((t, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`text-left p-4 rounded border transition-all ${
                  idx === currentTestimonial
                    ? 'bg-titan-bg border-accent-teal/30'
                    : 'bg-titan-bg/50 border-titan-border hover:border-titan-border-light'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                    t.accent === 'teal' ? 'bg-accent-teal/10 text-accent-teal' : 'bg-accent-fuchsia/10 text-accent-fuchsia'
                  }`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.name}</p>
                    <p className="text-[10px] text-text-muted">{t.role}</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">"{t.quote.substring(0, 80)}..."</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Discord Community CTA */}
      <section className="py-16 sm:py-20 bg-titan-bg border-t border-titan-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#5865F2]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-xs font-medium mb-5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Free Community
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">
            See the results for yourself
          </h2>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Join our free Discord to see real creator earnings, GMV screenshots, brand deals being posted daily, and what Titans members are actually doing.
          </p>

          <div className="bg-titan-surface border border-titan-border rounded-2xl p-6 sm:p-8 max-w-lg mx-auto mb-8">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Members', value: '3,600+' },
                { label: 'Daily Posts', value: '100+' },
                { label: 'Brands', value: '60+' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
            <a
              href="https://discord.gg/54XSFnWCdp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#5865F2]/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Join Our Free Discord
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[#5865F2]" /> See earnings screenshots</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[#5865F2]" /> Live brand announcements</span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-[#5865F2]" /> Free to join</span>
          </div>
        </div>
      </section>

      {/* Two Column Section */}
      <section className="py-20 bg-titan-bg border-t border-titan-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* For Creators */}
            <div className="bg-titan-surface p-6 sm:p-8 rounded border border-titan-border">
              <div className="flex items-center gap-2 text-accent-teal text-xs font-medium uppercase tracking-wider mb-4">
                <span className="w-1 h-1 bg-accent-teal rounded-full"></span>
                For Creators
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">Get free products & earn</h3>
              <p className="text-text-secondary mb-6 text-sm leading-relaxed">Request samples, promote on TikTok, and keep earning commission on every sale.</p>
              
              <ul className="space-y-3 mb-6">
                {['Free product samples shipped to you', 'No approval delays — request instantly', 'Earn commission on every sale', 'Creator dashboard to track earnings'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-primary text-sm">
                    <div className="w-4 h-4 rounded bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                      <Check size={10} className="text-accent-teal" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link to="/samples" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg text-sm transition-all hover:from-orange-600 hover:to-red-600">
                <Gift size={14} />
                Get Free Samples
              </Link>
            </div>

            {/* For Brands */}
            <div className="bg-titan-surface p-6 sm:p-8 rounded border border-titan-border">
              <div className="flex items-center gap-2 text-accent-fuchsia text-xs font-medium uppercase tracking-wider mb-4">
                <span className="w-1 h-1 bg-accent-fuchsia rounded-full"></span>
                For Brands
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">Drive authentic sales</h3>
              <p className="text-text-secondary mb-6 text-sm leading-relaxed">Connect with creators who can actually sell your product on TikTok Shop.</p>
              
              <ul className="space-y-3 mb-6">
                {['Access to 3,600+ active creators', 'Performance-based partnerships', 'GMV Max campaign support', 'Full analytics dashboard'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-primary text-sm">
                    <div className="w-4 h-4 rounded bg-accent-fuchsia/10 flex items-center justify-center flex-shrink-0">
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

      {/* Final CTA */}
      <section className="py-20 bg-titan-surface border-t border-titan-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-3">Ready to start earning?</h2>
          <p className="text-text-secondary text-sm mb-8">Join 3,600+ creators getting free samples and earning commission on TikTok Shop.</p>
          <Link 
            to="/samples" 
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl text-base transition-all shadow-lg shadow-orange-500/25"
          >
            <Gift size={18} />
            Get Free Samples
          </Link>
          <p className="mt-4 text-xs text-text-muted">Free to join • No application review • Start immediately</p>
        </div>
      </section>

      {/* Floating Mobile CTA */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-titan-bg/95 backdrop-blur-lg border-t border-titan-border">
          <Link 
            to="/samples" 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-orange-500/30"
          >
            <Gift size={16} />
            Get Free Samples
          </Link>
        </div>
      )}

      {/* Bottom padding for floating CTA on mobile */}
      {isMobile && <div className="h-20"></div>}
    </div>
  );
};

export default Home;
