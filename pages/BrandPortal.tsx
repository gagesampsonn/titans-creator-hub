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
  AlertCircle
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
    { value: '$5.2M+', label: 'GMV Generated' },
    { value: '78K+', label: 'Videos Created' },
    { value: '6,000+', label: 'Samples Sent' },
    { value: '60+', label: 'Brand Partners' }
  ];

  return (
    <div className="min-h-screen bg-titan-bg">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-fuchsia/10 via-transparent to-accent-teal/10" />
        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-fuchsia/10 border border-accent-fuchsia/30 rounded-full text-sm text-accent-fuchsia mb-6">
              <Building2 size={16} />
              For Brands & Sellers
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Get Your Products in Front of{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-fuchsia to-accent-teal">
                Top Creators
              </span>
            </h1>
            
            <p className="text-lg text-text-secondary mb-8">
              Connect your TikTok Shop and let our creator network drive authentic sales for your brand.
            </p>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center gap-3">
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
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center gap-3">
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

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="text-green-400 font-medium">Shop Connected!</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectShop}
                  disabled={isConnecting}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                      Connect Your TikTok Shop
                      <ExternalLink size={18} />
                    </>
                  )}
                </button>
              )}
              
              <a
                href="mailto:brands@titansagency.co"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-titan-surface border border-titan-border rounded-xl font-medium text-text-primary hover:bg-titan-elevated transition-colors"
              >
                Contact Sales
                <ArrowRight size={18} />
              </a>
            </div>

            {!user && (
              <p className="text-sm text-text-muted mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-accent-teal hover:underline">
                  Log in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-titan-border bg-titan-surface/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-teal to-accent-fuchsia">
                  {stat.value}
                </div>
                <div className="text-sm text-text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Why Brands Choose Titans
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            We've helped 60+ brands drive millions in GMV through authentic creator partnerships
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 bg-titan-surface border border-titan-border rounded-xl hover:border-accent-fuchsia/30 transition-colors"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-fuchsia/20 to-accent-teal/20 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon size={24} className="text-accent-fuchsia" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {benefit.title}
              </h3>
              <p className="text-text-secondary">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-titan-surface border-y border-titan-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent-fuchsia text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Connect Your Shop
              </h3>
              <p className="text-text-secondary text-sm">
                Link your TikTok Shop account to import your product catalog
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-accent-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Select Products
              </h3>
              <p className="text-text-secondary text-sm">
                Choose which products you want creators to promote
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Watch Sales Grow
              </h3>
              <p className="text-text-secondary text-sm">
                Our creators promote your products and drive authentic sales
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleConnectShop}
              disabled={isConnecting || connectionStatus === 'connected'}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle size={18} />
                  Connected
                </>
              ) : (
                <>
                  Get Started
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-accent-fuchsia/10 to-accent-teal/10 border border-titan-border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            Ready to Scale Your TikTok Shop Sales?
          </h2>
          <p className="text-text-secondary mb-6 max-w-xl mx-auto">
            Join 60+ brands already working with Titans creators. Let's discuss how we can help grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:brands@titansagency.co"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-titan-bg rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Contact Our Team
            </a>
            <button
              onClick={handleConnectShop}
              disabled={isConnecting || connectionStatus === 'connected'}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {connectionStatus === 'connected' ? 'Shop Connected ✓' : 'Connect Shop Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPortal;
