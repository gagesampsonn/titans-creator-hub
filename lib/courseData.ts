// Course module and video structure for the Titans Training
// Designed for future AI-powered video search

export interface VideoTopic {
  label: string;
  timestamp?: string; // e.g., "2:34" - jump to this part
}

export interface VideoResource {
  label: string;
  url: string;
  note?: string; // e.g., "Must open on phone"
}

export interface CourseVideo {
  id: string;
  title: string;
  description: string; // What the video covers
  duration: string; // e.g., "12:34"
  embedUrl: string; // Loom or YouTube embed URL
  videoType: 'loom' | 'youtube'; // Type of video player to use
  order: number;
  // Rich metadata for AI search & preview
  topics: VideoTopic[]; // Key topics covered with optional timestamps
  keyTakeaways: string[]; // What you'll learn
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[]; // For AI search matching
  resources?: VideoResource[]; // Optional links/resources for this video
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
        id: 'cs-0',
        title: 'Setting Expectations - What We Cover in Titans',
        description: 'Understand what Titans is all about and what to expect. Sales and content creation are the two most important skills for making money on TikTok Shop - this video breaks down our approach.',
        duration: '8:00',
        embedUrl: 'https://www.loom.com/embed/e3751992a36d4371af5ac4c91f147541',
        videoType: 'loom',
        order: 1,
        topics: [
          { label: 'What Titans Covers' },
          { label: 'Sales Skills' },
          { label: 'Content Creation' },
          { label: 'Keys to Making Money' },
        ],
        keyTakeaways: [
          'Understand the Titans program structure',
          'Sales and content are the two pillars of success',
          'Set realistic expectations for your journey',
        ],
        difficulty: 'beginner',
        tags: ['intro', 'expectations', 'sales', 'content', 'titans', 'overview', 'beginner'],
      },
      {
        id: 'cs-1',
        title: 'Mastering Sales Techniques for TikTok Shop Success',
        description: 'Learn the fundamental sales techniques that drive conversions on TikTok Shop. This video covers persuasion psychology, building trust with your audience, and closing techniques adapted for short-form video.',
        duration: '4:44',
        embedUrl: 'https://www.loom.com/embed/0999654cd5584c2cb39be26c41bfe031',
        videoType: 'loom',
        order: 2,
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
      {
        id: 'cs-2',
        title: 'Mindset for Success',
        description: 'Develop the right mindset for building a successful TikTok Shop business. Learn how to stay motivated, handle setbacks, and maintain consistency.',
        duration: '10:00',
        embedUrl: 'https://www.loom.com/embed/f48661e808244650bb4ad12c33a01da3',
        videoType: 'loom',
        order: 3,
        topics: [
          { label: 'Growth Mindset' },
          { label: 'Handling Rejection' },
          { label: 'Staying Consistent' },
          { label: 'Long-term Thinking' },
        ],
        keyTakeaways: [
          'Build mental resilience for the journey',
          'Turn failures into learning opportunities',
          'Stay motivated when results are slow',
        ],
        difficulty: 'beginner',
        tags: ['mindset', 'motivation', 'success', 'consistency', 'mental', 'beginner'],
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
        title: 'How to Get a TikTok Shop Account',
        description: 'Step-by-step guide to setting up your TikTok Shop creator account. Everything you need to know to get started and approved.',
        duration: '8:00',
        embedUrl: 'https://www.youtube.com/embed/TS_NZCFFqog',
        videoType: 'youtube',
        order: 1,
        topics: [
          { label: 'Account Requirements' },
          { label: 'Application Process' },
          { label: 'Approval Tips' },
          { label: 'Initial Setup' },
        ],
        keyTakeaways: [
          'Meet the requirements for TikTok Shop',
          'Complete the application successfully',
          'Get approved faster with these tips',
        ],
        difficulty: 'beginner',
        tags: ['account', 'setup', 'getting started', 'tiktok shop', 'application', 'beginner'],
      },
      {
        id: 'gs-2',
        title: 'Explaining TikTok Shop',
        description: 'Understand how TikTok Shop works, how creators make money, and the overall ecosystem. Perfect foundation for new creators.',
        duration: '10:00',
        embedUrl: 'https://www.loom.com/embed/5a935e6b89404078906bde4ec923660e',
        videoType: 'loom',
        order: 2,
        topics: [
          { label: 'How TikTok Shop Works' },
          { label: 'Commission Structure' },
          { label: 'Creator vs Seller' },
          { label: 'Revenue Opportunities' },
        ],
        keyTakeaways: [
          'Understand the TikTok Shop ecosystem',
          'Know how you get paid as a creator',
          'Identify the best opportunities',
        ],
        difficulty: 'beginner',
        tags: ['tiktok shop', 'explained', 'how it works', 'commission', 'beginner', 'introduction'],
      },
      {
        id: 'gs-3',
        title: 'Free Sample Video',
        description: 'Learn how to get free product samples from brands to create content. This video covers the process of requesting samples, what to say, and how to build relationships with brands.',
        duration: '5:00',
        embedUrl: 'https://www.loom.com/embed/79b12989f7e243c0a255ba6239c16d11',
        videoType: 'loom',
        order: 3,
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
        id: 'gs-4',
        title: 'TTS Settings',
        description: 'Configure your TikTok Shop settings for maximum success. This walkthrough covers all the essential settings you need to optimize before you start posting content.',
        duration: '8:00',
        embedUrl: 'https://www.loom.com/embed/22796b78605d41259fa9a318d4af8fb3',
        videoType: 'loom',
        order: 4,
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
      {
        id: 'gs-5',
        title: 'How to Get Your First Brand Deal',
        description: 'Learn how to land your first brand deal in Titans. This video includes direct links to request free samples from brands. You must open these links on your phone and have a TikTok Shop account.',
        duration: '12:00',
        embedUrl: 'https://www.loom.com/embed/aa1efa8737214ed59972233a5813c275',
        videoType: 'loom',
        order: 5,
        topics: [
          { label: 'Finding Brands with Samples' },
          { label: 'How to Request Samples' },
          { label: 'What Brands Look For' },
          { label: 'Low GMV Strategies' },
        ],
        keyTakeaways: [
          'Get free samples from real brands',
          'Land your first brand partnership',
          'Start even with low GMV',
        ],
        difficulty: 'beginner',
        tags: ['brand deal', 'samples', 'free products', 'retainer', 'first deal', 'beginner', 'brands'],
        resources: [
          { label: 'Oxyenergy', url: 'https://affiliate-us.tiktok.com/api/v1/share/AJ8u5QfzcHhE', note: 'Open on phone' },
          { label: 'HerAure', url: 'https://affiliate-us.tiktok.com/api/v1/share/AJA0SoEss2vI', note: 'Open on phone' },
          { label: 'Zooone', url: 'https://affiliate-us.tiktok.com/api/v1/share/AJ97E8tMFfqM', note: 'Open on phone' },
          { label: 'WhyNot Natural', url: 'https://affiliate-us.tiktok.com/api/v1/share/AJ6SvfsQrxmQ', note: 'Open on phone' },
          { label: 'Selerb', url: 'https://affiliate-us.tiktok.com/api/v1/share/AJAXuMmscNYh', note: 'Open on phone' },
          { label: 'Zena Nutrition', url: 'https://affiliate-us.tiktok.com/api/v1/share/AJAqjmupI5RQ', note: 'Open on phone' },
        ],
      },
      {
        id: 'gs-6',
        title: 'Working with Brands - Retainers Explained',
        description: 'Understand how brand retainers work in Titans. Learn what to expect, how payments work, and how to maximize your brand partnerships.',
        duration: '10:00',
        embedUrl: 'https://www.loom.com/embed/4b1ad894c2c94525893a19fcdf65e51e',
        videoType: 'loom',
        order: 6,
        topics: [
          { label: 'What is a Retainer?' },
          { label: 'Payment Structure' },
          { label: 'Brand Expectations' },
          { label: 'Maximizing Partnerships' },
        ],
        keyTakeaways: [
          'Understand how retainers work',
          'Know what brands expect from you',
          'Build long-term brand relationships',
        ],
        difficulty: 'beginner',
        tags: ['retainer', 'brands', 'partnership', 'payment', 'brand deal', 'beginner'],
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
    videos: [
      {
        id: 'cc-1',
        title: 'How to Add a Product to Video',
        description: 'Learn how to properly tag and add products to your TikTok videos. This is essential for earning commissions on every sale.',
        duration: '5:00',
        embedUrl: 'https://www.loom.com/embed/5c3d48050914441282d4ca37db58e900',
        videoType: 'loom',
        order: 1,
        topics: [
          { label: 'Finding Products to Tag' },
          { label: 'Adding Product Links' },
          { label: 'Best Practices for Tagging' },
          { label: 'Troubleshooting Common Issues' },
        ],
        keyTakeaways: [
          'Tag products correctly in every video',
          'Maximize your commission potential',
          'Avoid common tagging mistakes',
        ],
        difficulty: 'beginner',
        tags: ['product', 'tagging', 'video', 'commission', 'how to', 'beginner'],
      },
      {
        id: 'cc-2',
        title: 'How to Edit/Cut a Video on TikTok App',
        description: 'Master the TikTok app editing tools. Learn how to cut, trim, and edit your videos directly in the app for quick content creation.',
        duration: '7:00',
        embedUrl: 'https://www.loom.com/embed/3329a2ee7e9a410a8f2621a6b121da21',
        videoType: 'loom',
        order: 2,
        topics: [
          { label: 'Basic Editing Tools' },
          { label: 'Cutting and Trimming' },
          { label: 'Adding Text and Effects' },
          { label: 'Quick Editing Workflow' },
        ],
        keyTakeaways: [
          'Edit videos efficiently in the TikTok app',
          'Cut out mistakes and dead air',
          'Create polished content quickly',
        ],
        difficulty: 'beginner',
        tags: ['editing', 'video', 'tiktok app', 'cut', 'trim', 'beginner', 'content'],
      },
    ],
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
