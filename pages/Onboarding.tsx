import React, { useState } from 'react';
import { ChevronRight, Users, Zap, DollarSign, Video, CheckCircle, ExternalLink, AlertTriangle, MessageCircle, Gift, TrendingUp, Star, ArrowDown } from 'lucide-react';

const Onboarding = () => {
  const discordUrl = 'https://whop.com/joined/tiktokshopaffiliate/discord-Guw8LukfTRVzNr/app/';
  const [pulseCount, setPulseCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-[#0d0d0d] to-[#0a0a0a] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-orange-500/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-rose-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            Payment Received - You're In!
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Welcome to </span>
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-orange-500 bg-clip-text text-transparent">TikTok Titans</span>
          </h1>
        </div>

        {/* CRITICAL ALERT BOX */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/50 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center animate-bounce">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                ⚠️ DON'T SKIP THIS STEP
              </h2>
              <p className="text-lg text-amber-200/90 mb-1">
                <span className="font-bold text-white">Everything you need is in the Discord.</span>
              </p>
              <p className="text-amber-200/70">
                Brand deals, daily assignments, free samples, community support, livestreams — it's ALL there.
                <br />
                <span className="text-amber-400 font-semibold">You won't have access to ANYTHING without connecting Discord.</span>
              </p>
            </div>
          </div>
        </div>

        {/* MASSIVE DISCORD CTA */}
        <div className="relative mb-8">
          {/* Pulsing ring effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2] to-[#7289DA] rounded-2xl blur-xl opacity-40 animate-pulse" />
          
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block bg-gradient-to-r from-[#5865F2] to-[#7289DA] hover:from-[#4752C4] hover:to-[#5B6EAE] rounded-2xl p-8 md:p-10 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#5865F2]/30 group"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Discord Logo */}
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-[#5865F2]" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Connect Your Discord NOW
                </h3>
                <p className="text-white/80 text-lg mb-4">
                  Click here to link your Discord account and get full access
                </p>
              </div>
              
              <div className="flex items-center gap-2 px-6 py-3 bg-white text-[#5865F2] font-bold text-lg rounded-xl group-hover:bg-gray-100 transition-colors">
                Open Discord
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
          </a>
        </div>

        {/* Arrow pointing down */}
        <div className="flex justify-center mb-6">
          <ArrowDown className="w-8 h-8 text-gray-500 animate-bounce" />
        </div>

        {/* What you're missing without Discord */}
        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6 md:p-8 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
            What's Waiting for You in Discord
          </h2>
          <p className="text-center text-gray-400 mb-8">
            You're paying for this — make sure you actually use it
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <Gift className="w-10 h-10 text-orange-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Free Samples</h3>
              <p className="text-sm text-gray-400">Get products for free from brands</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <DollarSign className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Brand Deals</h3>
              <p className="text-sm text-gray-400">Paid sponsorships & retainers</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <Zap className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Daily Assignments</h3>
              <p className="text-sm text-gray-400">Know exactly what to post</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">3,600+ Creators</h3>
              <p className="text-sm text-gray-400">Community support & tips</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <Video className="w-10 h-10 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Live Coaching</h3>
              <p className="text-sm text-gray-400">Weekly livestreams with pros</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <TrendingUp className="w-10 h-10 text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Trending Products</h3>
              <p className="text-sm text-gray-400">What's selling right now</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <Star className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">VIP Channels</h3>
              <p className="text-sm text-gray-400">Exclusive content & updates</p>
            </div>

            <div className="bg-black/30 border border-gray-700/50 rounded-xl p-5 text-center hover:border-orange-500/50 transition-colors">
              <MessageCircle className="w-10 h-10 text-cyan-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-1">Direct Support</h3>
              <p className="text-sm text-gray-400">Get help from the team</p>
            </div>
          </div>
        </div>

        {/* Secondary CTA */}
        <div className="flex justify-center mb-12">
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xl rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join the Discord Now
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Video Container - Secondary */}
        <div className="border-t border-gray-800 pt-12 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-2">
            Watch: How to Get Started
          </h2>
          <p className="text-center text-gray-400 mb-8">
            Quick walkthrough of the Discord and how everything works
          </p>
          
          <div className="relative max-w-3xl mx-auto">
            {/* Laptop frame effect */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-3 md:p-4 shadow-2xl shadow-orange-500/10 border border-gray-700/50">
              {/* Video header bar */}
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:block">Titans Onboarding Walkthrough</span>
                </div>
              </div>
              
              {/* Loom Video Embed */}
              <div className="relative rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe 
                  src="https://www.loom.com/embed/0bdf8aa83f574ed99077cb0a31711f89" 
                  frameBorder="0" 
                  webkitallowfullscreen="true"
                  mozallowfullscreen="true"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA with reminder */}
        <div className="bg-gradient-to-r from-[#5865F2]/20 to-[#7289DA]/20 border border-[#5865F2]/30 rounded-2xl p-8 md:p-10 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Still haven't connected Discord?
          </h3>
          <p className="text-gray-300 mb-6 max-w-lg mx-auto">
            Seriously — don't be the person paying for Titans and not using it. 
            <span className="text-amber-400 font-medium"> Everything is in the Discord.</span>
          </p>
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Connect Discord Now
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-10">
          Having trouble? DM @gagesampson on Whop or email tiktoktitansmanagement@gmail.com
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
