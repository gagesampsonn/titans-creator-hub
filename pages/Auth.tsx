import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Loader2, X } from 'lucide-react';

interface AuthProps {
  mode: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ mode }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // Where to go after auth (default: dashboard, from samples flow: products)
  const redirectTo = searchParams.get('redirect') || 'dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'https://titans-creator-hub.vercel.app/dashboard',
        }
      });
      
      if (error) throw error;
      
      setResendSuccess(true);
      setError(null);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log('[Auth] User already logged in, redirecting to', redirectTo);
      navigate(`/${redirectTo}`);
    }
  }, [user, authLoading, navigate, redirectTo]);

  // Reset state when mode changes (login <-> signup)
  useEffect(() => {
    setSignupSuccess(false);
    setError(null);
    setShowResendConfirmation(false);
    setResendSuccess(false);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        console.log('[Auth] Signing up...');
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: 'https://titans-creator-hub.vercel.app/dashboard',
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          console.log('[Auth] Signup successful, user needs to verify email');
          
          // Check if email confirmation is required
          if (data.user.identities && data.user.identities.length === 0) {
            // User already exists
            throw new Error('This email is already registered. Try logging in instead.');
          }
          
          // Show success message - user needs to verify email
          setSignupSuccess(true);
          setError(null);
        }
      } else {
        console.log('[Auth] Signing in...');
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          console.log('[Auth] Sign in successful, user:', data.user.id.slice(0, 8));
          // Small delay to let AuthContext pick up the session
          setTimeout(() => navigate(`/${redirectTo}`), 100);
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error:', err);
      
      // Provide helpful error messages
      let errorMessage = err.message || 'An error occurred';
      
      if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link to verify your account.';
        setShowResendConfirmation(true);
      } else if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
        setShowResendConfirmation(false);
      } else if (err.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Try logging in instead.';
        setShowResendConfirmation(false);
      } else {
        setShowResendConfirmation(false);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-titan-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-accent-teal/10 to-transparent rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-accent-fuchsia/10 to-transparent rounded-full blur-[100px]"></div>
      </div>

      {/* Modal Card - Dark theme */}
      <div className="bg-titan-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 w-full max-w-md relative z-10 overflow-hidden border border-titan-border">
        {/* Close button (links to home) */}
        <Link to="/" className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-titan-elevated rounded-full transition-colors">
          <X size={18} />
        </Link>

        {/* Logo */}
        <div className="flex justify-center pt-8 pb-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/titans-logo.png" alt="Titans" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-text-primary tracking-tight">TITANS</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center px-8 pt-2 pb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            {redirectTo === 'products'
              ? (mode === 'login' ? 'Log in to claim samples' : 'Sign up to get your sample')
              : (mode === 'login' ? 'Welcome Back' : 'Get Started')}
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            {redirectTo === 'products'
              ? 'Create a free account — takes 30 seconds'
              : (mode === 'login' 
                ? 'Sign in to access your creator dashboard' 
                : 'Create your account to start scaling')}
          </p>
        </div>

        {/* Form Content */}
        <div className="px-8 pb-8">
        {/* Signup Success - Check Email */}
        {signupSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-teal/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Check your email!</h2>
            <p className="text-sm text-text-secondary mb-4">
              We sent a verification link to<br />
              <span className="text-text-primary font-medium">{email}</span>
            </p>
            <p className="text-xs text-text-muted mb-6">
              Click the link in the email to verify your account and start using Titans.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResendConfirmation}
                disabled={loading}
                className="w-full py-3 border border-titan-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-titan-border-light transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Didn't get the email? Resend"
                )}
              </button>
              <Link 
                to="/login" 
                className="block w-full py-3 bg-text-primary hover:bg-white text-titan-bg font-semibold rounded-xl text-sm text-center transition-all"
              >
                Go to Login
              </Link>
            </div>
            {resendSuccess && (
              <p className="mt-4 text-sm text-accent-teal font-medium">✓ Email sent! Check your inbox.</p>
            )}
          </div>
        ) : (
        <>
        {error && (
          <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            <p>{error}</p>
            {showResendConfirmation && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={loading}
                className="mt-2 text-accent-teal hover:underline flex items-center gap-1 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend confirmation email'
                )}
              </button>
            )}
          </div>
        )}
        
        {resendSuccess && (
          <div className="mb-5 p-3 bg-accent-teal/10 border border-accent-teal/30 rounded-xl text-accent-teal text-sm">
            ✓ Confirmation email sent! Check your inbox (and spam folder).
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none transition-all placeholder-text-muted" 
                placeholder="Full name" 
                required 
              />
            </div>
          )}
          
          <div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none transition-all placeholder-text-muted" 
              placeholder="Email address" 
              required 
            />
          </div>

          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:ring-2 focus:ring-accent-teal/20 focus:outline-none transition-all placeholder-text-muted" 
              placeholder="Password" 
              required 
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-text-primary hover:bg-white disabled:opacity-50 text-titan-bg font-semibold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Switch mode link */}
        <div className="mt-6 text-center text-sm text-text-muted">
          {mode === 'login' ? (
            <>Don't have an account? <Link to={`/signup${redirectTo !== 'dashboard' ? `?redirect=${redirectTo}` : ''}`} className="text-accent-teal hover:text-text-primary font-medium">Sign up</Link></>
          ) : (
            <>Already have an account? <Link to={`/login${redirectTo !== 'dashboard' ? `?redirect=${redirectTo}` : ''}`} className="text-accent-teal hover:text-text-primary font-medium">Sign in</Link></>
          )}
        </div>
        </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-titan-border">
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
            <svg className="w-4 h-4 text-accent-teal" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure & encrypted
          </div>
          <p className="text-center text-xs text-text-muted mt-3">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-text-secondary hover:text-text-primary underline">Terms</Link>
            {' & '}
            <Link to="/privacy" className="text-text-secondary hover:text-text-primary underline">Privacy</Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
