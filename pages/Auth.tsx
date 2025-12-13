import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthProps {
  mode: 'login' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ mode }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'creator' | 'brand'>('creator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: role,
            });

          if (profileError) {
            console.warn('Profile creation error:', profileError);
          }

          navigate('/dashboard');
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-titan-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-fuchsia/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded flex items-center justify-center">
            <span className="text-titan-bg font-bold text-sm">T</span>
          </div>
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
            {error}
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

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">I am a</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                    role === 'creator' 
                      ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/30' 
                      : 'bg-titan-bg border border-titan-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Creator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('brand')}
                  className={`flex-1 py-2 rounded text-sm font-medium transition-all ${
                    role === 'brand' 
                      ? 'bg-accent-fuchsia/10 text-accent-fuchsia border border-accent-fuchsia/30' 
                      : 'bg-titan-bg border border-titan-border text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Brand
                </button>
              </div>
            </div>
          )}

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
