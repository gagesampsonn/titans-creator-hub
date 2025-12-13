import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header & Mobile Filter Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Product Library</h1>
          <button 
            onClick={() => setShowFilters(true)}
            className="md:hidden flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-300 font-medium hover:text-white"
          >
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters (Desktop + Mobile Drawer) */}
          <div className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:static md:bg-transparent md:inset-auto md:w-64 md:block transition-all ${showFilters ? 'opacity-100 visible' : 'opacity-0 invisible md:opacity-100 md:visible'}`}>
            <div className={`absolute right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-800 p-6 shadow-2xl transform transition-transform duration-300 md:relative md:transform-none md:w-full md:shadow-none md:bg-transparent md:border-none md:p-0 md:h-auto ${showFilters ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
              
              <div className="flex items-center justify-between md:hidden mb-6">
                <h3 className="font-bold text-lg text-white">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-white"><X size={24} /></button>
              </div>

              {/* Search */}
              <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filter Groups */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Category</h3>
                  <div className="space-y-3">
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedCategory === cat ? 'border-orange-500' : 'border-slate-700 group-hover:border-slate-500'}`}>
                          {selectedCategory === cat && <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>}
                        </div>
                        <input 
                          type="radio" 
                          name="category" 
                          className="hidden" 
                          checked={selectedCategory === cat} 
                          onChange={() => setSelectedCategory(cat)} 
                        />
                        <span className={`text-sm transition-colors ${selectedCategory === cat ? 'text-white font-medium' : 'text-slate-400 group-hover:text-slate-300'}`}>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Min. Commission</h3>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    step="5"
                    value={minCommission}
                    onChange={(e) => setMinCommission(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" 
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>0%</span>
                    <span className="font-bold text-orange-500">{minCommission}%+</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Sample Available</span>
                    <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${sampleOnly ? 'bg-tiktok-cyan shadow-[0_0_10px_rgba(37,244,238,0.3)]' : 'bg-slate-800'}`} onClick={() => setSampleOnly(!sampleOnly)}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${sampleOnly ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mobile Only Apply Button */}
              <div className="md:hidden mt-8 pt-6 border-t border-slate-800">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg"
                >
                  Show {filteredProducts.length} Results
                </button>
              </div>

            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
             {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
             ) : (
               <div className="text-center py-32 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                 <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                   <Search size={40} />
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
                 <p className="text-slate-500">Try adjusting your filters to find more offers.</p>
                 <button 
                   onClick={() => {setSelectedCategory('All'); setSearchTerm(''); setMinCommission(0); setSampleOnly(false);}}
                   className="mt-6 text-tiktok-cyan font-medium hover:underline"
                 >
                   Clear all filters
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