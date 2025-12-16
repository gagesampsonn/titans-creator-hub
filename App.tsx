import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, ChevronRight } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Home from './pages/Home';
import ProductLibrary from './pages/ProductLibrary';
import ProductDetail from './pages/ProductDetail';
import Dashboard from './pages/Dashboard';
import BrandPortal from './pages/BrandPortal';
import Auth from './pages/Auth';
import TrendPulse from './pages/TrendPulse';
import VideoAudit from './pages/VideoAudit';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Profile from './pages/Profile';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  const isActive = (path: string) => 
    location.pathname === path 
      ? "text-text-primary font-medium" 
      : "text-text-secondary hover:text-text-primary transition-colors duration-200";

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-titan-bg/90 backdrop-blur-md border-b border-titan-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/titans-logo.png" alt="Titans" className="w-8 h-8 object-contain" />
            <span className="text-base font-semibold text-text-primary tracking-tight">TITANS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/products" className={isActive('/products')}>Products</Link>
            <Link to="/trends" className={isActive('/trends')}>Trends</Link>
            <Link to="/audit" className={isActive('/audit')}>Video Audit</Link>
            <Link to="/brands" className={isActive('/brands')}>For Brands</Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-7 h-7 bg-titan-surface rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/profile" 
                  className="w-8 h-8 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                  title="Profile"
                >
                  <User size={16} className="text-white" />
                </Link>
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-accent-teal/10 to-accent-fuchsia/10 border border-accent-teal/30 rounded-lg hover:border-accent-teal/50 transition-all group"
                >
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent-teal transition-colors">Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="px-3 py-1.5 text-sm text-text-muted hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-text-primary hover:bg-white text-titan-bg px-4 py-1.5 rounded text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden text-text-secondary hover:text-text-primary p-1.5"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-titan-surface border-b border-titan-border">
          <div className="px-4 py-4 space-y-1">
            <Link 
              to="/products" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              Products
              <ChevronRight size={14} />
            </Link>
            <Link 
              to="/trends" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              Trends
              <ChevronRight size={14} />
            </Link>
            <Link 
              to="/audit" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              Video Audit
              <ChevronRight size={14} />
            </Link>
            <Link 
              to="/brands" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              For Brands
              <ChevronRight size={14} />
            </Link>
            <div className="pt-3 mt-3 border-t border-titan-border">
              {user ? (
                <div className="space-y-2">
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsOpen(false)} 
                    className="flex items-center gap-3 px-3 py-3 bg-gradient-to-r from-accent-teal/10 to-accent-fuchsia/10 border border-accent-teal/30 rounded-lg"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-lg flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-text-primary block">Dashboard</span>
                      <span className="text-xs text-text-muted">View your stats</span>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-accent-teal" />
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-center px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link 
                    to="/login" 
                    onClick={() => setIsOpen(false)} 
                    className="w-full text-center py-2 text-sm text-text-secondary border border-titan-border rounded hover:bg-titan-elevated transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/signup" 
                    onClick={() => setIsOpen(false)} 
                    className="w-full text-center py-2 text-sm bg-text-primary text-titan-bg rounded font-medium"
                  >
                    Get Started
                  </Link>
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
  <footer className="bg-titan-bg border-t border-titan-border">
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/titans-logo.png" alt="Titans" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-text-primary tracking-tight">TITANS</span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed max-w-xs">
            The command center for TikTok Shop creators. Data-driven tools for modern commerce.
          </p>
        </div>

        {/* Platform */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li><Link to="/products" className="hover:text-text-secondary transition-colors">Products</Link></li>
            <li><Link to="/trends" className="hover:text-text-secondary transition-colors">Trend Pulse</Link></li>
            <li><Link to="/audit" className="hover:text-text-secondary transition-colors">Video Audit</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li><Link to="/brands" className="hover:text-text-secondary transition-colors">For Brands</Link></li>
            <li><a href="#" className="hover:text-text-secondary transition-colors">About</a></li>
            <li><a href="#" className="hover:text-text-secondary transition-colors">Contact</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li><Link to="/privacy" className="hover:text-text-secondary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-text-secondary transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-titan-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-text-muted">
          © {new Date().getFullYear()} Titans. All rights reserved.
        </p>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-pulse"></span>
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-titan-bg font-sans text-text-primary">
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
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>
          <Footer />
          <Analytics />
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
