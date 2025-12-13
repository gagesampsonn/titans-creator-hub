import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Copy, ArrowUpRight } from 'lucide-react';
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
    <div className="group bg-titan-surface rounded border border-titan-border hover:border-titan-border-light flex flex-col h-full overflow-hidden transition-all duration-200">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="relative h-40 overflow-hidden bg-titan-bg">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-titan-surface via-transparent to-transparent"></div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {product.gmv7DayLabel === 'Exploding' && (
            <span className="inline-flex items-center gap-1 bg-accent-fuchsia/20 border border-accent-fuchsia/30 text-accent-fuchsia text-[10px] font-semibold px-2 py-0.5 rounded">
              <TrendingUp size={10} />
              Viral
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className="bg-accent-teal/10 border border-accent-teal/20 text-accent-teal text-[10px] font-semibold px-2 py-0.5 rounded">
            {product.commissionRate}%
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="font-semibold text-text-primary text-sm line-clamp-1 group-hover:text-accent-teal transition-colors">
            {product.name}
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">
            {product.category}
          </p>
        </Link>

        <div className="mt-auto pt-4 flex items-center justify-between text-[10px] text-text-muted">
          <div>
            <span className={`block text-xs font-medium ${product.sampleAvailable ? 'text-accent-teal' : 'text-text-muted'}`}>
              {product.sampleAvailable ? 'Sample' : 'No Sample'}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-xs font-semibold text-text-primary">${product.gmv7Day.toLocaleString()}</span>
            <span>7d GMV</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button 
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-all ${
              copied 
                ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/30' 
                : 'bg-text-primary hover:bg-white text-titan-bg'
            }`}
          >
            <Copy size={12} />
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <Link 
            to={`/products/${product.id}`}
            className="flex items-center justify-center px-3 py-2 rounded border border-titan-border hover:border-titan-border-light text-text-secondary hover:text-text-primary text-xs transition-colors"
          >
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
