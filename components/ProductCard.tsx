import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Copy, Gift } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-tiktok-cyan/50 shadow-lg flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_-10px_rgba(37,244,238,0.3)]">
      {/* Image Header */}
      <Link to={`/products/${product.id}`} className="relative h-48 overflow-hidden bg-slate-950">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
        
        <div className="absolute top-2 left-2">
          {product.gmv7DayLabel === 'Exploding' && (
            <span className="inline-flex items-center gap-1 bg-tiktok-pink/20 backdrop-blur-md border border-tiktok-pink/30 text-tiktok-pink text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              <TrendingUp size={12} />
              Viral
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-orange-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            {product.commissionRate}% Comm.
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-tiktok-cyan transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-medium">
            {product.category}
          </p>
          <p className="text-sm text-slate-400 mt-2 line-clamp-2">
            {product.tagline}
          </p>
        </Link>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex flex-col">
            <span className={`font-semibold ${product.sampleAvailable ? 'text-tiktok-cyan' : 'text-slate-600'}`}>
              {product.sampleAvailable ? 'Available' : 'No'}
            </span>
            <span>Sample</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="font-semibold text-white">{product.gmv7Day.toLocaleString()}</span>
            <span>7-Day GMV</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
           <button 
             onClick={handleCopy}
             className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
               copied 
                 ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                 : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
             }`}
           >
             <Copy size={14} />
             {copied ? 'Copied' : 'Link'}
           </button>
           <Link 
             to={`/products/${product.id}`}
             className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition-colors"
           >
             {product.sampleAvailable ? (
               <>
                 <Gift size={14} />
                 <span>Sample</span>
               </>
             ) : (
                <span>Details</span>
             )}
           </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;