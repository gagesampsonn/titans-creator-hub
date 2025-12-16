import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, AtSign, Calendar, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileData {
  email: string;
  tiktok_handle: string | null;
  full_name: string | null;
  created_at: string;
  is_linked_creator: boolean;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      // Get profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      // Check if linked creator
      let isLinked = false;
      if (profileData?.tiktok_handle) {
        const { data: linkedData } = await supabase
          .from('linked_creators')
          .select('tiktok_handle')
          .eq('tiktok_handle', profileData.tiktok_handle.toLowerCase())
          .single();
        isLinked = !!linkedData;
      }

      setProfile({
        email: user.email || '',
        tiktok_handle: profileData?.tiktok_handle || null,
        full_name: profileData?.full_name || null,
        created_at: user.created_at || '',
        is_linked_creator: isLinked
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-titan-bg py-8 px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Profile</h1>
          <p className="text-text-muted text-sm">Your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
          
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-accent-teal/20 to-accent-fuchsia/20 p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {profile.full_name || 'Creator'}
              </h2>
              {profile.is_linked_creator && (
                <div className="flex items-center gap-1.5 mt-1">
                  <CheckCircle className="w-4 h-4 text-accent-teal" />
                  <span className="text-xs text-accent-teal font-medium">Linked Creator</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="p-6 space-y-5">
            
            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-titan-bg rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm text-text-primary truncate">{profile.email}</p>
              </div>
            </div>

            {/* TikTok Handle */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-titan-bg rounded-lg flex items-center justify-center flex-shrink-0">
                <AtSign className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">TikTok Handle</p>
                {profile.tiktok_handle ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-text-primary">@{profile.tiktok_handle}</p>
                    {profile.is_linked_creator && (
                      <span className="px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-[10px] font-medium rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-text-muted">Not connected</p>
                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="text-xs text-accent-teal hover:underline"
                    >
                      Connect now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-titan-bg rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Member Since</p>
                <p className="text-sm text-text-primary">{formatDate(profile.created_at)}</p>
              </div>
            </div>

            {/* Account Status */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-titan-bg rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Account Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent-teal rounded-full"></span>
                  <p className="text-sm text-text-primary">Active</p>
                </div>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="border-t border-titan-border p-4 bg-titan-bg/50">
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2 px-4 bg-titan-surface border border-titan-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-titan-border-light transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-titan-surface border border-titan-border rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-text-muted flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-secondary">
              Need to update your information? Contact us at{' '}
              <a href="mailto:Tiktoktitansmanagement@gmail.com" className="text-accent-teal hover:underline">
                Tiktoktitansmanagement@gmail.com
              </a>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
