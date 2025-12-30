import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  ExternalLink,
  Package,
  BarChart3,
  Zap,
  ArrowRight,
  XCircle,
  RefreshCw,
  AlertCircle,
  Play,
  DollarSign,
  Video,
  Target
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { connectTikTokSeller } from '../lib/tiktokService';

const BrandPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'connected' | 'error'>('none');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success/error messages in URL (from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (params.get('tiktok_connected') === 'true') {
      setSuccessMessage(params.get('message') || 'TikTok Shop connected successfully!');
      setConnectionStatus('connected');
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    } else if (params.get('tiktok_error') === 'true') {
      setError(params.get('message') || 'Failed to connect TikTok Shop');
      setConnectionStatus('error');
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, []);

  const handleConnectShop = async () => {
    if (!user) {
      navigate('/login?redirect=/brands');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Use the seller OAuth flow for brands
      await connectTikTokSeller(user.id);
      // User will be redirected to TikTok
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start connection');
      setIsConnecting(false);
    }
  };

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
    { name: 'BellaVita', category: 'Fragrances' },
    { name: 'Cirkul', category: 'Beverages' },
    { name: 'Our Place', category: 'Home & Kitchen' },
    { name: 'Wyze', category: 'Smart Home' },
    { name: 'Anker', category: 'Electronics' },
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
          
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Partner with 3,600+ verified affiliates who drive millions in sales. 
            Watch the video below to see how the Titans model works.
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

      {/* Success/Error Messages */}
      {(successMessage || error) && (
        <div className="relative z-10 max-w-2xl mx-auto px-6 py-4">
          {successMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center gap-3">
              <CheckCircle size={20} className="text-green-500" />
              <span className="text-green-400">{successMessage}</span>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="ml-2 text-green-500 hover:text-green-400"
              >
                ×
              </button>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <span className="text-red-400">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-400"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

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

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-fuchsia-500/30">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Connect Your Shop
              </h3>
              <p className="text-gray-400 text-sm">
                Link your TikTok Shop account to import your product catalog automatically
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                We Match Creators
              </h3>
              <p className="text-gray-400 text-sm">
                Our team matches your products with the best-fit creators in your niche
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold group-hover:scale-110 transition-transform shadow-lg shadow-fuchsia-500/30">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Watch Sales Grow
              </h3>
              <p className="text-gray-400 text-sm">
                Creators post authentic content and drive real sales to your shop
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
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {brandLogos.map((brand) => (
            <div 
              key={brand.name}
              className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center hover:border-fuchsia-500/30 transition-colors"
            >
              <div className="text-lg font-semibold text-white mb-1">{brand.name}</div>
              <div className="text-xs text-gray-500">{brand.category}</div>
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
              Let's discuss how our creator network can help grow your business. 
              Book a call or connect your shop to get started.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:brands@titansagency.co"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                <Target size={20} />
                Contact Our Team
              </a>
              
              {connectionStatus === 'connected' ? (
                <div className="flex items-center justify-center gap-3 px-8 py-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-green-400 font-medium">Shop Connected!</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectShop}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      Connect Your Shop
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
            
            {!user && (
              <p className="text-sm text-gray-500 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 hover:underline">
                  Log in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortal;
