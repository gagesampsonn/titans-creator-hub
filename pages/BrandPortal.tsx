import React from 'react';
import { 
  Building2, 
  Users, 
  ExternalLink,
  Package,
  BarChart3,
  Zap,
  ArrowRight,
  DollarSign,
  Video,
  Target,
  Mail,
  Calendar,
  CheckCircle,
  CreditCard,
  Clock,
  FileText,
  ShoppingBag
} from 'lucide-react';
import TopVideos2025 from '../components/TopVideos2025';

const BrandPortal = () => {
  const benefits = [
    {
      icon: Users,
      title: '3,600+ Active Creators',
      description: 'Access our network of verified TikTok Shop affiliates ready to promote your products'
    },
    {
      icon: Package,
      title: 'Streamlined Sampling',
      description: 'Manage sample requests and approvals all in one place'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track GMV, conversions, and creator performance in real-time'
    },
    {
      icon: Zap,
      title: 'Fast Matching',
      description: 'Our AI matches your products with the best-fit creators'
    }
  ];

  const stats = [
    { value: '$5.2M+', label: 'GMV Generated', icon: DollarSign },
    { value: '78K+', label: 'Videos Created', icon: Video },
    { value: '6,000+', label: 'Samples Sent', icon: Package },
    { value: '60+', label: 'Brand Partners', icon: Building2 }
  ];

  const brandLogos = [
    { name: 'Selerb', category: 'Health & Wellness' },
    { name: 'Goli', category: 'Health & Wellness' },
    { name: 'Nello', category: 'Wellness' },
    { name: 'Supercalm', category: 'Wellness' },
    { name: 'Natural Stacks', category: 'Supplements' },
    { name: 'WhyNot Natural', category: 'Natural Products' },
    { name: 'Dude Wipes', category: 'Personal Care' },
  ];

  const campaignDetails = [
    { icon: Calendar, label: '44-Day Campaign', description: '14 days onboarding + 30 days of posting' },
    { icon: Video, label: '225+ Guaranteed Videos', description: 'Plus extras if you send more samples' },
    { icon: Users, label: '225+ Creators', description: 'Matched to your niche and products' },
  ];

  const whatWeNeed = [
    { icon: CreditCard, text: 'Payment via card, PayPal, or split payments' },
    { icon: ShoppingBag, text: 'Your TikTok Shop code' },
    { icon: Package, text: 'Sample budget (min 10 samples, most brands send 35-75)' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0a14] via-[#0d0d0d] to-[#0a0a0a] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-fuchsia-500/15 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/30 rounded-full text-sm text-fuchsia-400 mb-6">
            <Building2 size={16} />
            For Brands & Sellers
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Scale Your TikTok Shop with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Top Creators
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-2 max-w-2xl mx-auto font-medium">
            How Titans Structures Creator Campaigns for Predictable TikTok Shop Growth
          </p>
          <p className="text-base text-gray-500 mb-8 max-w-2xl mx-auto">
            And why some of TikTok's biggest brands trust our model
          </p>
        </div>
      </div>

      {/* Video Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 mb-16">
        {/* macOS-style window frame */}
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-fuchsia-500/10">
          {/* Window header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#2a2a2a] border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm text-gray-400 font-medium">
              The Titans Model: How We Drive GMV for Brands
            </span>
            <a
              href="mailto:brands@titansagency.co"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              Contact Sales
              <ExternalLink size={12} />
            </a>
          </div>
          
          {/* Video embed */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src="https://www.loom.com/embed/9f5d36e5b2114d898c70f34c564c6a42?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true"
              frameBorder="0"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
              style={{ background: '#000' }}
            />
          </div>
        </div>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          Watch how we helped brands generate $5.2M+ in GMV through creator partnerships
        </p>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 border-y border-gray-800 bg-black/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 mb-3 group-hover:scale-110 transition-transform">
                  <stat.icon size={24} className="text-fuchsia-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Videos Section */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <TopVideos2025 />
      </div>

      {/* Campaign Package Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            The Titans Campaign Package
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A structured 44-day campaign designed for predictable growth
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Campaign Details Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">What's Included</h3>
                <p className="text-gray-400 text-sm">Full-service creator campaign</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              {campaignDetails.map((item) => (
                <div key={item.label} className="flex items-start gap-4 p-4 bg-black/30 rounded-xl border border-gray-800">
                  <div className="w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-fuchsia-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{item.label}</div>
                    <div className="text-sm text-gray-400">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Campaign Investment</span>
                <span className="text-3xl font-bold text-white">$10,500</span>
              </div>
              <p className="text-sm text-gray-500">One-time payment • Flexible payment options available</p>
            </div>
          </div>

          {/* What We Need Card */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">What We Need From You</h3>
                <p className="text-gray-400 text-sm">Simple setup, we handle the rest</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              {whatWeNeed.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-gray-800">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon size={20} className="text-cyan-400" />
                  </div>
                  <span className="text-white">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Payment Options */}
            <div className="border-t border-gray-800 pt-6">
              <div className="text-sm text-gray-400 mb-3">Flexible Payment Options</div>
              <div className="flex flex-wrap gap-2">
                {['Credit Card', 'PayPal', 'Bank Transfer', 'Split Payments', 'Crypto'].map((method) => (
                  <span key={method} className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs rounded-full border border-gray-700">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Titans Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">
            Why Brands Choose Titans
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We've helped 60+ brands drive millions in GMV through authentic creator partnerships
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-800 rounded-xl hover:border-fuchsia-500/30 transition-all hover:shadow-lg hover:shadow-fuchsia-500/5 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <benefit.icon size={24} className="text-fuchsia-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="relative z-10 bg-gradient-to-r from-fuchsia-500/5 via-transparent to-cyan-500/5 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              How It Works
            </h2>
            <p className="text-gray-400">
              Get started in minutes, not weeks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-fuchsia-500/30">
                1
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Purchase Campaign
              </h3>
              <p className="text-gray-400 text-sm">
                Pay via card, PayPal, or split payments
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                2
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Share Shop Code
              </h3>
              <p className="text-gray-400 text-sm">
                We set up your campaign
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-fuchsia-500/30">
                3
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Approve Samples
              </h3>
              <p className="text-gray-400 text-sm">
                Set your sample budget (35-75 typical)
              </p>
            </div>

            <div className="text-center group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-green-500/30">
                4
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Watch Sales Grow
              </h3>
              <p className="text-gray-400 text-sm">
                225+ videos drive real sales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brands We've Worked With */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">
            Trusted by Growing Brands
          </h2>
          <p className="text-gray-400 text-sm">
            Join 60+ brands already scaling with Titans creators
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {brandLogos.map((brand) => (
            <div 
              key={brand.name}
              className="p-3 bg-gray-900/50 border border-gray-800 rounded-xl text-center hover:border-fuchsia-500/30 transition-colors"
            >
              <div className="text-sm font-semibold text-white mb-0.5">{brand.name}</div>
              <div className="text-[10px] text-gray-500">{brand.category}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-fuchsia-500/20 via-purple-500/10 to-cyan-500/20 border border-gray-800 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-cyan-500/5" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Scale Your TikTok Shop Sales?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Book a call to discuss your brand, or skip ahead and purchase your campaign directly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:brands@titansagency.co"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                <Mail size={20} />
                Contact Our Team
              </a>
              
              <a
                href="https://whop.com/checkout/plan_rBAHh3s9NPXZR"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Zap size={20} />
                Skip the Call — Purchase Now
                <ArrowRight size={18} />
              </a>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Secure checkout via Whop • Pay with Card, PayPal, Bank Transfer, Split Payments, or Crypto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortal;
