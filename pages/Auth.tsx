import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthProps {
  mode: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

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
      console.log('[Auth] User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

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
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          console.log('[Auth] Signup successful, creating profile...');
          // Profile will also be created by AuthContext, but create here for immediate data
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              full_name: fullName,
            }, { onConflict: 'id' });

          if (profileError) {
            console.warn('[Auth] Profile creation warning:', profileError);
          }

          // Small delay to let AuthContext pick up the session
          setTimeout(() => navigate('/dashboard'), 100);
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
          setTimeout(() => navigate('/dashboard'), 100);
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
    <div className="min-h-screen bg-titan-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-fuchsia/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <img src="/titans-logo.png" alt="Titans" className="w-9 h-9 object-contain" />
          <span className="text-base font-semibold text-text-primary tracking-tight">TITANS</span>
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-text-muted mt-2">
          {mode === 'login' 
            ? 'Sign in to access your dashboard' 
            : 'Start scaling your TikTok Shop revenue'}
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-panel p-8 rounded w-full max-w-sm relative z-10">
        {error && (
          <div className="mb-5 p-3 bg-accent-fuchsia/10 border border-accent-fuchsia/20 rounded text-accent-fuchsia text-xs">
            <p>{error}</p>
            {showResendConfirmation && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={loading}
                className="mt-2 text-accent-teal hover:underline flex items-center gap-1"
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
          <div className="mb-5 p-3 bg-accent-teal/10 border border-accent-teal/20 rounded text-accent-teal text-xs">
            ✓ Confirmation email sent! Check your inbox (and spam folder).
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
                placeholder="Your name" 
                required 
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
              placeholder="you@example.com" 
              required 
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-xs font-medium text-text-secondary">Password</label>
              {mode === 'login' && (
                <a href="#" className="text-xs text-accent-teal hover:text-text-primary transition-colors">Forgot?</a>
              )}
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-teal focus:outline-none transition-colors placeholder-text-muted" 
              placeholder="••••••••" 
              required 
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-text-primary hover:bg-white disabled:bg-text-primary/50 text-titan-bg font-semibold py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-text-muted">
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/signup" className="text-accent-teal hover:text-text-primary transition-colors">Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-accent-teal hover:text-text-primary transition-colors">Sign in</Link></>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-text-muted relative z-10">
        By continuing, you agree to our Terms of Service
      </p>
    </div>
  );
};

export default Auth;
