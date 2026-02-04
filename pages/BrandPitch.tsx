import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play,
  DollarSign,
  TrendingUp,
  Users,
  Video,
  Package,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Calendar,
  ArrowRight,
  Mail,
  MessageCircle,
  X,
  Copy,
  Check,
  Phone,
  BarChart3,
  Sparkles,
  Eye,
  ShoppingCart,
  Heart,
  Clock,
  Award,
  Star,
  Building2,
  Repeat,
  Timer,
  FileText,
  HelpCircle,
  Quote,
  Rocket,
  Shield,
  ThumbsUp
} from 'lucide-react';

// Top videos data from CSV
const TOP_VIDEOS = [
  { gmv: 87226, views: 1861504, likes: 10973, orders: 1971 },
  { gmv: 80517, views: 1614823, likes: 14229, orders: 2106 },
  { gmv: 35529, views: 2523319, likes: 21094, orders: 2362 },
  { gmv: 34829, views: 2479849, likes: 17947, orders: 889 },
  { gmv: 34373, views: 1329357, likes: 27959, orders: 961 },
  { gmv: 33784, views: 1223558, likes: 10075, orders: 880 },
  { gmv: 29815, views: 3365113, likes: 138374, orders: 815 },
  { gmv: 27892, views: 671732, likes: 2628, orders: 769 },
  { gmv: 27430, views: 1689132, likes: 26287, orders: 1237 },
];

const BRAND_LOGOS = [
  'Goli', 'Dude Wipes', 'Why Not Natural', 'Selerb', 
  'Nello', 'Supercalm', 'Natural Stacks', 'Kosas'
];

// Animated counter hook
const useAnimatedCounter = (end: number, duration: number = 2000, start: number = 0, shouldAnimate: boolean = true) => {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    if (!shouldAnimate) {
      setCount(start);
      return;
    }
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(start + (end - start) * easeOutQuart));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start, shouldAnimate]);
  
  return count;
};

// Format number with commas
const formatNumber = (num: number) => num.toLocaleString();

// Contact Modal
const ContactModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const email = 'tiktoktitansmanagement@gmail.com';
  const whatsapp = '7403570482';

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={28} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Let's Talk</h3>
          <p className="text-gray-400 text-sm">Ready to scale your brand on TikTok Shop?</p>
        </div>
        <div className="space-y-4">
          <div className="bg-black/30 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Mail size={18} className="text-orange-400" />
              <span className="text-sm text-gray-400">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm flex-1 truncate">{email}</span>
              <button
                onClick={copyEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-lg hover:bg-orange-500/30 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <a
            href={`https://wa.me/1${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-black/30 border border-gray-800 rounded-xl p-4 hover:border-green-500/50 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Phone size={18} className="text-green-400" />
              <span className="text-sm text-gray-400">WhatsApp</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">(740) 357-0482</span>
              <span className="text-xs text-green-400 group-hover:underline">Open Chat →</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

// ============ SLIDE COMPONENTS ============

// Slide 1: Hook
const SlideHook = ({ isActive }: { isActive: boolean }) => {
  const gmv = useAnimatedCounter(2743143, 2500, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-full text-rose-400 text-sm font-medium mb-8 animate-pulse">
          <AlertTriangle size={16} />
          Most brands are bleeding money on TikTok Shop
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          We've generated{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
            ${formatNumber(gmv)}+
          </span>
          {' '}in GMV
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12">
          for brands on TikTok Shop
        </p>
        
        <div className="flex items-center justify-center gap-2 text-gray-500 animate-bounce">
          <span className="text-sm">Tap to continue</span>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};

// Slide 2: Who We Are
const SlideWhoWeAre = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Rocket size={40} className="text-white" />
        </div>
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          We are <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Titans</span>
        </h2>
        
        <p className="text-xl text-gray-400 mb-8">
          The largest TikTok Shop creator community & agency
        </p>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">3,600+</p>
            <p className="text-xs text-gray-500">Creators</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">60+</p>
            <p className="text-xs text-gray-500">Brand Partners</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">$5.2M+</p>
            <p className="text-xs text-gray-500">Total GMV</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 3: Brands We've Worked With
const SlideBrands = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Top Brands</span>
        </h2>
        <p className="text-gray-400 mb-12">Some of the brands that trust us with their TikTok Shop growth</p>
        
        <div className="grid grid-cols-4 gap-4">
          {BRAND_LOGOS.map((brand, i) => (
            <div 
              key={i}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-orange-500/30 transition-all"
            >
              <p className="text-white font-semibold">{brand}</p>
            </div>
          ))}
        </div>
        
        <p className="text-gray-500 text-sm mt-8">And 50+ more brands across health, beauty, wellness & lifestyle</p>
      </div>
    </div>
  );
};

// Slide 4: The Problem Intro
const SlideProblemIntro = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-8">
          <AlertTriangle size={16} />
          The Problem
        </div>
        
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Why most brands <span className="text-red-400">fail</span> on TikTok Shop
        </h2>
        
        <p className="text-xl text-gray-400">
          3 costly mistakes we see every day...
        </p>
      </div>
    </div>
  );
};

// Slide 5: Problem #1 - Sample Trap
const SlideProblem1 = ({ isActive }: { isActive: boolean }) => {
  const samples = useAnimatedCounter(500, 2000, 0, isActive);
  const cost = useAnimatedCounter(15000, 2000, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-8">
          <Package size={16} />
          Mistake #1
        </div>
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
          The <span className="text-red-400">Sample Trap</span>
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
          <p className="text-xl text-gray-300 mb-6">
            Brands ship <span className="text-white font-bold text-3xl">{samples}+</span> free products
          </p>
          <p className="text-gray-400 mb-6">hoping for ONE viral video...</p>
          
          <div className="flex items-center justify-center gap-4 text-lg">
            <span className="text-gray-500">Cost:</span>
            <span className="text-red-400 font-bold text-2xl">${formatNumber(cost)}</span>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-lg">Guaranteed results?</p>
            <p className="text-red-400 font-bold text-2xl mt-2">ZERO</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 6: Problem #2 - Agency Drain
const SlideProblem2 = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-8">
          <DollarSign size={16} />
          Mistake #2
        </div>
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
          The <span className="text-red-400">Agency Drain</span>
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
          <p className="text-xl text-gray-300 mb-4">
            Paying agencies
          </p>
          <p className="text-4xl md:text-5xl font-bold text-red-400 mb-6">
            $10K - $50K<span className="text-xl text-gray-500">/month</span>
          </p>
          
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-400 mb-4">What you actually get:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Meetings', 'Reports', 'Excuses', 'More meetings'].map((item, i) => (
                <span key={i} className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 7: Problem #3 - DIY Disaster
const SlideProblem3 = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium mb-8">
          <Timer size={16} />
          Mistake #3
        </div>
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
          The <span className="text-red-400">DIY Disaster</span>
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
          <p className="text-xl text-gray-300 mb-6">
            Trying to find and manage creators yourself
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-red-400">40+</p>
              <p className="text-xs text-gray-500">hours/week wasted</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-red-400">80%</p>
              <p className="text-xs text-gray-500">no-show rate</p>
            </div>
          </div>
          
          <p className="text-gray-500 mt-6">
            You have a business to run. This isn't it.
          </p>
        </div>
      </div>
    </div>
  );
};

// Slide 8: The Solution Intro
const SlideSolutionIntro = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-8">
          <Zap size={16} />
          The Solution
        </div>
        
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          There's a <span className="text-green-400">better way</span>
        </h2>
        
        <p className="text-xl text-gray-400">
          What if ONE video could change everything?
        </p>
      </div>
    </div>
  );
};

// Slide 9: One Video Reality
const SlideOneVideo = ({ isActive }: { isActive: boolean }) => {
  const gmv = useAnimatedCounter(87226, 2000, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          <span className="text-green-400">ONE</span> video. Real results.
        </h2>
        
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8">
          <p className="text-gray-400 mb-4">Actual result from a single creator video:</p>
          
          <div className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-6">
            ${formatNumber(gmv)}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">1.8M</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">1,971</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">10.9K</p>
              <p className="text-xs text-gray-500">Likes</p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 mt-8 text-lg">
          One creator. One video. One day.
        </p>
      </div>
    </div>
  );
};

// Slide 10: Case Study Intro
const SlideCaseStudyIntro = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-8">
          <Award size={16} />
          Case Studies
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Real wins. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Real numbers.</span>
        </h2>
        
        <p className="text-xl text-gray-400">
          Let's look at our top performers...
        </p>
      </div>
    </div>
  );
};

// Slide 11: Case Study #1
const SlideCaseStudy1 = ({ isActive }: { isActive: boolean }) => {
  const gmv = useAnimatedCounter(87226, 2000, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium mb-6">
          <Star size={16} />
          Top Performer
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Health & Wellness Brand
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 mb-4">
            ${formatNumber(gmv)}
          </div>
          <p className="text-gray-400 mb-6">from a single video</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-xl p-4">
              <Eye size={20} className="text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">1.86M</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <ShoppingCart size={20} className="text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">1,971</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              <span className="text-green-400 font-semibold">$44 average order value</span> • Posted Feb 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 12: Case Study #2
const SlideCaseStudy2 = ({ isActive }: { isActive: boolean }) => {
  const gmv = useAnimatedCounter(80517, 2000, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
          <TrendingUp size={16} />
          High Converter
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Beauty & Skincare Brand
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4">
            ${formatNumber(gmv)}
          </div>
          <p className="text-gray-400 mb-6">from a single video</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-xl p-4">
              <Eye size={20} className="text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">1.61M</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
            <div className="bg-black/30 rounded-xl p-4">
              <ShoppingCart size={20} className="text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-white">2,106</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">
              <span className="text-green-400 font-semibold">0.13% conversion rate</span> • March 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 13: Case Study #3 - Viral Hit
const SlideCaseStudy3 = ({ isActive }: { isActive: boolean }) => {
  const views = useAnimatedCounter(3365113, 2000, 0, isActive);
  const likes = useAnimatedCounter(138374, 2000, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full text-pink-400 text-sm font-medium mb-6">
          <Heart size={16} />
          Viral Hit
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          The Engagement Monster
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                {(views / 1000000).toFixed(1)}M
              </p>
              <p className="text-gray-400">Views</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
                {formatNumber(likes)}
              </p>
              <p className="text-gray-400">Likes</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30 rounded-xl p-4">
            <p className="text-white font-semibold">$29,815 GMV</p>
            <p className="text-xs text-gray-400">Plus massive brand awareness</p>
          </div>
          
          <p className="text-gray-500 mt-6 text-sm">
            4.1% engagement rate • Organic reach explosion
          </p>
        </div>
      </div>
    </div>
  );
};

// Slide 14: Proof Wall
const SlideProofWall = ({ isActive }: { isActive: boolean }) => {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            More <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">Winners</span>
          </h2>
          <p className="text-gray-400 text-sm">Tap any to see details</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {TOP_VIDEOS.map((video, i) => (
            <button
              key={i}
              onClick={() => setSelectedVideo(selectedVideo === i ? null : i)}
              className={`p-3 md:p-4 rounded-xl border transition-all duration-300 text-left ${
                selectedVideo === i 
                  ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 border-orange-500/50 scale-105' 
                  : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
              }`}
            >
              <p className="text-base md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
                ${formatNumber(video.gmv)}
              </p>
              
              {selectedVideo === i && (
                <div className="mt-3 pt-3 border-t border-gray-700 space-y-1 animate-fadeIn text-xs">
                  <div className="flex items-center gap-1">
                    <Eye size={12} className="text-blue-400" />
                    <span className="text-gray-400">{formatNumber(video.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={12} className="text-pink-400" />
                    <span className="text-gray-400">{formatNumber(video.likes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart size={12} className="text-green-400" />
                    <span className="text-gray-400">{formatNumber(video.orders)}</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Slide 15: Total Stats
const SlideTotals = ({ isActive }: { isActive: boolean }) => {
  const gmv = useAnimatedCounter(2743143, 2500, 0, isActive);
  const views = useAnimatedCounter(237032598, 2500, 0, isActive);
  const likes = useAnimatedCounter(4183007, 2500, 0, isActive);
  const orders = useAnimatedCounter(70853, 2500, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
          2025 Results <span className="text-gray-500">(YTD)</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-rose-500/10 border border-orange-500/30 rounded-2xl p-6">
            <DollarSign size={28} className="text-orange-400 mx-auto mb-3" />
            <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">
              ${(gmv / 1000000).toFixed(2)}M
            </p>
            <p className="text-gray-400 text-sm mt-1">GMV Generated</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <Eye size={28} className="text-blue-400 mx-auto mb-3" />
            <p className="text-3xl md:text-4xl font-bold text-white">
              {(views / 1000000).toFixed(0)}M+
            </p>
            <p className="text-gray-400 text-sm mt-1">Views</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <Heart size={28} className="text-pink-400 mx-auto mb-3" />
            <p className="text-3xl md:text-4xl font-bold text-white">
              {(likes / 1000000).toFixed(1)}M+
            </p>
            <p className="text-gray-400 text-sm mt-1">Likes</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <ShoppingCart size={28} className="text-green-400 mx-auto mb-3" />
            <p className="text-3xl md:text-4xl font-bold text-white">
              {formatNumber(orders)}
            </p>
            <p className="text-gray-400 text-sm mt-1">Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 16: How We Do It Intro
const SlideHowIntro = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-8">
          <Sparkles size={16} />
          Our Process
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          How do we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">do it?</span>
        </h2>
        
        <p className="text-xl text-gray-400">
          A proven system that works for every brand
        </p>
      </div>
    </div>
  );
};

// Slide 17: Creator Network
const SlideCreatorNetwork = ({ isActive }: { isActive: boolean }) => {
  const creators = useAnimatedCounter(3600, 2000, 0, isActive);
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {formatNumber(creators)}+
          </span> Active Creators
        </h2>
        
        <p className="text-xl text-gray-400 mb-10">
          Not random creators. <span className="text-white font-semibold">Proven sellers.</span>
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-sm">
              Top
            </div>
            <p className="text-white font-semibold text-sm">$87K</p>
            <p className="text-[10px] text-gray-500">single video</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-sm">
              15+
            </div>
            <p className="text-white font-semibold text-sm">$150K+</p>
            <p className="text-[10px] text-gray-500">consistent</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap size={16} className="text-white" />
            </div>
            <p className="text-white font-semibold text-sm">New</p>
            <p className="text-[10px] text-gray-500">daily</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 18: Matching Process
const SlideMatching = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Creator Matching</span>
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target size={24} className="text-purple-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Niche Alignment</p>
              <p className="text-sm text-gray-400">Creators who already love your product category</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 size={24} className="text-pink-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Performance History</p>
              <p className="text-sm text-gray-400">Track record of driving actual sales</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={24} className="text-cyan-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Audience Fit</p>
              <p className="text-sm text-gray-400">Demographics match your ideal customer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 19: Content That Converts
const SlideContentConverts = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Content That <span className="text-green-400">Converts</span>
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <X size={32} className="text-red-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Random Content</p>
            <p className="text-3xl font-bold text-red-400">500</p>
            <p className="text-xs text-gray-500">views</p>
            <p className="text-xl font-bold text-red-400 mt-2">$0</p>
            <p className="text-xs text-gray-500">GMV</p>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Titans Content</p>
            <p className="text-3xl font-bold text-green-400">500K</p>
            <p className="text-xs text-gray-500">views</p>
            <p className="text-xl font-bold text-green-400 mt-2">$30K+</p>
            <p className="text-xs text-gray-500">GMV</p>
          </div>
        </div>
        
          <p className="text-gray-500 mt-8 text-sm">
            Strategic content &gt; random content
          </p>
      </div>
    </div>
  );
};

// Slide 20: Campaign Timeline
const SlideTimeline = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500">44-Day</span> Campaign
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-white font-semibold">Days 1-14</p>
                <p className="text-sm text-gray-400">Onboarding & Creator Matching</p>
              </div>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Setup</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-white font-semibold">Days 15-30</p>
                <p className="text-sm text-gray-400">Content Creation & Posting</p>
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Active</span>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-white font-semibold">Days 31-44</p>
                <p className="text-sm text-gray-400">Optimization & Results</p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Scale</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 mt-8 text-sm">
          225+ videos guaranteed over the campaign period
        </p>
      </div>
    </div>
  );
};

// Slide 21: Why Retainers
const SlideRetainer = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-8">
          <Repeat size={16} />
          The Model
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Why <span className="text-purple-400">Monthly</span> Works
        </h2>
        
        <p className="text-gray-400 mb-8">
          Consistency beats one-off campaigns every time
        </p>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-end justify-center gap-4 mb-6 h-32">
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gradient-to-t from-orange-500/50 to-orange-500 rounded-t" style={{height: '40px'}} />
              <p className="text-xs text-gray-500 mt-2">M1</p>
              <p className="text-sm text-white font-semibold">$30K</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gradient-to-t from-orange-500/50 to-orange-500 rounded-t" style={{height: '70px'}} />
              <p className="text-xs text-gray-500 mt-2">M2</p>
              <p className="text-sm text-white font-semibold">$65K</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gradient-to-t from-orange-500/50 to-orange-500 rounded-t" style={{height: '100px'}} />
              <p className="text-xs text-gray-500 mt-2">M3</p>
              <p className="text-sm text-white font-semibold">$95K</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 bg-gradient-to-t from-green-500/50 to-green-500 rounded-t" style={{height: '128px'}} />
              <p className="text-xs text-gray-500 mt-2">M4</p>
              <p className="text-sm text-green-400 font-semibold">$120K+</p>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">Compounding growth with consistent content</p>
        </div>
      </div>
    </div>
  );
};

// Slide 22: ROI
const SlideROI = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          The <span className="text-green-400">ROI</span> Math
        </h2>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <span className="text-gray-400">Average video GMV</span>
            <span className="text-white font-bold">$5,000 - $30,000</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <span className="text-gray-400">Videos per campaign</span>
            <span className="text-white font-bold">225+</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <span className="text-gray-400">Conservative estimate</span>
            <span className="text-white font-bold">$50K - $100K GMV</span>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <span className="text-gray-400">Potential ROI</span>
            <span className="text-green-400 font-bold text-2xl">5-20x</span>
          </div>
        </div>
        
        <p className="text-gray-500 mt-6 text-sm">
          *Results vary. Top performers see even higher returns.
        </p>
      </div>
    </div>
  );
};

// Slide 23: What You Get
const SlidePackage = ({ isActive }: { isActive: boolean }) => {
  const items = [
    { icon: Video, text: '225+ guaranteed videos' },
    { icon: Users, text: '225+ matched creators' },
    { icon: Package, text: 'Sample logistics handled' },
    { icon: BarChart3, text: 'Performance tracking' },
    { icon: Calendar, text: 'Strategy calls' },
    { icon: Target, text: 'Niche matching' },
  ];
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          What You Get
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-left"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-rose-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon size={18} className="text-orange-400" />
              </div>
              <span className="text-white text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Slide 24: Social Proof / Testimonials
const SlideTestimonials = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          What Brands Say
        </h2>
        
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left relative">
            <Quote size={24} className="text-orange-500/30 absolute top-4 right-4" />
            <p className="text-gray-300 mb-4">
              "Titans delivered more results in 30 days than our agency did in 6 months. The quality of creators and content is unmatched."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Sarah K.</p>
                <p className="text-xs text-gray-500">Health & Wellness Brand</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left relative">
            <Quote size={24} className="text-blue-500/30 absolute top-4 right-4" />
            <p className="text-gray-300 mb-4">
              "We went from struggling to find creators to having consistent content every single week. Game changer."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                M
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Mike R.</p>
                <p className="text-xs text-gray-500">Beauty Brand Founder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide 25: FAQ
const SlideFAQ = ({ isActive }: { isActive: boolean }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const faqs = [
    { q: 'How many samples do I need?', a: 'Minimum 10, most brands send 35-75 for best results.' },
    { q: 'What if videos don\'t perform?', a: 'We guarantee 225+ videos. Some will be hits, that\'s how TikTok works.' },
    { q: 'How do I track results?', a: 'Full dashboard access with real-time GMV, views, and order tracking.' },
  ];
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          Quick <span className="text-gray-400">Questions</span>
        </h2>
        
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-left hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold">{faq.q}</p>
                <ChevronRight size={16} className={`text-gray-500 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
              </div>
              {openFaq === i && (
                <p className="text-gray-400 text-sm mt-3 pt-3 border-t border-gray-800 animate-fadeIn">
                  {faq.a}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Slide 26: CTA
const SlideCTA = ({ onContact }: { onContact: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-8">
          <CheckCircle size={16} />
          Ready to Scale?
        </div>
        
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Stop sending samples into the void.
        </h2>
        
        <p className="text-xl text-gray-400 mb-12">
          Start seeing results like these.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onContact}
            className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Mail size={20} />
            Contact Our Team
          </button>
          
          <a
            href="https://whop.com/checkout/plan_rBAHh3s9NPXZR"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            Start Your Campaign
            <ArrowRight size={18} />
          </a>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          We only take 5 new brands per month
        </p>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============

const BrandPitch = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showContact, setShowContact] = useState(false);
  
  const slides = [
    { id: 'hook', component: SlideHook },
    { id: 'who', component: SlideWhoWeAre },
    { id: 'brands', component: SlideBrands },
    { id: 'problem-intro', component: SlideProblemIntro },
    { id: 'problem1', component: SlideProblem1 },
    { id: 'problem2', component: SlideProblem2 },
    { id: 'problem3', component: SlideProblem3 },
    { id: 'solution-intro', component: SlideSolutionIntro },
    { id: 'one-video', component: SlideOneVideo },
    { id: 'case-intro', component: SlideCaseStudyIntro },
    { id: 'case1', component: SlideCaseStudy1 },
    { id: 'case2', component: SlideCaseStudy2 },
    { id: 'case3', component: SlideCaseStudy3 },
    { id: 'proof', component: SlideProofWall },
    { id: 'totals', component: SlideTotals },
    { id: 'how-intro', component: SlideHowIntro },
    { id: 'network', component: SlideCreatorNetwork },
    { id: 'matching', component: SlideMatching },
    { id: 'content', component: SlideContentConverts },
    { id: 'timeline', component: SlideTimeline },
    { id: 'retainer', component: SlideRetainer },
    { id: 'roi', component: SlideROI },
    { id: 'package', component: SlidePackage },
    { id: 'testimonials', component: SlideTestimonials },
    { id: 'faq', component: SlideFAQ },
    { id: 'cta', component: SlideCTA },
  ];
  
  const totalSlides = slides.length;
  
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);
  
  const nextSlide = useCallback(() => {
    goToSlide(Math.min(currentSlide + 1, totalSlides - 1));
  }, [currentSlide, goToSlide, totalSlides]);
  
  const prevSlide = useCallback(() => {
    goToSlide(Math.max(currentSlide - 1, 0));
  }, [currentSlide, goToSlide]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);
  
  // Touch/swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    setTouchStart(null);
  };
  
  const SlideComponent = slides[currentSlide].component;
  
  return (
    <div 
      className="fixed inset-0 bg-[#0a0a0a] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px]" />
      </div>
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/titans-logo.png" alt="Titans" className="w-8 h-8" />
          <span className="text-white font-semibold hidden sm:block">TITANS</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {currentSlide + 1} / {totalSlides}
          </span>
          <button
            onClick={() => setShowContact(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            Contact
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
        />
      </div>
      
      {/* Main slide area */}
      <div 
        className="h-full pt-16 pb-20 cursor-pointer"
        onClick={nextSlide}
      >
        {slides[currentSlide].id === 'cta' ? (
          <SlideCTA onContact={() => setShowContact(true)} />
        ) : (
          <SlideComponent isActive={true} />
        )}
      </div>
      
      {/* Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between z-50">
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          disabled={currentSlide === 0}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
            currentSlide === 0 
              ? 'border-gray-800 text-gray-700 cursor-not-allowed' 
              : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
          }`}
        >
          <ChevronLeft size={24} />
        </button>
        
        {/* Slide dots - show subset on mobile */}
        <div className="flex items-center gap-1">
          {slides.map((_, i) => {
            // Show current, +/- 3 slides, first and last
            const showDot = i === 0 || i === totalSlides - 1 || Math.abs(i - currentSlide) <= 3;
            if (!showDot) {
              if (i === currentSlide - 4 || i === currentSlide + 4) {
                return <span key={i} className="text-gray-600 text-xs">...</span>;
              }
              return null;
            }
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goToSlide(i); }}
                className={`h-2 rounded-full transition-all ${
                  i === currentSlide 
                    ? 'w-6 bg-gradient-to-r from-orange-500 to-rose-500' 
                    : 'w-2 bg-gray-700 hover:bg-gray-600'
                }`}
              />
            );
          })}
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          disabled={currentSlide === totalSlides - 1}
          className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
            currentSlide === totalSlides - 1 
              ? 'border-gray-800 text-gray-700 cursor-not-allowed' 
              : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
          }`}
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Contact Modal */}
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
      
      {/* Custom styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BrandPitch;
