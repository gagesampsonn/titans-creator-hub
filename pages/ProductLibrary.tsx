import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Smartphone, ExternalLink, Package, Zap, Lock, Loader2, Gift, Crown, X, ArrowRight, Sparkles } from 'lucide-react';
import { PRODUCT_SAMPLES, ProductSample, getGmvMaxProducts, getNonGmvMaxProducts } from '../data/product-samples';
import { useAuth } from '../lib/AuthContext';
import { useWhop } from '../lib/WhopContext';

// Map sample IDs from SamplePicker to their TikTok links & names
const FEATURED_SAMPLE_MAP: Record<string, { brand: string; title: string; link: string }> = {
  goli: { brand: 'Goli Nutrition', title: '3 Bottles Best Seller Bundle', link: 'https://affiliate-us.tiktok.com/api/v1/share/AJB5Ljr3LF8b' },
  selerb: { brand: 'Selerb', title: 'NAD+ Supplement for Men', link: 'https://affiliate-us.tiktok.com/api/v1/share/AJAXuMmscNYh' },
  nello: { brand: 'Nello', title: 'SuperCalm Calming Drink Mix', link: 'https://affiliate-us.tiktok.com/api/v1/share/AJHEC6cWt82f' },
};

// ------- Free sample tracking -------
const FREE_SAMPLE_KEY = 'titans_free_samples';
const FREE_SAMPLE_LIMIT = 1;

interface FreeSampleUsage {
  count: number;
  requestedLinks: string[];
}

function getFreeSampleUsage(): FreeSampleUsage {
  try {
    const stored = localStorage.getItem(FREE_SAMPLE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { count: 0, requestedLinks: [] };
}

function recordFreeSample(link: string) {
  const current = getFreeSampleUsage();
  const updated: FreeSampleUsage = {
    count: current.count + 1,
    requestedLinks: [...current.requestedLinks, link],
  };
  localStorage.setItem(FREE_SAMPLE_KEY, JSON.stringify(updated));
  return updated;
}

// ------- Mobile detection -------
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return isMobile;
};

// ------- Product Row -------
const ProductRow = ({ product, isMobile, isExpanded, onToggle, onRequest }: { 
  product: ProductSample; 
  isMobile: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onRequest: (link: string, e: React.MouseEvent) => void;
}) => {
  const hasBundle = product.bundleProducts && product.bundleProducts.length > 0;
  
  return (
    <div className="border-b border-titan-border last:border-b-0">
      <div 
        className={`flex items-center gap-3 px-4 py-3 hover:bg-titan-elevated/50 transition-colors ${hasBundle ? 'cursor-pointer' : ''}`}
        onClick={hasBundle ? onToggle : undefined}
      >
        <div className="w-5 flex-shrink-0">
          {hasBundle && (
            <button className="text-text-muted hover:text-text-primary">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary">{product.brand}</span>
            {product.productCount && product.productCount > 1 && (
              <span className="px-1.5 py-0.5 bg-accent-teal/20 text-accent-teal text-xs font-medium rounded flex items-center gap-0.5">
                <Package size={10} /> {product.productCount}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary truncate">{product.title}</p>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={(e) => onRequest(product.tiktokLink, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
              isMobile
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                : 'bg-titan-elevated border border-titan-border text-text-muted cursor-default'
            }`}
          >
            {isMobile ? (
              <>Request <ExternalLink size={12} /></>
            ) : (
              <><Smartphone size={14} /> Mobile</>
            )}
          </button>
        </div>
      </div>

      {hasBundle && isExpanded && (
        <div className="bg-titan-bg/50 border-t border-titan-border">
          {product.bundleProducts!.map((item, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-2 pl-12 border-b border-titan-border/50 last:border-b-0">
              <span className="text-text-muted text-xs">{index + 1}.</span>
              <p className="text-sm text-text-secondary">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Titans Whop membership URL
const TITANS_WHOP_URL = 'https://whop.com/tiktokshopaffiliate/';

const ProductLibrary = () => {
  const { user, loading: authLoading } = useAuth();
  const { whopAccess, loading: whopLoading } = useWhop();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGmvMax, setShowGmvMax] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimedSample, setClaimedSample] = useState<{ brand: string; title: string; link: string } | null>(null);
  const [freeSamples, setFreeSamples] = useState<FreeSampleUsage>({ count: 0, requestedLinks: [] });
  const isMobile = useIsMobile();
  
  const gmvMaxProducts = getGmvMaxProducts(PRODUCT_SAMPLES);
  const regularProducts = getNonGmvMaxProducts(PRODUCT_SAMPLES);

  const isMember = whopAccess?.hasAccess || false;

  // Load free sample usage on mount
  useEffect(() => {
    setFreeSamples(getFreeSampleUsage());
  }, []);

  // Detect ?sample= param and show claim modal
  useEffect(() => {
    const sampleId = searchParams.get('sample');
    if (sampleId && user && FEATURED_SAMPLE_MAP[sampleId]) {
      const sample = FEATURED_SAMPLE_MAP[sampleId];
      setClaimedSample(sample);
      setShowClaimModal(true);

      // Record as free sample for non-members
      if (!isMember) {
        const usage = getFreeSampleUsage();
        if (!usage.requestedLinks.includes(sample.link)) {
          const updated = recordFreeSample(sample.link);
          setFreeSamples(updated);
        }
      }

      // Clear the param from URL so it doesn't re-trigger
      searchParams.delete('sample');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, user, isMember]);

  const hasUsedFreeSample = freeSamples.count >= FREE_SAMPLE_LIMIT;

  // Handle sample request click
  const handleRequestClick = useCallback((tiktokLink: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isMobile) return; // Desktop shows mobile notice

    // Not logged in → login modal
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Titans member → unlimited access
    if (isMember) {
      window.open(tiktokLink, '_blank');
      return;
    }

    // Non-member: check free sample allowance
    if (!hasUsedFreeSample) {
      // First sample is free — open the link and record it
      const updated = recordFreeSample(tiktokLink);
      setFreeSamples(updated);
      window.open(tiktokLink, '_blank');
    } else {
      // Already used their free sample → show upsell
      setShowUpsellModal(true);
    }
  }, [isMobile, user, isMember, hasUsedFreeSample]);

  // Loading state
  if (authLoading || (user && whopLoading)) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent-teal" />
      </div>
    );
  }

  // Not logged in → send to signup
  if (!user) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gift size={28} className="text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-3">Get Free Samples</h1>
          <p className="text-text-secondary text-sm mb-8">
            Create a free account to browse and request product samples from top TikTok Shop brands.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/signup?redirect=products"
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Sign Up Free
            </Link>
            <Link
              to="/login?redirect=products"
              className="px-6 py-2.5 bg-titan-surface border border-titan-border text-text-primary font-medium rounded-xl hover:bg-titan-elevated transition-all text-sm"
            >
              Already have an account? Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Logged in (member or non-member) — show full product list ----
  
  const filteredProducts = React.useMemo(() => {
    if (!searchQuery) return regularProducts;
    const query = searchQuery.toLowerCase();
    return regularProducts.filter(p => 
      p.brand.toLowerCase().includes(query) ||
      p.title.toLowerCase().includes(query) ||
      p.bundleProducts?.some(bp => bp.toLowerCase().includes(query))
    );
  }, [searchQuery, regularProducts]);

  const filteredGmvMax = React.useMemo(() => {
    if (!searchQuery) return gmvMaxProducts;
    const query = searchQuery.toLowerCase();
    return gmvMaxProducts.filter(p => p.brand.toLowerCase().includes(query));
  }, [gmvMaxProducts, searchQuery]);

  return (
    <div className="min-h-screen bg-titan-bg">
      {/* Non-member banner: show how many free samples left */}
      {!isMember && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-b border-orange-500/20">
          <div className="max-w-4xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Gift size={15} className="text-orange-400" />
              {hasUsedFreeSample ? (
                <span className="text-text-secondary">
                  You've used your <span className="text-orange-400 font-semibold">1 free sample</span>.{' '}
                  <a href={TITANS_WHOP_URL} target="_blank" rel="noopener noreferrer" className="text-orange-400 font-semibold underline underline-offset-2 hover:text-orange-300">
                    Join Titans
                  </a>{' '}
                  for unlimited access.
                </span>
              ) : (
                <span className="text-text-secondary">
                  You have <span className="text-orange-400 font-semibold">1 free sample</span> — pick your favorite!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notice Banner - Only on Desktop */}
      {!isMobile && (
        <div className="bg-gradient-to-r from-accent-teal/10 to-accent-fuchsia/10 border-b border-titan-border">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Smartphone size={16} className="text-accent-teal" />
              <span className="text-text-secondary">
                <span className="text-text-primary font-medium">Sample requests only work on mobile.</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-titan-surface border-b border-titan-border sticky top-14 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-text-primary">Product Samples</h1>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-titan-bg border border-titan-border rounded-lg text-text-primary text-sm focus:border-accent-teal focus:outline-none placeholder-text-muted"
              />
            </div>
          </div>
        </div>
      </div>

      {/* GMV MAX Section */}
      {showGmvMax && filteredGmvMax.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                <span className="font-bold text-text-primary">GMV Max Brands</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">LIVE</span>
              </div>
              <button onClick={() => setShowGmvMax(false)} className="text-xs text-text-muted hover:text-text-primary">Hide</button>
            </div>
            
            <p className="px-4 py-2 text-xs text-text-muted border-b border-yellow-500/10">
              Brands pushing ad budget — turn on Authorization for ad boost eligibility
            </p>
            
            <div className="p-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {filteredGmvMax.map(product => (
                <button
                  key={product.id}
                  onClick={(e) => handleRequestClick(product.tiktokLink, e)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    isMobile 
                      ? 'bg-titan-surface border border-titan-border hover:border-yellow-500/50'
                      : 'bg-titan-surface/50 border border-titan-border/50 cursor-default'
                  }`}
                >
                  <p className="font-semibold text-text-primary text-sm truncate">{product.brand}</p>
                  {isMobile && <p className="text-xs text-yellow-400 mt-1">Request</p>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showGmvMax && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <button onClick={() => setShowGmvMax(true)} className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300">
            <Zap size={14} /> Show GMV Max ({gmvMaxProducts.length})
          </button>
        </div>
      )}

      {/* Products List */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="bg-titan-surface rounded-xl border border-titan-border overflow-hidden">
          <div className="px-4 py-2 border-b border-titan-border bg-titan-elevated/30">
            <span className="text-sm text-text-muted">{filteredProducts.length} samples</span>
          </div>
          
          {filteredProducts.map(product => (
            <ProductRow 
              key={product.id} 
              product={product} 
              isMobile={isMobile}
              isExpanded={expandedId === product.id}
              onToggle={() => setExpandedId(expandedId === product.id ? null : product.id)}
              onRequest={handleRequestClick}
            />
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No samples found</p>
            </div>
          )}
        </div>
      </div>

      {/* ========== LOGIN MODAL (not logged in) ========== */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-titan-surface border border-titan-border rounded-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift size={24} className="text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Create an Account</h2>
              <p className="text-text-secondary text-sm mb-6">
                Sign up for free to request your first product sample.
              </p>
              
              <div className="space-y-3">
                <Link
                  to="/signup?redirect=products"
                  onClick={() => setShowLoginModal(false)}
                  className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all text-center"
                >
                  Sign Up Free
                </Link>
                <div className="pt-3 border-t border-titan-border">
                  <p className="text-xs text-text-muted mb-3">Already have an account?</p>
                  <Link
                    to="/login?redirect=products"
                    onClick={() => setShowLoginModal(false)}
                    className="block w-full px-6 py-2.5 bg-titan-elevated border border-titan-border text-text-primary font-medium rounded-xl hover:bg-titan-bg transition-all text-center text-sm"
                  >
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== CLAIM MODAL (user just signed up and picked a sample) ========== */}
      {showClaimModal && claimedSample && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-titan-surface border border-titan-border rounded-2xl max-w-md w-full p-6 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

            <div className="text-center pt-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-1">
                Your free sample is ready!
              </h2>
              <p className="text-text-secondary text-sm mb-1">
                <span className="text-text-primary font-semibold">{claimedSample.brand}</span>
              </p>
              <p className="text-text-muted text-xs mb-6">{claimedSample.title}</p>

              <a
                href={claimedSample.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-500/20 mb-3"
              >
                🎁 Claim Your Free Sample
                <ArrowRight size={16} />
              </a>
              
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex items-center justify-center gap-1.5 w-full px-6 py-3 bg-titan-elevated border border-titan-border text-text-secondary font-medium rounded-xl hover:bg-titan-bg hover:text-text-primary transition-all text-sm"
              >
                Browse all samples instead
                <ArrowRight size={14} />
              </button>

              {!isMember && (
                <p className="mt-4 text-xs text-text-muted">
                  Want unlimited samples?{' '}
                  <a href={TITANS_WHOP_URL} target="_blank" rel="noopener noreferrer" className="text-orange-400 font-semibold underline underline-offset-2 hover:text-orange-300">
                    Join Titans
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== UPSELL MODAL (non-member used their 1 free sample) ========== */}
      {showUpsellModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUpsellModal(false)}>
          <div className="bg-titan-surface border border-titan-border rounded-2xl max-w-md w-full p-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>

            <button onClick={() => setShowUpsellModal(false)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
            
            <div className="text-center pt-2">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={28} className="text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                You've used your free sample
              </h2>
              <p className="text-text-secondary text-sm mb-2">
                Free accounts are limited to <span className="text-orange-400 font-semibold">1 sample request</span>.
              </p>
              <p className="text-text-secondary text-sm mb-6">
                Join Titans to unlock <span className="text-text-primary font-semibold">unlimited samples</span>, GMV Max campaigns, creator tools, and more.
              </p>

              {/* Benefits */}
              <div className="bg-titan-bg/60 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs text-text-muted font-semibold uppercase tracking-wider mb-3">Titans members get:</p>
                <ul className="space-y-2">
                  {[
                    'Unlimited product samples',
                    'GMV Max brand campaigns',
                    'Creator course & tools',
                    'Private community access',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-400 text-xs">✓</span>
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <a
                href={TITANS_WHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all text-center shadow-lg shadow-orange-500/20"
              >
                Join Titans — Unlock All Samples →
              </a>

              <a
                href="https://discord.gg/54XSFnWCdp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-3 px-6 py-3 bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] font-medium rounded-xl hover:bg-[#5865F2]/20 transition-all text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                See results in our free Discord first
              </a>
              
              <button
                onClick={() => setShowUpsellModal(false)}
                className="mt-3 text-xs text-text-muted hover:text-text-secondary"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductLibrary;
