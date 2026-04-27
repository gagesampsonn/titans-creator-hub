import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, ChevronRight, Settings as SettingsIcon, GraduationCap, MessageCircle } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { WhopProvider } from './lib/WhopContext';
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
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Course from './pages/Course';
import CourseLogin from './pages/CourseLogin';
import BrandPitch from './pages/BrandPitch';
import SamplePicker from './pages/SamplePicker';
import Wins from './pages/Wins';
import About from './pages/About';

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
          <Link to="/" className="flex items-center group">
            <img src="/titans-logo.png" alt="Titans" className="w-24 h-24 object-contain" />
            <div className="flex items-center gap-2 -ml-3">
              <span className="text-lg font-bold text-text-primary tracking-tight">TITANS</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-400 rounded-full border border-orange-500/30">
                For Creators
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link to="/products" className={isActive('/products')}>Products</Link>
            <Link to="/wins" className={isActive('/wins')}>Wins</Link>
            <Link to="/creatortools" className={isActive('/creatortools')}>Creator Tools</Link>
            <Link to="/course" className={`${isActive('/course')} flex items-center gap-1.5`}>
              <GraduationCap size={14} />
              Course
            </Link>
            <Link to="/brands" className={isActive('/brands')}>For Brands</Link>
            <a 
              href="https://discord.gg/54XSFnWCdp" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-text-secondary hover:text-[#5865F2] transition-colors"
              title="Join our Discord"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Discord
            </a>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-7 h-7 bg-titan-surface rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/settings" 
                  className="w-8 h-8 bg-titan-surface border border-titan-border rounded-lg flex items-center justify-center hover:bg-titan-elevated transition-colors"
                  title="Settings"
                >
                  <SettingsIcon size={16} className="text-text-secondary" />
                </Link>
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
                  to="/samples" 
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-1.5 rounded text-sm font-semibold transition-colors"
                >
                  Get Free Samples
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
              to="/wins" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              Wins
              <ChevronRight size={14} />
            </Link>
            <Link 
              to="/creatortools" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              Creator Tools
              <ChevronRight size={14} />
            </Link>
            <Link 
              to="/course" 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-titan-elevated rounded transition-colors"
            >
              <span className="flex items-center gap-2">
                <GraduationCap size={14} />
                Course
              </span>
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
            <a 
              href="https://discord.gg/54XSFnWCdp" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between px-3 py-2.5 text-sm text-[#5865F2] hover:bg-titan-elevated rounded transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Join Discord
              </span>
              <ChevronRight size={14} />
            </a>
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
                    to="/samples" 
                    onClick={() => setIsOpen(false)} 
                    className="w-full text-center py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white rounded font-semibold"
                  >
                    Get Free Samples
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-2">
          <div className="flex items-center mb-4">
            <img src="/titans-logo.png" alt="Titans" className="w-20 h-20 object-contain" />
            <span className="text-base font-bold text-text-primary tracking-tight -ml-2">TITANS</span>
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
            <li><Link to="/wins" className="hover:text-text-secondary transition-colors">Creator Wins</Link></li>
            <li><Link to="/trends" className="hover:text-text-secondary transition-colors">Trend Pulse</Link></li>
            <li><Link to="/creatortools" className="hover:text-text-secondary transition-colors">Creator Tools</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li><Link to="/brands" className="hover:text-text-secondary transition-colors">For Brands</Link></li>
            <li><Link to="/about" className="hover:text-text-secondary transition-colors">About Titans</Link></li>
            <li>
              <a
                href="mailto:Tiktoktitansmanagement@gmail.com"
                className="hover:text-text-secondary transition-colors"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>

        {/* Community */}
        <div>
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">Community</h4>
          <ul className="space-y-2.5 text-sm text-text-muted">
            <li>
              <a href="https://discord.gg/54XSFnWCdp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#5865F2] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Join Discord
              </a>
            </li>
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
        <WhopProvider>
          <div className="min-h-screen flex flex-col bg-titan-bg font-sans text-text-primary">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/wins" element={<Wins />} />
                <Route path="/about" element={<About />} />
                <Route path="/samples" element={<SamplePicker />} />
                <Route path="/products" element={<ProductLibrary />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/trends" element={<TrendPulse />} />
                <Route path="/creatortools" element={<VideoAudit />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/brands" element={<BrandPortal />} />
                <Route path="/login" element={<Auth mode="login" />} />
                <Route path="/signup" element={<Auth mode="signup" />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/integrations" element={<Settings />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/course" element={<Course />} />
                <Route path="/course-login" element={<CourseLogin />} />
                <Route path="/pitch" element={<BrandPitch />} />
              </Routes>
            </main>
            <Footer />
            <Analytics />
          </div>
        </WhopProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
