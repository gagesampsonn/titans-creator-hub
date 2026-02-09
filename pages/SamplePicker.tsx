import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Star, TrendingUp, ShieldCheck, Package, ArrowRight } from 'lucide-react';

// The 3 featured instant samples
// imageClip: CSS object-position to crop to the product area of each screenshot
const FEATURED_SAMPLES = [
  {
    id: 'goli',
    brand: 'Goli Nutrition',
    title: '3 Bottles Best Seller Bundle',
    subtitle: 'Ashwagandha, Apple Cider Vinegar & Matcha Mind Gummies',
    sold: '480.9K sold',
    rating: '4.6',
    reviews: '36.6K',
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
    accentColor: 'text-red-400',
    bgAccent: 'bg-red-500/10',
    link: 'https://affiliate-us.tiktok.com/api/v1/share/AJB5Ljr3LF8b',
    image: '/samples/goli.png',
    // Goli products are centered around 30% from top
    imagePosition: 'center 28%',
    tags: ['Gluten-Free', 'Vegan', 'Non-GMO'],
  },
  {
    id: 'selerb',
    brand: 'Selerb',
    title: 'NAD+ Supplement for Men',
    subtitle: 'Liposomal NAD+, CoQ10, L-Carnitine, L-Arginine — Energy & Vitality',
    sold: '58.4K sold',
    rating: '4.3',
    reviews: '3.9K',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    accentColor: 'text-blue-400',
    bgAccent: 'bg-blue-500/10',
    link: 'https://affiliate-us.tiktok.com/api/v1/share/AJAXuMmscNYh',
    image: '/samples/selerb.png',
    // Selerb products are around 35% from top
    imagePosition: 'center 32%',
    tags: ['Made in USA', '14-in-1 Formula'],
  },
  {
    id: 'nello',
    brand: 'Nello',
    title: 'SuperCalm Calming Drink Mix',
    subtitle: 'KSM-66 Ashwagandha, Vitamin D3, Magnesium & L-Theanine — Mood & Sleep',
    sold: '808K sold',
    rating: '4.5',
    reviews: '37.2K',
    color: 'from-teal-500/20 to-emerald-500/20',
    borderColor: 'border-teal-500/30',
    accentColor: 'text-teal-400',
    bgAccent: 'bg-teal-500/10',
    link: 'https://affiliate-us.tiktok.com/api/v1/share/AJHEC6cWt82f',
    image: '/samples/nello.png',
    // Nello products are around 28% from top
    imagePosition: 'center 25%',
    tags: ['Free Shipping', '20 Packets'],
  },
];

const SamplePicker = () => {
  return (
    <div className="min-h-screen bg-titan-bg relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-medium mb-3">
            <Gift size={14} />
            Free Samples — Limited Availability
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-2 sm:mb-3">
            Pick your free sample
          </h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto">
            Choose a product below and get it shipped to your door — free.
          </p>
        </div>

        {/* Product Cards — Mobile: horizontal cards, Desktop: 3-col grid */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-5 mb-8 sm:mb-12">
          {FEATURED_SAMPLES.map((sample) => (
            <a
              key={sample.id}
              href={sample.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative bg-titan-surface border ${sample.borderColor} rounded-2xl overflow-hidden hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 active:scale-[0.99]`}
            >
              {/* --- MOBILE LAYOUT: horizontal card --- */}
              <div className="flex sm:hidden">
                {/* Image (left side) - cropped to product */}
                <div className={`relative w-28 flex-shrink-0 bg-gradient-to-br ${sample.color} overflow-hidden`}>
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 bg-pink-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">
                    <Gift size={10} />
                    Free
                  </div>
                  <img 
                    src={sample.image} 
                    alt={`${sample.brand} products`}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: sample.imagePosition }}
                  />
                </div>

                {/* Info (right side) */}
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider mb-0.5">{sample.brand}</p>
                    <h3 className="text-sm font-bold text-text-primary leading-tight mb-1">{sample.title}</h3>
                    
                    {/* Stats row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-text-primary font-medium">{sample.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted">
                        <TrendingUp size={10} className={sample.accentColor} />
                        {sample.sold}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg text-xs text-center flex items-center justify-center gap-1.5">
                    Claim Free Sample
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* --- DESKTOP LAYOUT: vertical card --- */}
              <div className="hidden sm:block">
                {/* Free Sample Badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 bg-pink-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-lg">
                  <Gift size={12} />
                  Free sample
                </div>

                {/* Product Image - cropped to product area */}
                <div className={`bg-gradient-to-br ${sample.color} overflow-hidden h-52`}>
                  <img 
                    src={sample.image} 
                    alt={`${sample.brand} products`}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: sample.imagePosition }}
                  />
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-text-primary mb-1 leading-snug">{sample.title}</h3>
                  <p className="text-xs text-text-muted mb-3 line-clamp-2">{sample.subtitle}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-xs">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-text-primary font-medium">{sample.rating}</span>
                      <span className="text-text-muted">({sample.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <TrendingUp size={12} className={sample.accentColor} />
                      {sample.sold}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {sample.tags.map((tag) => (
                      <span key={tag} className={`px-2 py-0.5 ${sample.bgAccent} ${sample.accentColor} text-[10px] font-medium rounded-full`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl text-sm text-center group-hover:from-orange-600 group-hover:to-red-600 transition-all flex items-center justify-center gap-2">
                    Claim Free Sample
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Trust / Proof */}
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] sm:text-xs text-text-muted mb-4 sm:mb-6">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-accent-teal" />
              <span>100% free — no credit card</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Package size={13} className="text-accent-teal" />
              <span>Products ship direct to you</span>
            </div>
          </div>

          <p className="text-text-muted text-xs">
            Want unlimited samples?{' '}
            <Link to="/products" className="text-accent-teal hover:text-text-primary font-medium underline underline-offset-2">
              Browse all products
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SamplePicker;
