import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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
        // Sign up with Supabase
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
          // Create user profile in database
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
            // Continue anyway - profile can be created later
          }

          navigate('/dashboard');
        }
      } else {
        // Log in with Supabase
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-tiktok-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-block p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl mb-6 shadow-lg shadow-orange-500/30 transform hover:scale-105 transition-transform">
          <span className="text-white font-bold text-2xl">T</span>
        </Link>
        <h1 className="text-3xl font-bold text-white tracking-tight">{mode === 'login' ? 'Welcome Back' : 'Join Titans Hub'}</h1>
        <p className="text-slate-400 mt-2">
          {mode === 'login' 
            ? 'Enter your credentials to access the hub.' 
            : 'Start earning commissions today.'}
        </p>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md relative z-10">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" 
                placeholder="Alex Smith" 
                required 
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" 
              placeholder="alex@example.com" 
              required 
            />
          </div>

          <div>
             <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Password</label>
              {mode === 'login' && <a href="#" className="text-sm text-orange-500 font-medium hover:text-orange-400 hover:underline">Forgot?</a>}
             </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder-slate-600" 
              placeholder="••••••••" 
              required 
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <div className="flex gap-4 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <label 
                className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                  role === 'creator' 
                    ? 'bg-slate-800 shadow-sm text-white border border-slate-700' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                <input 
                  type="radio" 
                  name="role" 
                  className="hidden" 
                  checked={role === 'creator'}
                  onChange={() => setRole('creator')}
                />
                I'm a Creator
              </label>
              <label 
                className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                  role === 'brand' 
                    ? 'bg-slate-800 shadow-sm text-white border border-slate-700' 
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                <input 
                  type="radio" 
                  name="role" 
                  className="hidden" 
                  checked={role === 'brand'}
                  onChange={() => setRole('brand')}
                />
                I'm a Brand
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              mode === 'login' ? 'Log In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/signup" className="text-orange-500 font-bold hover:underline">Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-orange-500 font-bold hover:underline">Log in</Link></>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
