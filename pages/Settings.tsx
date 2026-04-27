import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  Settings as SettingsIcon, 
  Link as LinkIcon, 
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  User,
  Shield,
  Bell
} from 'lucide-react';
import { getTikTokStatus, connectTikTok, disconnectTikTok, TikTokStatus } from '../lib/tiktokService';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'integrations' | 'profile' | 'notifications'>('integrations');
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success/error messages in URL (from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (params.get('tiktok_connected') === 'true') {
      setSuccessMessage(params.get('message') || 'TikTok connected successfully!');
      // Clear the URL params
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    } else if (params.get('tiktok_error') === 'true') {
      setError(params.get('message') || 'Failed to connect TikTok');
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
  }, []);

  // Fetch TikTok status
  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const status = await getTikTokStatus();
        setTiktokStatus(status);
      } catch (err) {
        console.error('Failed to fetch TikTok status:', err);
        setTiktokStatus({ connected: false });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleConnect = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await connectTikTok(user.id);
      // User will be redirected to TikTok
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start connection');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your TikTok account? Your data will still be accessible but we won\'t be able to sync new data.')) {
      return;
    }

    setIsDisconnecting(true);
    setError(null);
    
    try {
      await disconnectTikTok();
      setTiktokStatus({ connected: false });
      setSuccessMessage('TikTok account disconnected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-titan-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-xl flex items-center justify-center">
            <SettingsIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-sm text-text-muted">Manage your account and integrations</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-green-400">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-500 hover:text-green-400"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <span className="text-red-400">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-400"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-titan-surface rounded-lg p-1">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'integrations'
                ? 'bg-titan-elevated text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <LinkIcon size={16} />
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-titan-elevated text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <User size={16} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'notifications'
                ? 'bg-titan-elevated text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Bell size={16} />
            Notifications
          </button>
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* TikTok Shop Connection */}
            <div className="bg-titan-surface border border-titan-border rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {/* TikTok Logo */}
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">TikTok Shop</h3>
                    <p className="text-sm text-text-muted mt-1">
                      Connect your TikTok Shop creator account to sync performance data, access samples, and manage your affiliate links.
                    </p>
                    
                    {/* Connection Status */}
                    {isLoading ? (
                      <div className="flex items-center gap-2 mt-3">
                        <RefreshCw size={14} className="text-text-muted animate-spin" />
                        <span className="text-sm text-text-muted">Checking connection...</span>
                      </div>
                    ) : tiktokStatus?.connected ? (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-sm text-green-400">Connected</span>
                          {tiktokStatus.username && (
                            <span className="text-sm text-text-muted">
                              as @{tiktokStatus.username}
                            </span>
                          )}
                        </div>
                        {tiktokStatus.needsReauth && (
                          <div className="flex items-center gap-2">
                            <AlertCircle size={14} className="text-yellow-500" />
                            <span className="text-sm text-yellow-400">
                              Token expiring soon - please reconnect
                            </span>
                          </div>
                        )}
                        {tiktokStatus.sellerType && (
                          <div className="text-xs text-text-muted">
                            Account type: {tiktokStatus.sellerType}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3">
                        <XCircle size={14} className="text-text-muted" />
                        <span className="text-sm text-text-muted">Not connected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  {tiktokStatus?.connected ? (
                    <div className="flex gap-2">
                      {tiktokStatus.needsReauth && (
                        <button
                          onClick={handleConnect}
                          disabled={isConnecting}
                          className="px-4 py-2 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors disabled:opacity-50"
                        >
                          {isConnecting ? 'Connecting...' : 'Reconnect'}
                        </button>
                      )}
                      <button
                        onClick={handleDisconnect}
                        disabled={isDisconnecting}
                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-teal to-accent-fuchsia text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect TikTok
                          <ExternalLink size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Permissions Info */}
              {!tiktokStatus?.connected && (
                <div className="mt-6 pt-6 border-t border-titan-border">
                  <h4 className="text-sm font-medium text-text-secondary mb-3">
                    What you'll get access to:
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'View your performance metrics',
                      'Sync commission & GMV data',
                      'Request product samples',
                      'Access exclusive offers',
                      'Link to Titans agency',
                      'Get personalized insights',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-text-muted">
                        <CheckCircle size={14} className="text-accent-teal" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-titan-surface/50 border border-titan-border border-dashed rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-titan-elevated rounded-xl flex items-center justify-center">
                  <Shield size={24} className="text-text-muted" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-secondary">More integrations</h3>
                  <p className="text-sm text-text-muted mt-1">
                    TikTok linking above covers creator analytics today. We add new connections as TikTok Shop and partner tools
                    evolve—check back after product updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-titan-surface border border-titan-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-xl flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {user?.email?.split('@')[0] || 'Creator'}
                </h3>
                <p className="text-sm text-text-muted">{user?.email}</p>
              </div>
            </div>
            
            <Link 
              to="/profile"
              className="flex items-center justify-between p-4 bg-titan-elevated rounded-lg hover:bg-titan-border transition-colors"
            >
              <span className="text-text-primary">Edit Profile</span>
              <ChevronRight size={16} className="text-text-muted" />
            </Link>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-titan-surface border border-titan-border rounded-xl p-6">
            <p className="text-text-secondary text-sm leading-relaxed text-center py-6 max-w-md mx-auto">
              Email preferences are not customizable in the app yet. For time-sensitive drops, assignments, and community
              announcements, join the{' '}
              <a
                href="https://discord.gg/54XSFnWCdp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-teal hover:underline"
              >
                Titans Discord
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
