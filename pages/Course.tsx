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

// Secret access key for temporary guest access (share this URL: /course?access=titans2026)
const GUEST_ACCESS_KEY = 'titans2026';

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
  const [isGuestAccess, setIsGuestAccess] = useState(false);

  // Check for guest access key in URL
  const accessKey = searchParams.get('access');
  const hasGuestKey = accessKey === GUEST_ACCESS_KEY;
  
  // Check for direct video link (shareable preview)
  const directVideoId = searchParams.get('video');
  const hasDirectVideoLink = !!directVideoId;

  // Track if viewing via shareable link (limited access to one video)
  const [isShareablePreview, setIsShareablePreview] = useState(false);
  
  // Check Whop membership on mount
  const DEV_BYPASS = false; // PRODUCTION MODE - verifies WHOP membership
  
  useEffect(() => {
    const checkMembership = async () => {
      // Guest access via secret URL key
      if (hasGuestKey) {
        setIsGuestAccess(true);
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }
      
      // Direct video link - allow viewing this one video without login
      if (hasDirectVideoLink && !user) {
        setIsShareablePreview(true);
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }
      
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
  }, [user, authLoading, hasGuestKey, hasDirectVideoLink]);

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
    // If in shareable preview mode and trying to select a different video, prompt login
    if (isShareablePreview && video.id !== directVideoId) {
      navigate('/login');
      return;
    }
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

  // Loading state (skip if guest access key or direct video link is present)
  if ((authLoading || checkingAccess) && !hasGuestKey && !hasDirectVideoLink) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent-fuchsia animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in (but allow guest access with key or direct video link)
  if (!user && !hasGuestKey && !hasDirectVideoLink) {
    return (
      <div className="min-h-screen bg-titan-bg">
        <div className="max-w-3xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-fuchsia to-accent-teal rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-fuchsia/20">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">Titans Training</h1>
            <p className="text-lg text-text-secondary max-w-xl mx-auto">
              Master TikTok Shop affiliate marketing with our comprehensive video course. 
              Learn the exact strategies top creators use to generate 6-figure revenue.
            </p>
          </div>

          {/* Important Notice Card */}
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-orange-400 mb-2">⚠️ Important: Use Your WHOP Email</h2>
                <p className="text-text-secondary mb-3">
                  To access the course, you <strong className="text-text-primary">must log in with the same email address</strong> you used to purchase your Titans membership on WHOP.
                </p>
                <p className="text-text-muted text-sm">
                  If you use a different email, the system won't be able to verify your membership and you won't be able to view any course content.
                </p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-titan-surface border border-titan-border rounded-2xl p-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-fuchsia/20 to-accent-teal/20 rounded-xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-accent-fuchsia" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Ready to Start Learning?</h2>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Log in with your WHOP email to unlock all course modules, video lessons, and exclusive resources.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-accent-fuchsia to-accent-teal text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-accent-fuchsia/20"
            >
              Log In to Access Course
            </button>
            <p className="text-text-muted text-sm mt-4">
              Don't have a membership yet?{' '}
              <a 
                href="https://whop.com/tiktokshopaffiliate/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent-teal hover:underline"
              >
                Join Titans on WHOP →
              </a>
            </p>
          </div>

          {/* Course Preview */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-text-primary mb-6 text-center">What You'll Learn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Rocket, title: 'Getting Started', desc: 'Set up your TikTok Shop account the right way' },
                { icon: Target, title: 'Finding Products', desc: 'Discover high-converting products to promote' },
                { icon: Video, title: 'Content Creation', desc: 'Create videos that drive sales and go viral' },
                { icon: TrendingUp, title: 'Scaling Up', desc: 'Advanced strategies to multiply your income' },
              ].map((item, idx) => (
                <div key={idx} className="bg-titan-surface/50 border border-titan-border rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent-fuchsia/10 to-accent-teal/10 rounded-lg flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-accent-teal" />
                  </div>
                  <div>
                    <h4 className="font-medium text-text-primary mb-1">{item.title}</h4>
                    <p className="text-sm text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No access (but allow guest access with key or direct video link)
  if (!hasAccess && !hasGuestKey && !hasDirectVideoLink) {
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
                  <EmailWatermark email={isShareablePreview ? 'Preview - Sign up for full access' : (isGuestAccess ? 'Guest Preview' : (user?.email || ''))} />
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
                  
                  {/* Resources / Links */}
                  {selectedVideo.resources && selectedVideo.resources.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-accent-fuchsia/10 to-accent-teal/10 rounded-xl p-4 border border-accent-fuchsia/20">
                      <div className="flex items-center gap-2 mb-3">
                        <ExternalLink className="w-4 h-4 text-accent-fuchsia" />
                        <h3 className="text-sm font-medium text-text-primary">Resources & Links</h3>
                        <span className="text-xs text-text-muted">(Open on phone with TikTok Shop account)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedVideo.resources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-titan-surface rounded-lg hover:bg-titan-elevated transition-colors group"
                          >
                            <span className="text-sm text-text-primary group-hover:text-accent-fuchsia transition-colors">
                              {resource.label}
                            </span>
                            <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-accent-fuchsia transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
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

