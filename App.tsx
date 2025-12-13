import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Home from './pages/Home';
import ProductLibrary from './pages/ProductLibrary';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import BrandPortal from './pages/BrandPortal';
import Auth from './pages/Auth';
import TrendPulse from './pages/TrendPulse';
import VideoAudit from './pages/VideoAudit';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  // Minimalist active state
  const isActive = (path: string) => location.pathname === path ? "text-white font-medium" : "text-slate-400 hover:text-white transition-colors";

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0B0E14]/80 backdrop-blur-md border-b border-[#1F232D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center transform group-hover:rotate-3 transition-transform">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TITANS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8 text-sm">
            <Link to="/products" className={isActive('/products')}>Products</Link>
            <Link to="/trends" className={isActive('/trends')}>Trends</Link>
            <Link to="/audit" className={isActive('/audit')}>Video Audit</Link>
            <Link to="/brands" className={isActive('/brands')}>For Brands</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 bg-[#1F232D] rounded-full animate-pulse" />
            ) : user ? (
               <div className="flex items-center gap-4">
                 <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                   <div className="w-8 h-8 bg-[#1F232D] rounded-full flex items-center justify-center border border-[#2D3342]">
                     <User size={16} />
                   </div>
                   <span>Dashboard</span>
                 </Link>
                 <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-white transition-colors">Log Out</button>
               </div>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-400 hover:text-white font-medium transition-colors">Log In</Link>
                <Link to="/signup" className="bg-[#F97316] hover:bg-[#EA580C] text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0B0E14] border-b border-[#1F232D]">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link to="/products" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-[#161B26]">Products</Link>
            <Link to="/trends" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-[#161B26]">Trends</Link>
            <Link to="/audit" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-[#161B26]">Video Audit</Link>
            <Link to="/brands" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-[#161B26]">For Brands</Link>
            {user && (
              <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-[#161B26]">Dashboard</Link>
            )}
            <div className="border-t border-[#1F232D] my-4 pt-4">
              {user ? (
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-slate-400 hover:text-white">Log Out</button>
              ) : (
                <div className="flex flex-col gap-3 p-2">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="w-full text-center py-2 text-slate-300 border border-[#2D3342] rounded-lg hover:bg-[#161B26]">Log In</Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full text-center py-2 bg-[#F97316] text-white rounded-lg">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-[#0B0E14] text-slate-400 py-16 border-t border-[#1F232D]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="col-span-1 md:col-span-1">
        <span className="text-white font-bold text-xl tracking-tight">TITANS</span>
        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          The premier ecosystem for TikTok Shop professional creators.
        </p>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm">Platform</h3>
        <ul className="space-y-3 text-sm text-slate-500">
          <li><Link to="/products" className="hover:text-white transition-colors">Product Library</Link></li>
          <li><Link to="/trends" className="hover:text-white transition-colors">Trend Pulse</Link></li>
          <li><Link to="/audit" className="hover:text-white transition-colors">Video Audit</Link></li>
        </ul>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm">Company</h3>
        <ul className="space-y-3 text-sm text-slate-500">
          <li><Link to="/brands" className="hover:text-white transition-colors">For Brands</Link></li>
          <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm">Legal</h3>
        <ul className="space-y-3 text-sm text-slate-500">
          <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-[#1F232D] text-sm text-center text-slate-600">
      © {new Date().getFullYear()} Titans Creator Hub. All rights reserved.
    </div>
  </footer>
);

const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#0B0E14] font-sans text-slate-50 selection:bg-[#F97316] selection:text-white">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductLibrary />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/trends" element={<TrendPulse />} />
              <Route path="/audit" element={<VideoAudit />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/brands" element={<BrandPortal />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
