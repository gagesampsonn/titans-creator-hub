import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';

const TrendPulse = () => {
  return (
    <div className="min-h-screen bg-titan-bg flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-accent-teal/20 to-accent-fuchsia/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-accent-teal" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">Coming Soon</h1>
        <p className="text-text-secondary mb-6">
          Real-time trend intelligence is under development. Soon you'll get AI-powered insights from TikTok, Twitter, and more to find viral content opportunities.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-titan-surface border border-titan-border rounded-full text-sm text-text-muted">
          <Clock size={14} />
          Launching Q1 2025
        </div>
      </div>
    </div>
  );
};

export default TrendPulse;
