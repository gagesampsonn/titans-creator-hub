import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { MOCK_PRODUCTS } from '../lib/mockData';
import { Category } from '../types';

const ProductLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sampleOnly, setSampleOnly] = useState(false);
  const [minCommission, setMinCommission] = useState(0);

  const categories: Category[] = ['All', 'Beauty', 'Supplements', 'Pets', 'Lifestyle', 'Tech', 'Fashion'];

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.tagline.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSample = !sampleOnly || product.sampleAvailable;
      const matchesComm = product.commissionRate >= minCommission;
      
      return matchesSearch && matchesCategory && matchesSample && matchesComm;
    });
  }, [searchTerm, selectedCategory, sampleOnly, minCommission]);

  return (
    <div className="min-h-screen bg-titan-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Products</h1>
            <p className="text-sm text-text-muted">{filteredProducts.length} products available</p>
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="sm:hidden flex items-center justify-center gap-2 bg-titan-surface border border-titan-border rounded px-4 py-2 text-text-secondary text-sm hover:text-text-primary transition-colors"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        <div className="flex gap-8">
          
          {/* Sidebar Filters */}
          <div className={`fixed inset-0 z-40 bg-titan-bg/90 backdrop-blur-sm sm:static sm:bg-transparent sm:inset-auto sm:w-56 sm:block transition-all ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible sm:opacity-100 sm:visible'}`}>
            <div className={`absolute right-0 top-0 h-full w-72 bg-titan-surface border-l border-titan-border p-5 transform transition-transform duration-200 sm:relative sm:transform-none sm:w-full sm:bg-transparent sm:border-none sm:p-0 sm:h-auto ${showFilters ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'}`}>
              
              <div className="flex items-center justify-between sm:hidden mb-5">
                <h3 className="font-semibold text-text-primary">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-1 text-text-muted hover:text-text-primary">
                  <X size={18} />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full pl-9 pr-3 py-2 rounded bg-titan-surface border border-titan-border text-text-primary text-sm placeholder-text-muted focus:border-accent-teal focus:outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Groups */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">Category</h3>
                  <div className="space-y-1.5">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                          selectedCategory === cat 
                            ? 'bg-accent-teal/10 text-accent-teal' 
                            : 'text-text-secondary hover:text-text-primary hover:bg-titan-elevated'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-3">Min. Commission</h3>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    step="5"
                    value={minCommission}
                    onChange={(e) => setMinCommission(Number(e.target.value))}
                    className="w-full h-1 bg-titan-border rounded appearance-none cursor-pointer accent-accent-teal" 
                  />
                  <div className="flex justify-between text-[10px] text-text-muted mt-2">
                    <span>0%</span>
                    <span className="text-accent-teal font-medium">{minCommission}%+</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <button 
                    onClick={() => setSampleOnly(!sampleOnly)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded text-sm transition-colors ${
                      sampleOnly 
                        ? 'bg-accent-teal/10 text-accent-teal' 
                        : 'bg-titan-surface border border-titan-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span>Sample Available</span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${sampleOnly ? 'bg-accent-teal' : 'bg-titan-border'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${sampleOnly ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mobile Apply */}
              <div className="sm:hidden mt-6 pt-5 border-t border-titan-border">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-text-primary text-titan-bg font-medium py-2.5 rounded text-sm"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-titan-surface rounded border border-titan-border">
                <div className="w-12 h-12 bg-titan-elevated rounded flex items-center justify-center mx-auto mb-4 text-text-muted">
                  <Search size={20} />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">No products found</h3>
                <p className="text-sm text-text-muted mb-4">Try adjusting your filters</p>
                <button 
                  onClick={() => {setSelectedCategory('All'); setSearchTerm(''); setMinCommission(0); setSampleOnly(false);}}
                  className="text-sm text-accent-teal hover:text-text-primary transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductLibrary;
