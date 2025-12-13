import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Gift, Copy, Video, Check, Info } from 'lucide-react';
import { MOCK_PRODUCTS } from '../lib/mockData';

const ProductDetail = () => {
  const { id } = useParams();
  const product = MOCK_PRODUCTS.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState<'hooks' | 'content'>('hooks');
  const [copied, setCopied] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Link to="/products" className="text-orange-500 mt-4 hover:underline">Back to library</Link>
      </div>
    );
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequest = () => {
    setRequested(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Breadcrumb / Back */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Link to="/products" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ChevronLeft size={16} /> Back to Library
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left: Images */}
          <div className="space-y-4">
             <div className="aspect-square bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden p-8 shadow-2xl relative group">
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-transparent to-transparent opacity-50"></div>
               <img src={product.image} alt={product.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
             </div>
             <div className="grid grid-cols-3 gap-4">
               {[1,2,3].map(i => (
                 <div key={i} className="aspect-square bg-slate-900 rounded-lg border border-slate-800 overflow-hidden cursor-pointer hover:border-orange-500 transition-all opacity-70 hover:opacity-100">
                   <img src={`https://picsum.photos/200/200?random=${i+10}`} alt="" className="w-full h-full object-cover" />
                 </div>
               ))}
             </div>
          </div>

          {/* Right: Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-tiktok-cyan uppercase tracking-widest bg-tiktok-cyan/10 px-2 py-1 rounded border border-tiktok-cyan/20">{product.category}</span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400 hover:text-white cursor-pointer transition-colors">{product.brand}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">{product.name}</h1>
            <p className="text-lg text-slate-400 mb-8 font-medium">{product.tagline}</p>

            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 backdrop-blur-sm mb-8 grid grid-cols-3 gap-4">
              <div className="text-center border-r border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Commission</div>
                <div className="text-2xl font-bold text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]">{product.commissionRate}%</div>
              </div>
              <div className="text-center border-r border-slate-800">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">7-Day GMV</div>
                <div className="text-2xl font-bold text-white">${(product.gmv7Day/1000).toFixed(1)}k</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sample</div>
                <div className={`text-2xl font-bold ${product.sampleAvailable ? 'text-tiktok-cyan drop-shadow-[0_0_8px_rgba(37,244,238,0.4)]' : 'text-slate-600'}`}>
                  {product.sampleAvailable ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <p className="text-slate-300 mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={handleCopy}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.6)]"
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Affiliate Link Copied!' : 'Copy Affiliate Link'}
              </button>
              
              {product.sampleAvailable ? (
                <button 
                  onClick={handleRequest}
                  disabled={requested}
                  className={`flex-1 border h-14 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    requested 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'border-slate-700 bg-slate-900 text-white hover:border-tiktok-cyan hover:text-tiktok-cyan hover:shadow-[0_0_15px_-5px_rgba(37,244,238,0.2)]'
                  }`}
                >
                  {requested ? <Check size={20} /> : <Gift size={20} />}
                  {requested ? 'Request Sent' : 'Request Free Sample'}
                </button>
              ) : (
                <button disabled className="flex-1 bg-slate-900 text-slate-500 border border-slate-800 h-14 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  Sample Unavailable
                </button>
              )}
            </div>

            {/* Resources Tabs */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
               <div className="flex border-b border-slate-800">
                 <button 
                   onClick={() => setActiveTab('hooks')}
                   className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all ${activeTab === 'hooks' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                 >
                   Viral Hooks ({product.hooks.length})
                 </button>
                 <button 
                   onClick={() => setActiveTab('content')}
                   className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-all ${activeTab === 'content' ? 'border-orange-500 text-orange-500 bg-orange-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                 >
                   Content Angles
                 </button>
               </div>
               
               <div className="p-6">
                 {activeTab === 'hooks' ? (
                   <ul className="space-y-4">
                     {product.hooks.map((hook, i) => (
                       <li key={i} className="flex items-start gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                         <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-lg">
                           {i + 1}
                         </div>
                         <p className="font-medium text-slate-200">"{hook}"</p>
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {product.contentTypes.map((type, i) => (
                       <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-slate-800 hover:border-orange-500/50 bg-slate-950 transition-all cursor-default">
                         <div className="p-2 bg-slate-900 text-orange-500 rounded-lg border border-slate-800">
                           <Video size={20} />
                         </div>
                         <span className="font-semibold text-slate-300">{type}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;