// Course module and video structure for the Titans Training
// Designed for future AI-powered video search

export interface VideoTopic {
  label: string;
  timestamp?: string; // e.g., "2:34" - jump to this part
}

export interface CourseVideo {
  id: string;
  title: string;
  description: string; // What the video covers
  duration: string; // e.g., "12:34"
  loomEmbedUrl: string;
  order: number;
  // Rich metadata for AI search & preview
  topics: VideoTopic[]; // Key topics covered with optional timestamps
  keyTakeaways: string[]; // What you'll learn
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[]; // For AI search matching
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Gradient color theme
  videos: CourseVideo[];
  order: number;
}

// Course modules - Add videos as you create them
export const courseModules: CourseModule[] = [
  {
    id: 'core-skills',
    title: 'Core Skills',
    description: 'Essential techniques every TikTok Shop creator needs to master',
    icon: 'Zap',
    color: 'from-yellow-500 to-orange-500',
    order: 1,
    videos: [
      {
        id: 'cs-1',
        title: 'Mastering Sales Techniques for TikTok Shop Success',
        description: 'Learn the fundamental sales techniques that drive conversions on TikTok Shop. This video covers persuasion psychology, building trust with your audience, and closing techniques adapted for short-form video.',
        duration: '0:08', // Update with actual duration
        loomEmbedUrl: 'https://www.loom.com/embed/0999654cd5584c2cb39be26c41bfe031',
        order: 1,
        topics: [
          { label: 'Sales Psychology Basics' },
          { label: 'Building Trust Quickly' },
          { label: 'Call-to-Action Techniques' },
          { label: 'Handling Objections in Comments' },
        ],
        keyTakeaways: [
          'Understand what makes people buy on TikTok',
          'Create urgency without being pushy',
          'Structure your videos for maximum conversions',
        ],
        difficulty: 'beginner',
        tags: ['sales', 'conversion', 'psychology', 'trust', 'cta', 'beginner', 'fundamentals'],
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Everything you need to know to start your TikTok Shop creator journey',
    icon: 'Rocket',
    color: 'from-green-500 to-emerald-500',
    order: 2,
    videos: [
      {
        id: 'gs-1',
        title: 'Free Sample Video',
        description: 'Learn how to get free product samples from brands to create content. This video covers the process of requesting samples, what to say, and how to build relationships with brands.',
        duration: '5:00',
        loomEmbedUrl: 'https://www.loom.com/embed/79b12989f7e243c0a255ba6239c16d11',
        order: 1,
        topics: [
          { label: 'How to Request Samples' },
          { label: 'What Brands Look For' },
          { label: 'Building Brand Relationships' },
          { label: 'Sample Request Templates' },
        ],
        keyTakeaways: [
          'Get free products to create content',
          'Write effective sample requests',
          'Build long-term brand partnerships',
        ],
        difficulty: 'beginner',
        tags: ['samples', 'free products', 'brands', 'outreach', 'getting started', 'beginner'],
      },
      {
        id: 'gs-2',
        title: 'TTS Settings',
        description: 'Configure your TikTok Shop settings for maximum success. This walkthrough covers all the essential settings you need to optimize before you start posting content.',
        duration: '8:00',
        loomEmbedUrl: 'https://www.loom.com/embed/22796b78605d41259fa9a318d4af8fb3',
        order: 2,
        topics: [
          { label: 'Account Settings Overview' },
          { label: 'Profile Optimization' },
          { label: 'Shop Configuration' },
          { label: 'Commission Settings' },
        ],
        keyTakeaways: [
          'Properly configure your TikTok Shop account',
          'Optimize your profile for conversions',
          'Set up your shop for success',
        ],
        difficulty: 'beginner',
        tags: ['settings', 'tiktok shop', 'setup', 'configuration', 'account', 'beginner'],
      },
    ],
  },
  {
    id: 'product-selection',
    title: 'Product Selection',
    description: 'Learn how to find and select winning products that convert',
    icon: 'Target',
    color: 'from-blue-500 to-cyan-500',
    order: 3,
    videos: [],
  },
  {
    id: 'content-creation',
    title: 'Content Creation',
    description: 'Create engaging content that drives sales and builds your audience',
    icon: 'Video',
    color: 'from-purple-500 to-pink-500',
    order: 4,
    videos: [],
  },
  {
    id: 'scaling',
    title: 'Scaling & Growth',
    description: 'Take your TikTok Shop business to the next level',
    icon: 'TrendingUp',
    color: 'from-orange-500 to-red-500',
    order: 5,
    videos: [],
  },
];

// Helper function to get total course duration
export function getTotalDuration(): string {
  let totalSeconds = 0;
  courseModules.forEach((module) => {
    module.videos.forEach((video) => {
      const parts = video.duration.split(':');
      if (parts.length === 2) {
        totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        totalSeconds += parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      }
    });
  });
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Helper function to get total video count
export function getTotalVideoCount(): number {
  return courseModules.reduce((acc, module) => acc + module.videos.length, 0);
}

// Helper function to find a video by ID
export function findVideoById(videoId: string): { module: CourseModule; video: CourseVideo } | null {
  for (const module of courseModules) {
    const video = module.videos.find((v) => v.id === videoId);
    if (video) {
      return { module, video };
    }
  }
  return null;
}

// Helper function to search videos by query (for future AI integration)
export function searchVideos(query: string): { module: CourseModule; video: CourseVideo; score: number }[] {
  const queryLower = query.toLowerCase();
  const results: { module: CourseModule; video: CourseVideo; score: number }[] = [];

  for (const module of courseModules) {
    for (const video of module.videos) {
      let score = 0;

      // Check title match
      if (video.title.toLowerCase().includes(queryLower)) score += 10;

      // Check description match
      if (video.description.toLowerCase().includes(queryLower)) score += 5;

      // Check tags match
      video.tags.forEach((tag) => {
        if (tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())) {
          score += 3;
        }
      });

      // Check topics match
      video.topics.forEach((topic) => {
        if (topic.label.toLowerCase().includes(queryLower)) score += 4;
      });

      // Check key takeaways match
      video.keyTakeaways.forEach((takeaway) => {
        if (takeaway.toLowerCase().includes(queryLower)) score += 2;
      });

      if (score > 0) {
        results.push({ module, video, score });
      }
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

// Get all videos flat (for AI to index)
export function getAllVideos(): { module: CourseModule; video: CourseVideo }[] {
  const all: { module: CourseModule; video: CourseVideo }[] = [];
  for (const module of courseModules) {
    for (const video of module.videos) {
      all.push({ module, video });
    }
  }
  return all;
}
