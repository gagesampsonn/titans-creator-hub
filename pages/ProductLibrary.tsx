import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Smartphone, ExternalLink, Package, Zap } from 'lucide-react';
import { PRODUCT_SAMPLES, ProductSample, getGmvMaxProducts, getNonGmvMaxProducts } from '../data/product-samples';

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
const ProductRow = ({ product, isMobile, isExpanded, onToggle }: { 
  product: ProductSample; 
  isMobile: boolean;
  isExpanded: boolean;
  onToggle: () => void;
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
          <a
            href={product.tiktokLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
              isMobile
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                : 'bg-titan-elevated border border-titan-border text-text-muted'
            }`}
          >
            {isMobile ? (
              <>Get Link <ExternalLink size={12} /></>
            ) : (
              <><Smartphone size={14} /> Mobile</>
            )}
          </a>
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

const ProductLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGmvMax, setShowGmvMax] = useState(true);
  const isMobile = useIsMobile();
  
  const gmvMaxProducts = getGmvMaxProducts(PRODUCT_SAMPLES);
  const regularProducts = getNonGmvMaxProducts(PRODUCT_SAMPLES);
  
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
                <a
                  key={product.id}
                  href={product.tiktokLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-lg text-center transition-all ${
                    isMobile 
                      ? 'bg-titan-surface border border-titan-border hover:border-yellow-500/50'
                      : 'bg-titan-surface/50 border border-titan-border/50'
                  }`}
                  onClick={(e) => !isMobile && e.preventDefault()}
                >
                  <p className="font-semibold text-text-primary text-sm truncate">{product.brand}</p>
                  {isMobile && (
                    <p className="text-xs text-yellow-400 mt-1">Get Link</p>
                  )}
                </a>
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
    </div>
  );
};

export default ProductLibrary;
