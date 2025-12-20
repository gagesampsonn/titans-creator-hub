import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, AtSign, Calendar, Shield, CheckCircle, AlertCircle, Trophy, Star, Award, Medal, Crown } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileData {
  email: string;
  tiktok_handle: string | null;
  full_name: string | null;
  created_at: string;
  is_linked_creator: boolean;
}

interface TopVideoAchievement {
  id: string;
  videoId: string;
  videoName: string;
  revenue: number;
  rank: number;
  dateStart?: string;
  dateEnd?: string;
}

interface AchievementsData {
  hasTopVideos: boolean;
  userVideos: TopVideoAchievement[];
  dateRange?: { start: string; end: string };
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      loadProfile();
      loadAchievements();
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

  const loadAchievements = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/profile/top-videos', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements({
          hasTopVideos: data.hasTopVideos,
          userVideos: data.userVideos || [],
          dateRange: data.dateRange
        });
      }
    } catch (err) {
      console.error('Error loading achievements:', err);
    }
  };

  // Get badge details based on rank
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return { 
        icon: Crown, 
        color: 'from-yellow-400 to-amber-500', 
        textColor: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        label: '1st Place',
        emoji: '👑'
      };
    } else if (rank === 2) {
      return { 
        icon: Medal, 
        color: 'from-gray-300 to-gray-400', 
        textColor: 'text-gray-300',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-400/30',
        label: '2nd Place',
        emoji: '🥈'
      };
    } else if (rank === 3) {
      return { 
        icon: Medal, 
        color: 'from-amber-600 to-amber-700', 
        textColor: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        label: '3rd Place',
        emoji: '🥉'
      };
    } else if (rank <= 5) {
      return { 
        icon: Trophy, 
        color: 'from-accent-fuchsia to-accent-teal', 
        textColor: 'text-accent-fuchsia',
        bgColor: 'bg-accent-fuchsia/10',
        borderColor: 'border-accent-fuchsia/30',
        label: `Top 5`,
        emoji: '🏆'
      };
    } else if (rank <= 10) {
      return { 
        icon: Star, 
        color: 'from-accent-teal to-cyan-500', 
        textColor: 'text-accent-teal',
        bgColor: 'bg-accent-teal/10',
        borderColor: 'border-accent-teal/30',
        label: `Top 10`,
        emoji: '⭐'
      };
    } else {
      return { 
        icon: Award, 
        color: 'from-purple-500 to-indigo-500', 
        textColor: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30',
        label: `Top 20`,
        emoji: '🎖️'
      };
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

        {/* Achievements Section */}
        {achievements?.hasTopVideos && achievements.userVideos.length > 0 && (
          <div className="mt-6 bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-accent-fuchsia/20 to-accent-teal/20 p-4 border-b border-titan-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Achievement Badges</h3>
                  <p className="text-xs text-text-muted">
                    {achievements.userVideos.length} video{achievements.userVideos.length !== 1 ? 's' : ''} in the agency Top 20
                    {achievements.dateRange && (
                      <span className="text-text-muted ml-1">
                        • {new Date(achievements.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(achievements.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {achievements.userVideos.map((video) => {
                const badge = getRankBadge(video.rank);
                const BadgeIcon = badge.icon;
                
                return (
                  <div 
                    key={video.id} 
                    className={`flex items-center gap-4 p-4 rounded-xl ${badge.bgColor} border ${badge.borderColor} transition-all hover:scale-[1.01]`}
                  >
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className={`w-14 h-14 bg-gradient-to-br ${badge.color} rounded-xl flex flex-col items-center justify-center shadow-lg`}>
                        <span className="text-lg font-bold text-white">#{video.rank}</span>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{badge.emoji}</span>
                        <span className={`text-sm font-semibold ${badge.textColor}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary truncate font-medium">
                        {video.videoName || 'Untitled Video'}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        Revenue: ${video.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Achievement Icon */}
                    <div className="flex-shrink-0">
                      <BadgeIcon className={`w-6 h-6 ${badge.textColor}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Footer */}
            <div className="border-t border-titan-border p-4 bg-titan-bg/30">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  Total Top 20 Videos: <span className="text-text-primary font-semibold">{achievements.userVideos.length}</span>
                </span>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-accent-teal hover:underline text-sm"
                >
                  View Rankings →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Achievements Prompt for Linked Creators */}
        {profile.is_linked_creator && (!achievements?.hasTopVideos || achievements.userVideos.length === 0) && (
          <div className="mt-6 bg-titan-surface/50 border border-titan-border border-dashed rounded-lg p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-titan-bg rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-text-muted" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-secondary">No Top 20 Videos Yet</h3>
                <p className="text-xs text-text-muted mt-1">
                  Keep creating content! When your videos reach the agency Top 20 by revenue, you'll earn achievement badges here.
                </p>
              </div>
            </div>
          </div>
        )}

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
