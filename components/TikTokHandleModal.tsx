/**
 * TikTok Handle Connection Modal
 * 
 * Simple modal for creators to link their TikTok handle manually.
 * This is the "manual-first" approach - no OAuth required.
 * 
 * When they save their handle:
 * - If already linked to Titans agency, their metrics will appear after next import
 * - If not linked yet, they'll see 0's until linked
 */

import React, { useState } from 'react';
import { X, AtSign, Loader2, CheckCircle, Info } from 'lucide-react';

interface TikTokHandleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { handle: string; displayName?: string }) => Promise<void>;
  currentHandle?: string;
  currentDisplayName?: string;
}

export const TikTokHandleModal: React.FC<TikTokHandleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentHandle = '',
  currentDisplayName = '',
}) => {
  const [handle, setHandle] = useState(currentHandle);
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Normalize handle input (remove @ if typed, will add back for display)
  const normalizeHandle = (input: string) => {
    return input.toLowerCase().trim().replace(/^@/, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const normalizedHandle = normalizeHandle(handle);
    
    if (!normalizedHandle) {
      setError('Please enter your TikTok handle');
      return;
    }
    
    if (normalizedHandle.length < 2) {
      setError('Handle must be at least 2 characters');
      return;
    }
    
    if (!/^[a-z0-9._]+$/.test(normalizedHandle)) {
      setError('Handle can only contain letters, numbers, dots, and underscores');
      return;
    }
    
    setSaving(true);
    try {
      await onSave({
        handle: normalizedHandle,
        displayName: displayName.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-titan-surface border border-titan-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-titan-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Connect Your TikTok Shop Affiliate Account
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-titan-elevated"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent-teal/10 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-accent-teal" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Connected!
              </h3>
              <p className="text-sm text-text-muted">
                Your TikTok handle has been saved.
              </p>
            </div>
          ) : (
            <>
              {/* Handle Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  TikTok Handle <span className="text-accent-fuchsia">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <AtSign size={16} />
                  </div>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="levivideosdeals"
                    className="w-full pl-10 pr-4 py-2.5 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal transition-all"
                  />
                </div>
                <p className="text-xs text-text-muted mt-1.5">
                  Enter your TikTok username (with or without the @)
                </p>
              </div>
              
              {/* Display Name Input (optional) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Display Name <span className="text-text-muted">(optional)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Levi"
                  className="w-full px-4 py-2.5 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal transition-all"
                />
              </div>
              
              {/* Info Box */}
              <div className="mb-6 p-4 bg-accent-teal/5 border border-accent-teal/20 rounded-lg">
                <div className="flex gap-3">
                  <Info size={18} className="text-accent-teal flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-text-primary font-medium mb-1">
                      How your metrics work
                    </p>
                    <p className="text-text-muted text-xs leading-relaxed">
                      If you're already linked to the Titans agency in TikTok Partner Center, 
                      your metrics will appear after the next daily import. If you're not 
                      linked yet, you'll see zeros until you join us as an affiliate.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-text-secondary border border-titan-border rounded-lg hover:bg-titan-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !handle.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-accent-teal to-accent-fuchsia rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Saving...' : 'Connect Account'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default TikTokHandleModal;
