import React from 'react';
import { Package, Clock } from 'lucide-react';

const ProductLibrary = () => {
  return (
    <div className="min-h-screen bg-titan-bg flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-accent-teal/20 to-accent-fuchsia/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-accent-teal" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Coming Soon</h1>
        <p className="text-text-secondary mb-6">
          We're building something amazing. The product library will feature curated high-GMV products with direct sample requests.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-titan-surface border border-titan-border rounded-full text-sm text-text-muted">
          <Clock size={14} />
          Launching Q1 2025
        </div>
      </div>
    </div>
  );
};

export default ProductLibrary;
