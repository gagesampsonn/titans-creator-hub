import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, Smartphone, ExternalLink, Package, Zap, Lock } from 'lucide-react';
import { PRODUCT_SAMPLES, ProductSample, getGmvMaxProducts, getNonGmvMaxProducts } from '../data/product-samples';
import { useAuth } from '../lib/AuthContext';

// Check if on mobile
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

// Product Row Component
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
      {/* Main Row */}
      <div 
        className={`flex items-center gap-3 px-4 py-3 hover:bg-titan-elevated/50 transition-colors ${hasBundle ? 'cursor-pointer' : ''}`}
        onClick={hasBundle ? onToggle : undefined}
      >
        {/* Expand button for bundles */}
        <div className="w-5 flex-shrink-0">
          {hasBundle && (
            <button className="text-text-muted hover:text-text-primary">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        {/* Brand & Title */}
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

        {/* CTA */}
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

      {/* Expanded Bundle Products */}
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
const TITANS_WHOP_URL = 'https://whop.com/titans/';

const ProductLibrary = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGmvMax, setShowGmvMax] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  const gmvMaxProducts = getGmvMaxProducts(PRODUCT_SAMPLES);
  const regularProducts = getNonGmvMaxProducts(PRODUCT_SAMPLES);

  // Handle sample request click
  const handleRequestClick = (tiktokLink: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isMobile) {
      // Desktop - just show mobile notice (already handled by button styling)
      return;
    }

    if (!user) {
      // Not logged in - show login modal
      setPendingLink(tiktokLink);
      setShowLoginModal(true);
      return;
    }

    // User is logged in - check if they're a Titans member
    // For now, we'll redirect to Whop if they don't have access
    // TODO: Check actual membership status via WhopContext
    // For launch, assume logged in users need to join Titans
    window.open(TITANS_WHOP_URL, '_blank');
  };

  // Handle after login - open the pending link
  const handleContinueToWhop = () => {
    setShowLoginModal(false);
    window.open(TITANS_WHOP_URL, '_blank');
  };
  
  // Filter by search
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
            
            {/* Search */}
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
            {/* GMV Max Header */}
            <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-yellow-400" />
                <span className="font-bold text-text-primary">GMV Max Brands</span>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                  LIVE
                </span>
              </div>
              <button
                onClick={() => setShowGmvMax(false)}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Hide
              </button>
            </div>
            
            <p className="px-4 py-2 text-xs text-text-muted border-b border-yellow-500/10">
              Brands pushing ad budget — turn on Authorization for ad boost eligibility
            </p>
            
            {/* GMV Max Grid */}
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
                  {isMobile && (
                    <p className="text-xs text-yellow-400 mt-1">Request</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Show GMV Max Button (if hidden) */}
      {!showGmvMax && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <button
            onClick={() => setShowGmvMax(true)}
            className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300"
          >
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

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-titan-surface border border-titan-border rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock size={24} className="text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Become a Titans Member
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Get access to exclusive product samples, GMV Max campaigns, and creator tools.
              </p>
              
              <div className="space-y-3">
                <a
                  href={TITANS_WHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all text-center"
                >
                  Join Titans →
                </a>
                
                {!user && (
                  <div className="pt-3 border-t border-titan-border">
                    <p className="text-xs text-text-muted mb-3">Already a member?</p>
                    <Link
                      to="/login"
                      onClick={() => setShowLoginModal(false)}
                      className="block w-full px-6 py-2.5 bg-titan-elevated border border-titan-border text-text-primary font-medium rounded-xl hover:bg-titan-bg transition-all text-center text-sm"
                    >
                      Log In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductLibrary;
