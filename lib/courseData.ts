// Course module and video structure for the Titans Training

export interface CourseVideo {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "12:34"
  loomEmbedUrl: string; // Loom share/embed URL
  order: number;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  videos: CourseVideo[];
  order: number;
}

// Placeholder course data - Update with actual Loom video URLs
export const courseModules: CourseModule[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Everything you need to know to start your TikTok Shop creator journey',
    icon: 'Rocket',
    order: 1,
    videos: [
      {
        id: 'gs-1',
        title: 'Welcome to Titans',
        description: 'An introduction to the Titans platform and what you\'ll learn',
        duration: '5:23',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 1,
      },
      {
        id: 'gs-2',
        title: 'Setting Up Your TikTok Shop Account',
        description: 'Step-by-step guide to creating and optimizing your TikTok Shop creator account',
        duration: '12:45',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 2,
      },
      {
        id: 'gs-3',
        title: 'Understanding the Dashboard',
        description: 'Navigate the Titans dashboard and track your performance',
        duration: '8:17',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 3,
      },
    ],
  },
  {
    id: 'product-selection',
    title: 'Product Selection Mastery',
    description: 'Learn how to find and select winning products that convert',
    icon: 'Target',
    order: 2,
    videos: [
      {
        id: 'ps-1',
        title: 'Finding Trending Products',
        description: 'How to identify trending products before they blow up',
        duration: '15:32',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 1,
      },
      {
        id: 'ps-2',
        title: 'Analyzing Product Potential',
        description: 'Key metrics to evaluate before promoting a product',
        duration: '11:48',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 2,
      },
      {
        id: 'ps-3',
        title: 'Commission Structures Explained',
        description: 'Understanding how commissions work and maximizing your earnings',
        duration: '9:22',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 3,
      },
    ],
  },
  {
    id: 'content-creation',
    title: 'Content Creation Strategies',
    description: 'Create engaging content that drives sales and builds your audience',
    icon: 'Video',
    order: 3,
    videos: [
      {
        id: 'cc-1',
        title: 'The Perfect TikTok Shop Video',
        description: 'Anatomy of a high-converting product video',
        duration: '18:45',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 1,
      },
      {
        id: 'cc-2',
        title: 'Hook Writing Masterclass',
        description: 'Craft hooks that stop the scroll and drive engagement',
        duration: '14:33',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 2,
      },
      {
        id: 'cc-3',
        title: 'Batch Content Creation',
        description: 'How to create a week\'s worth of content in one day',
        duration: '16:21',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 3,
      },
      {
        id: 'cc-4',
        title: 'Editing Tips & Tools',
        description: 'Quick editing techniques that boost video performance',
        duration: '12:09',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 4,
      },
    ],
  },
  {
    id: 'scaling',
    title: 'Scaling Your Business',
    description: 'Take your TikTok Shop business to the next level',
    icon: 'TrendingUp',
    order: 4,
    videos: [
      {
        id: 'sc-1',
        title: 'Building Your Brand',
        description: 'Develop a recognizable brand that attracts loyal followers',
        duration: '13:56',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 1,
      },
      {
        id: 'sc-2',
        title: 'Working with Brands',
        description: 'How to land brand deals and negotiate partnerships',
        duration: '17:28',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 2,
      },
      {
        id: 'sc-3',
        title: 'Advanced Analytics',
        description: 'Deep dive into metrics that matter for growth',
        duration: '14:44',
        loomEmbedUrl: 'https://www.loom.com/embed/PLACEHOLDER_VIDEO_ID',
        order: 3,
      },
    ],
  },
];

// Helper function to get total course duration
export function getTotalDuration(): string {
  let totalMinutes = 0;
  courseModules.forEach((module) => {
    module.videos.forEach((video) => {
      const [mins, secs] = video.duration.split(':').map(Number);
      totalMinutes += mins + secs / 60;
    });
  });
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return `${hours}h ${mins}m`;
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

