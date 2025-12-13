import { Product, UserStats, Brand } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'GlowRadiance Vitamin C Serum',
    brand: 'Lumina Skin',
    category: 'Beauty',
    image: 'https://picsum.photos/400/400?random=1',
    tagline: 'Brighten skin and reduce dark spots in 7 days.',
    description: 'A high-potency Vitamin C serum that targets hyperpigmentation and dullness. Perfect for morning routines and "get ready with me" videos. Viewers love the instant glow effect.',
    gmv7Day: 15000,
    gmv7DayLabel: 'Exploding',
    commissionRate: 25,
    sampleAvailable: true,
    tags: ['Skincare', 'Viral', 'UGC'],
    hooks: [
      "Stop scrolling if you have dark spots!",
      "The secret to glass skin isn't water...",
      "I tried the viral serum so you don't have to."
    ],
    contentTypes: ['Before/After', 'Routine', 'Texture Shot']
  },
  {
    id: '2',
    name: 'ProFlex Resistance Bands Set',
    brand: 'Titan Fitness',
    category: 'Lifestyle',
    image: 'https://picsum.photos/400/400?random=2',
    tagline: 'Gym-quality workout at home.',
    description: 'Heavy-duty resistance bands with 5 varying levels. Snap-resistant and comes with a travel pouch. Ideal for fitness creators and home workout demonstrations.',
    gmv7Day: 8500,
    gmv7DayLabel: 'High',
    commissionRate: 20,
    sampleAvailable: true,
    tags: ['Fitness', 'Home Gym', 'Live-friendly'],
    hooks: [
      "Cancel your gym membership.",
      "Can you survive this 10 min booty workout?",
      "3 exercises to tone your arms at home."
    ],
    contentTypes: ['Workout Demo', 'Challenge', 'Unboxing']
  },
  {
    id: '3',
    name: 'ZenSleep Magnesium Gummies',
    brand: 'NutraLife',
    category: 'Supplements',
    image: 'https://picsum.photos/400/400?random=3',
    tagline: 'Deep sleep without the grogginess.',
    description: 'Vegan, sugar-free magnesium glycinate gummies. Helps with relaxation and muscle recovery. Great for night routine videos.',
    gmv7Day: 4200,
    gmv7DayLabel: 'Medium',
    commissionRate: 30,
    sampleAvailable: false,
    tags: ['Health', 'Sleep', 'Wellness'],
    hooks: [
      "Insomniacs, you need to see this.",
      "My night routine for deep sleep.",
      "Why I stopped taking melatonin."
    ],
    contentTypes: ['Night Routine', 'Educational', 'POV']
  },
  {
    id: '4',
    name: 'Pawsome Slow Feeder Bowl',
    brand: 'Happy Tails',
    category: 'Pets',
    image: 'https://picsum.photos/400/400?random=4',
    tagline: 'Prevent bloating and improve digestion.',
    description: 'Interactive puzzle feeder for dogs and cats. Non-slip base and food-safe materials. Engaging content for pet owners.',
    gmv7Day: 12000,
    gmv7DayLabel: 'High',
    commissionRate: 15,
    sampleAvailable: true,
    tags: ['Pets', 'Dog Mom', 'Utility'],
    hooks: [
      "Does your dog eat too fast?",
      "Best purchase for my puppy hands down.",
      "Watch my dog figure this out!"
    ],
    contentTypes: ['Demo', 'Cute Moments', 'Problem/Solution']
  },
  {
    id: '5',
    name: 'CrystalClear Audio Mic',
    brand: 'StreamTech',
    category: 'Tech',
    image: 'https://picsum.photos/400/400?random=5',
    tagline: 'Studio quality audio for your phone.',
    description: 'Wireless lapel microphone compatible with iPhone and Android. Plug and play, noise cancellation included. Essential for content creators.',
    gmv7Day: 25000,
    gmv7DayLabel: 'Exploding',
    commissionRate: 18,
    sampleAvailable: true,
    tags: ['Tech', 'Creator Tools', 'Gadget'],
    hooks: [
      "Stop recording with bad audio!",
      "How to make your TikToks sound professional.",
      "The $30 mic that beats the $300 one."
    ],
    contentTypes: ['Audio Test', 'Tech Review', 'Tutorial']
  },
  {
    id: '6',
    name: 'LuxeModal Lounge Set',
    brand: 'ComfyCo',
    category: 'Fashion',
    image: 'https://picsum.photos/400/400?random=6',
    tagline: 'Butter soft fabric you won\'t want to take off.',
    description: 'Sustainable modal fabric lounge set. Breathable, stretchy, and flattering fit. Perfect for haul videos and aesthetic lifestyle content.',
    gmv7Day: 6000,
    gmv7DayLabel: 'Medium',
    commissionRate: 12,
    sampleAvailable: false,
    tags: ['Fashion', 'Haul', 'Aesthetic'],
    hooks: [
      "I'm living in this set.",
      "Skims dupe? Let's test it.",
      "Work from home outfit inspo."
    ],
    contentTypes: ['Try-on Haul', 'Styling', 'OOTD']
  }
];

export const MOCK_USER_STATS: UserStats = {
  savedProducts: 14,
  linksCopied: 45,
  samplesRequested: 8,
  gmvGenerated: 12500
};

export const MOCK_BRANDS: Brand[] = [
  { name: 'Lumina', logo: '' },
  { name: 'Titan', logo: '' },
  { name: 'Nutra', logo: '' },
  { name: 'Stream', logo: '' },
];
