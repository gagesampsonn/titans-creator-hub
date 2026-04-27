import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Users, TrendingUp, ArrowRight } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-titan-bg">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12 sm:py-16">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Company</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-6">About Titans</h1>

        <div className="space-y-6 text-text-secondary text-sm sm:text-base leading-relaxed">
          <p>
            Titans is a TikTok Shop–focused creator platform. We help affiliates get products in hand, ship better content, and
            grow GMV with tools, data, and community—not generic “tips.”
          </p>
          <p>
            Our hub brings together sample requests, performance tracking, trend signals, and education so creators can work
            like operators, not guessers.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 my-10">
          {[
            { icon: Users, label: 'Active creators', value: '3,600+' },
            { icon: TrendingUp, label: 'GMV driven', value: '$5.2M+' },
            { icon: Gift, label: 'Brand partners', value: '60+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-titan-border bg-titan-surface p-4 text-center">
              <Icon className="w-5 h-5 text-accent-teal mx-auto mb-2" />
              <p className="text-lg font-semibold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/samples"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <Gift size={16} />
            Get free samples
          </Link>
          <Link
            to="/wins"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-titan-border bg-titan-surface text-text-primary font-medium text-sm hover:border-titan-border-light transition-all"
          >
            See creator wins
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
