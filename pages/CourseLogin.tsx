import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, GraduationCap, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const CourseLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'checking' | 'success' | 'no-access'>('email');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStep('checking');

    try {
      // Step 1: Check if email has WHOP membership
      const whopResponse = await fetch('/api/whop/verify-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const whopData = await whopResponse.json();

      if (!whopData.hasAccess) {
        setStep('no-access');
        setLoading(false);
        return;
      }

      // Step 2: Has access! Send magic link to log them in
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/#/course`,
        },
      });

      if (magicLinkError) throw magicLinkError;

      // Success - magic link sent
      setStep('success');
    } catch (err: any) {
      console.error('[CourseLogin] Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-titan-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent-fuchsia/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-teal/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <div className="mb-8 text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <img src="/titans-logo.png" alt="Titans" className="w-9 h-9 object-contain" />
          <span className="text-base font-semibold text-text-primary tracking-tight">TITANS</span>
        </Link>
        <div className="w-16 h-16 bg-gradient-to-br from-accent-fuchsia to-accent-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Access Titans Training
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Enter your WHOP email to access the course
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-titan-surface border border-titan-border p-8 rounded-2xl w-full max-w-sm relative z-10">
        
        {/* Step: Enter Email */}
        {step === 'email' && (
          <>
            {error && (
              <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Your WHOP Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-titan-bg border border-titan-border text-text-primary text-sm focus:border-accent-fuchsia focus:outline-none transition-colors placeholder-text-muted" 
                    placeholder="you@example.com" 
                    required 
                    autoFocus
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Use the same email you used to purchase on WHOP
                </p>
              </div>

              <button 
                type="submit" 
                disabled={loading || !email}
                className="w-full bg-gradient-to-r from-accent-fuchsia to-accent-teal hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Access Course'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-titan-border text-center">
              <p className="text-xs text-text-muted mb-3">
                Don't have a membership yet?
              </p>
              <a 
                href="https://whop.com/tiktoktitansagency"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-accent-teal hover:text-text-primary transition-colors"
              >
                Join Titans on WHOP →
              </a>
            </div>
          </>
        )}

        {/* Step: Checking Membership */}
        {step === 'checking' && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 text-accent-fuchsia animate-spin mx-auto mb-4" />
            <p className="text-text-primary font-medium">Verifying membership...</p>
            <p className="text-text-muted text-sm mt-1">Checking your WHOP access</p>
          </div>
        )}

        {/* Step: Success - Check Email */}
        {step === 'success' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-accent-teal" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email!</h2>
            <p className="text-sm text-text-muted mb-2">
              We sent a login link to
            </p>
            <p className="text-text-primary font-medium mb-4">{email}</p>
            <p className="text-xs text-text-muted">
              Click the link in the email to access the course instantly.
              <br />No password needed!
            </p>
            
            <button
              onClick={() => setStep('email')}
              className="mt-6 text-sm text-accent-teal hover:text-text-primary transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        )}

        {/* Step: No Access */}
        {step === 'no-access' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">No membership found</h2>
            <p className="text-sm text-text-muted mb-2">
              We couldn't find an active Titans membership for
            </p>
            <p className="text-text-primary font-medium mb-4">{email}</p>
            <p className="text-xs text-text-muted mb-6">
              Make sure you're using the same email you used when purchasing on WHOP.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setStep('email')}
                className="w-full py-2.5 border border-titan-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-titan-border-light transition-colors"
              >
                Try a different email
              </button>
              <a 
                href="https://whop.com/tiktoktitansagency"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white font-semibold rounded-xl text-sm text-center hover:opacity-90 transition-opacity"
              >
                Get Titans Membership
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-text-muted relative z-10">
        Already have an account?{' '}
        <Link to="/login" className="text-accent-teal hover:underline">Sign in with password</Link>
      </p>
    </div>
  );
};

export default CourseLogin;

