import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface WhopAccess {
  hasAccess: boolean;
  hasCourseAccess: boolean;
  hasToolAccess: boolean;
  tier: string | null;
  auditLimit: number;
  isAdmin: boolean;
  activeProducts: { id: string; name: string; tier: string }[];
}

interface WhopContextType {
  whopAccess: WhopAccess | null;
  loading: boolean;
  error: string | null;
  refreshWhopStatus: () => Promise<void>;
  // Helper methods
  canAccessCourse: boolean;
  canAccessTools: boolean;
  auditsRemaining: number;
  setAuditsUsed: (count: number) => void;
}

const defaultAccess: WhopAccess = {
  hasAccess: false,
  hasCourseAccess: false,
  hasToolAccess: false,
  tier: null,
  auditLimit: 3, // Free trial audits
  isAdmin: false,
  activeProducts: [],
};

const WhopContext = createContext<WhopContextType>({
  whopAccess: null,
  loading: true,
  error: null,
  refreshWhopStatus: async () => {},
  canAccessCourse: false,
  canAccessTools: false,
  auditsRemaining: 3,
  setAuditsUsed: () => {},
});

export const useWhop = () => {
  const context = useContext(WhopContext);
  if (!context) {
    throw new Error('useWhop must be used within a WhopProvider');
  }
  return context;
};

// Storage key for audit usage tracking
const AUDIT_USAGE_KEY = 'titans_audit_usage';

interface AuditUsage {
  count: number;
  month: string; // YYYY-MM format
}

function getAuditUsage(): AuditUsage {
  const currentMonth = new Date().toISOString().slice(0, 7);
  try {
    const stored = localStorage.getItem(AUDIT_USAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as AuditUsage;
      // Reset if new month
      if (usage.month !== currentMonth) {
        return { count: 0, month: currentMonth };
      }
      return usage;
    }
  } catch {}
  return { count: 0, month: currentMonth };
}

function saveAuditUsage(count: number) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  localStorage.setItem(AUDIT_USAGE_KEY, JSON.stringify({ count, month: currentMonth }));
}

export const WhopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [whopAccess, setWhopAccess] = useState<WhopAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditsUsed, setAuditsUsedState] = useState(0);

  // Load audit usage from localStorage
  useEffect(() => {
    const usage = getAuditUsage();
    setAuditsUsedState(usage.count);
  }, []);

  const setAuditsUsed = useCallback((count: number) => {
    setAuditsUsedState(count);
    saveAuditUsage(count);
  }, []);

  const refreshWhopStatus = useCallback(async () => {
    if (!user?.email) {
      setWhopAccess(defaultAccess);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/whop/verify-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify membership');
      }

      const data = await response.json();
      
      setWhopAccess({
        hasAccess: data.hasAccess || false,
        hasCourseAccess: data.hasCourseAccess || false,
        hasToolAccess: data.hasToolAccess || false,
        tier: data.tier || null,
        auditLimit: data.auditLimit || 3,
        isAdmin: data.isAdmin || false,
        activeProducts: data.activeProducts || [],
      });
    } catch (err) {
      console.error('[Whop] Error checking membership:', err);
      setError('Failed to verify membership status');
      setWhopAccess(defaultAccess);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Check Whop status when user changes
  useEffect(() => {
    if (!authLoading) {
      refreshWhopStatus();
    }
  }, [authLoading, user?.email, refreshWhopStatus]);

  // Computed values
  const canAccessCourse = whopAccess?.hasCourseAccess || whopAccess?.isAdmin || false;
  const canAccessTools = whopAccess?.hasToolAccess || whopAccess?.isAdmin || auditsUsed < (whopAccess?.auditLimit || 3);
  const auditsRemaining = Math.max(0, (whopAccess?.auditLimit || 3) - auditsUsed);

  return (
    <WhopContext.Provider value={{
      whopAccess,
      loading,
      error,
      refreshWhopStatus,
      canAccessCourse,
      canAccessTools,
      auditsRemaining,
      setAuditsUsed,
    }}>
      {children}
    </WhopContext.Provider>
  );
};

