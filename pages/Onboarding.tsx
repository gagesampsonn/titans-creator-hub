import React from 'react';
import { ChevronRight, Users, Zap, DollarSign, Video, CheckCircle, ExternalLink } from 'lucide-react';

const Onboarding = () => {
  const whopUrl = 'https://whop.com/joined/tiktokshopaffiliate/';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-[#0d0d0d] to-[#0a0a0a] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-orange-500/20 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-radial from-rose-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            You're in! Welcome to the family
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Welcome to </span>
            <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-orange-500 bg-clip-text text-transparent">TikTok Titans</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Your journey to TikTok Shop success starts here. Watch the video below to get set up.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative mb-10">
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
                <span className="text-xs text-gray-400 hidden sm:block">UPDATED: Onboarding with TikTok Titans</span>
              </div>
              <a 
                href={whopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Open Discord
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            
            {/* Loom Video Embed */}
            <div className="relative rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe 
                src="https://www.loom.com/embed/0bdf8aa83f574ed99077cb0a31711f89?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true" 
                frameBorder="0" 
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* CTA Text */}
        <p className="text-center text-gray-400 mb-6">
          Watch the video above, then join the Discord to get started
        </p>

        {/* Main CTA Button */}
        <div className="flex justify-center mb-16">
          <a
            href={whopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
          >
            Open Discord
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Quick Start Steps */}
        <div className="border-t border-gray-800 pt-16 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-4">
            Quick Start Guide
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
            Follow these steps to get the most out of your Titans membership
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Watch the Video</h3>
              <p className="text-sm text-gray-400">Learn how the Discord is organized and where to find everything</p>
            </div>

            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Join Discord</h3>
              <p className="text-sm text-gray-400">Click the button above to access your Discord channels via Whop</p>
            </div>

            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Start Creating</h3>
              <p className="text-sm text-gray-400">Check out #daily-assignments and start posting content</p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="border-t border-gray-800 pt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-4">
            What's Included in Your Membership
          </h2>
          <p className="text-center text-gray-400 mb-12 max-w-xl mx-auto">
            Here's everything you now have access to as a Titan
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Community Access</h3>
              <p className="text-sm text-gray-400">Connect with 3,600+ creators in our private Discord</p>
            </div>

            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Daily Assignments</h3>
              <p className="text-sm text-gray-400">Get daily content tasks to keep you consistent and growing</p>
            </div>

            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Brand Deals</h3>
              <p className="text-sm text-gray-400">Access exclusive brand partnerships and higher commissions</p>
            </div>

            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 hover:border-orange-500/30 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Coaching</h3>
              <p className="text-sm text-gray-400">Weekly live calls with top performers and agency leads</p>
            </div>
          </div>
        </div>

        {/* Agency Application CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-8 md:p-12 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Want Full Dashboard Access?
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Apply to become a linked Titans Agency creator and get access to your personalized dashboard with sales metrics, top products, and more.
            </p>
            <a
              href="#/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl shadow-lg transition-all duration-300"
            >
              Create Account & Apply
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-500 text-sm mt-12">
          Questions? Ask in the{' '}
          <a href={whopUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline">
            Discord community
          </a>
          {' '}or DM an admin
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
