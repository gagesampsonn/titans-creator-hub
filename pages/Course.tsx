import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Play, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  Rocket,
  Target,
  Video,
  TrendingUp,
  ExternalLink,
  Zap,
  Lightbulb,
  Tag,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { courseModules, getTotalDuration, getTotalVideoCount, findVideoById, CourseModule, CourseVideo } from '../lib/courseData';
import EmailWatermark from '../components/EmailWatermark';

// Icon mapping for modules
const iconMap: Record<string, React.ElementType> = {
  Rocket,
  Target,
  Video,
  TrendingUp,
  Zap,
};

const Course: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CourseVideo | null>(null);
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['core-skills']));

  // Check Whop membership on mount
  // Set to true for local testing without Whop API
  const DEV_BYPASS = false; // Production mode - Whop verification enabled
  
  useEffect(() => {
    const checkMembership = async () => {
      // DEV BYPASS - Remove this block when ready for production
      if (DEV_BYPASS) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }
      
      if (!user?.email) {
        setCheckingAccess(false);
        setHasAccess(false);
        return;
      }

      try {
        const response = await fetch('/api/whop/verify-membership', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        });

        const data = await response.json();
        setHasAccess(data.hasAccess);
        
        if (!data.hasAccess) {
          setAccessError('No active membership found. Please purchase a membership to access the course.');
        }
      } catch (error) {
        console.error('Failed to verify membership:', error);
        setAccessError('Unable to verify membership. Please try again later.');
        setHasAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };

    if (!authLoading) {
      checkMembership();
    }
  }, [user, authLoading]);

  // Handle video selection from URL params
  useEffect(() => {
    const videoId = searchParams.get('video');
    if (videoId && hasAccess) {
      const result = findVideoById(videoId);
      if (result) {
        setSelectedVideo(result.video);
        setSelectedModule(result.module);
        setExpandedModules((prev) => new Set([...prev, result.module.id]));
      }
    } else if (hasAccess && !videoId) {
      // Default to first video
      const firstModule = courseModules[0];
      const firstVideo = firstModule?.videos[0];
      if (firstModule && firstVideo) {
        setSelectedModule(firstModule);
        setSelectedVideo(firstVideo);
      }
    }
  }, [searchParams, hasAccess]);

  const handleVideoSelect = (module: CourseModule, video: CourseVideo) => {
    setSelectedModule(module);
    setSelectedVideo(video);
    setSearchParams({ video: video.id });
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  // Loading state
  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-fuchsia animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-titan-bg">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="bg-titan-surface border border-titan-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-fuchsia/20 to-accent-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-accent-fuchsia" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">Titans Training</h1>
            <p className="text-text-secondary mb-6">
              Please log in to access the course content.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Log In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-titan-bg">
        <div className="max-w-2xl mx-auto px-6 py-20">
          <div className="bg-titan-surface border border-titan-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">Membership Required</h1>
            <p className="text-text-secondary mb-2">
              {accessError || 'You need an active Titans membership to access this course.'}
            </p>
            <p className="text-text-muted text-sm mb-6">
              Logged in as: {user.email}
            </p>
            <a
              href="https://whop.com/tiktokshopaffiliate/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Get Membership
              <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-text-muted text-xs mt-4">
              Make sure to use the same email ({user.email}) when purchasing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Has access - show course content
  return (
    <div className="min-h-screen bg-titan-bg">
      {/* Header */}
      <div className="bg-gradient-to-b from-titan-surface to-titan-bg border-b border-titan-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-fuchsia to-accent-teal rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Titans Training</h1>
              <p className="text-text-secondary text-sm">Master TikTok Shop affiliate marketing</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <Play className="w-4 h-4" />
              {getTotalVideoCount()} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {getTotalDuration()} total
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Full access
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {selectedVideo && selectedModule ? (
              <div className="bg-titan-surface border border-titan-border rounded-2xl overflow-hidden">
                {/* Video container with watermark */}
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={selectedVideo.embedUrl}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                  {/* Email watermark overlay */}
                  <EmailWatermark email={user.email || ''} />
                </div>
                
                {/* Video info */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-text-muted text-sm mb-3">
                    <span className={`px-2 py-0.5 bg-gradient-to-r ${selectedModule.color} bg-opacity-10 text-white rounded text-xs font-medium`}>
                      {selectedModule.title}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedVideo.duration}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedVideo.difficulty === 'beginner' 
                        ? 'bg-green-500/10 text-green-400' 
                        : selectedVideo.difficulty === 'intermediate'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {selectedVideo.difficulty}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary mb-3">
                    {selectedVideo.title}
                  </h2>
                  <p className="text-text-secondary mb-6">
                    {selectedVideo.description}
                  </p>
                  
                  {/* Topics & Takeaways Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Topics Covered */}
                    {selectedVideo.topics && selectedVideo.topics.length > 0 && (
                      <div className="bg-titan-bg/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-4 h-4 text-accent-teal" />
                          <h3 className="text-sm font-medium text-text-primary">Topics Covered</h3>
                        </div>
                        <ul className="space-y-2">
                          {selectedVideo.topics.map((topic, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                              <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-accent-teal shrink-0" />
                              <span>{topic.label}</span>
                              {topic.timestamp && (
                                <span className="text-text-muted text-xs">({topic.timestamp})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Key Takeaways */}
                    {selectedVideo.keyTakeaways && selectedVideo.keyTakeaways.length > 0 && (
                      <div className="bg-titan-bg/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          <h3 className="text-sm font-medium text-text-primary">Key Takeaways</h3>
                        </div>
                        <ul className="space-y-2">
                          {selectedVideo.keyTakeaways.map((takeaway, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-green-400 shrink-0" />
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-titan-surface border border-titan-border rounded-2xl aspect-video flex items-center justify-center">
                <p className="text-text-muted">Select a lesson to begin</p>
              </div>
            )}
          </div>

          {/* Course sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-titan-surface border border-titan-border rounded-2xl overflow-hidden sticky top-20">
              <div className="p-4 border-b border-titan-border">
                <h3 className="font-semibold text-text-primary">Course Content</h3>
                <p className="text-text-muted text-sm">{courseModules.length} modules</p>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto">
                {courseModules.map((module) => {
                  const IconComponent = iconMap[module.icon] || BookOpen;
                  const isExpanded = expandedModules.has(module.id);
                  
                  return (
                    <div key={module.id} className="border-b border-titan-border last:border-b-0">
                      {/* Module header */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-titan-elevated transition-colors text-left"
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center shrink-0 opacity-80`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary text-sm truncate">
                            {module.title}
                          </p>
                          <p className="text-text-muted text-xs">
                            {module.videos.length} lessons
                          </p>
                        </div>
                        <ChevronRight 
                          className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </button>
                      
                      {/* Videos list */}
                      {isExpanded && (
                        <div className="bg-titan-bg/50">
                          {module.videos.map((video) => {
                            const isActive = selectedVideo?.id === video.id;
                            
                            return (
                              <button
                                key={video.id}
                                onClick={() => handleVideoSelect(module, video)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                  isActive 
                                    ? 'bg-accent-fuchsia/10 border-l-2 border-accent-fuchsia' 
                                    : 'hover:bg-titan-elevated border-l-2 border-transparent'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                  isActive 
                                    ? 'bg-accent-fuchsia text-white' 
                                    : 'bg-titan-surface text-text-muted'
                                }`}>
                                  <Play className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${
                                    isActive ? 'text-text-primary font-medium' : 'text-text-secondary'
                                  }`}>
                                    {video.title}
                                  </p>
                                  <p className="text-text-muted text-xs">{video.duration}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Course;

