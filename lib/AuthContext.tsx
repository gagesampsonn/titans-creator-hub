import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Ensure user profile exists in the profiles table
 * This prevents "no profile" edge cases
 */
async function ensureProfileExists(user: User) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.warn('[AuthContext] Profile upsert warning:', error.message);
    } else {
      console.log('[AuthContext] Profile ensured for user:', user.id);
    }
  } catch (err) {
    console.warn('[AuthContext] Failed to ensure profile:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Update auth state and ensure profile exists
   */
  const updateAuthState = useCallback((newSession: Session | null) => {
    console.log('[AuthContext] Updating auth state, session exists:', !!newSession);
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
    
    // Ensure profile exists in background (don't block loading)
    if (newSession?.user) {
      ensureProfileExists(newSession.user);
    }
  }, []);

  /**
   * Refresh the current session
   */
  const refreshSession = useCallback(async () => {
    console.log('[AuthContext] Refreshing session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[AuthContext] Session refresh error:', error);
    }
    updateAuthState(session);
  }, [updateAuthState]);

  useEffect(() => {
    console.log('[AuthContext] Initializing auth...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[AuthContext] Initial session error:', error);
      }
      console.log('[AuthContext] Initial session:', session ? 'exists' : 'none');
      updateAuthState(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, session ? 'session exists' : 'no session');
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
        } else {
          updateAuthState(session);
        }
      }
    );

    return () => {
      console.log('[AuthContext] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  // Debug logging
  useEffect(() => {
    console.log('[AuthContext] State:', { 
      hasUser: !!user, 
      userId: user?.id?.slice(0, 8), 
      hasSession: !!session, 
      loading 
    });
  }, [user, session, loading]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
