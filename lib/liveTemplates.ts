// TITANS LIVE TEMPLATE LIBRARY
// Each template includes script guidance, authority words, demo ideas, and infographic prompts

export interface LiveTemplate {
  id: string;
  name: string;
  category: 'supplements' | 'beauty' | 'grooming' | 'wellness' | 'household';
  coreAngles: string[];
  authorityWords: string[];
  demoIdeas: string[];
  infographicConcept: string;
  infographicPrompt: string;
}

export const liveTemplates: LiveTemplate[] = [
  // 🧪 SUPPLEMENTS
  {
    id: 'nitric-oxide',
    name: 'Nitric Oxide Booster',
    category: 'supplements',
    coreAngles: ['Blood flow support', 'Oxygen delivery', 'Workout performance', 'Circulation'],
    authorityWords: ['nitric oxide', 'vasodilation', 'blood flow', 'circulation', 'oxygen delivery', 'pump'],
    demoIdeas: [
      'Show infographic of widening blood vessels',
      'Mention gym pump feeling',
      'Compare to stim-free preworkout'
    ],
    infographicConcept: 'Step-by-step: nitric oxide → vessels widen → more blood → oxygen → performance',
    infographicPrompt: 'Simple educational infographic showing how nitric oxide works in the body. Step 1: blood vessel before vasodilation (narrow). Step 2: nitric oxide signal. Step 3: blood vessel widening. Step 4: increased blood flow and oxygen delivery to muscles. Use arrows between steps. Clean medical-style diagram, labeled "circulation," "oxygen," "blood flow." Minimal colors, blue and red tones.'
  },
  {
    id: 'creatine',
    name: 'Creatine Gummies',
    category: 'supplements',
    coreAngles: ['Strength support', 'ATP energy system', 'Muscle fullness', 'Convenience vs powder'],
    authorityWords: ['creatine', 'ATP', 'saturation', 'dosage', 'serving', 'absorption'],
    demoIdeas: [
      'Gummy vs powder convenience',
      'Show serving size',
      'Mention daily use'
    ],
    infographicConcept: 'Creatine → ATP production → muscle energy → performance',
    infographicPrompt: 'Simple fitness infographic showing creatine\'s role in muscle energy. Step 1: creatine stored in muscle. Step 2: ATP energy system. Step 3: muscle contraction during workout. Step 4: strength and performance support. Use labels "ATP," "muscle energy," "creatine storage." Flat modern design.'
  },
  {
    id: 'ashwagandha',
    name: 'Ashwagandha',
    category: 'supplements',
    coreAngles: ['Stress support', 'Recovery', 'Balance'],
    authorityWords: ['ashwagandha', 'adaptogen', 'cortisol', 'KSM-66', 'root extract'],
    demoIdeas: [
      'Explain "adaptogen"',
      'Talk about daily routine use'
    ],
    infographicConcept: 'Stress → cortisol → adaptogen support → balance',
    infographicPrompt: 'Calm wellness infographic showing stress pathway. Step 1: stress signal. Step 2: cortisol response. Step 3: adaptogen support. Step 4: balanced system. Use labels "stress," "cortisol," "adaptogen." Soft colors, simple body outline.'
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    category: 'supplements',
    coreAngles: ['Muscle relaxation', 'Sleep support', 'Recovery'],
    authorityWords: ['magnesium', 'glycinate', 'citrate', 'electrolyte', 'mineral'],
    demoIdeas: [
      'Explain different forms (glycinate vs citrate)',
      'Mention nighttime routine'
    ],
    infographicConcept: 'Magnesium → nervous system → relaxation',
    infographicPrompt: 'Infographic of nervous system and muscles. Step 1: nerve signal. Step 2: muscle contraction. Step 3: magnesium support. Step 4: relaxation and recovery. Labels: "muscle," "nervous system," "relaxation."'
  },
  {
    id: 'prostate',
    name: 'Prostate Health',
    category: 'supplements',
    coreAngles: ["Men's wellness", 'Aging support'],
    authorityWords: ['saw palmetto', 'beta-sitosterol', 'prostate support', 'urinary flow'],
    demoIdeas: [
      'Target men 40+',
      'Mention daily support'
    ],
    infographicConcept: "Men's health focus diagram",
    infographicPrompt: 'Educational male wellness infographic. Show bladder, prostate, urinary flow. Arrows showing flow support. Labels: "prostate," "urinary system," "men\'s health."'
  },
  {
    id: 'collagen',
    name: 'Collagen',
    category: 'supplements',
    coreAngles: ['Skin support', 'Hair strength', 'Joint health'],
    authorityWords: ['collagen peptides', 'type I & III', 'elasticity', 'skin support'],
    demoIdeas: [
      'Show powder mixing',
      'Mention daily routine'
    ],
    infographicConcept: 'Collagen → skin → hair → joints',
    infographicPrompt: 'Skin structure infographic. Step 1: collagen fibers. Step 2: skin elasticity. Step 3: hair and joints support. Labels: "collagen," "elasticity," "skin structure."'
  },
  {
    id: 'greens',
    name: 'Greens Powder',
    category: 'supplements',
    coreAngles: ['Nutrient density', 'Digestion support', 'Daily nutrition'],
    authorityWords: ['superfoods', 'antioxidants', 'phytonutrients', 'digestion'],
    demoIdeas: [
      'Show mixing into water',
      'Compare to eating salads'
    ],
    infographicConcept: 'Nutrients → digestion → absorption',
    infographicPrompt: 'Digestive system diagram. Step 1: nutrients. Step 2: digestion. Step 3: absorption. Labels "phytonutrients," "digestion," "gut."'
  },
  {
    id: 'protein-coffee',
    name: 'Protein Coffee',
    category: 'supplements',
    coreAngles: ['Morning routine', 'Protein intake', 'Energy + nutrition'],
    authorityWords: ['protein blend', 'macros', 'caffeine', 'whey', 'plant protein'],
    demoIdeas: [
      'Show morning routine',
      'Compare to separate coffee + shake'
    ],
    infographicConcept: 'Caffeine energy + protein intake → muscle support',
    infographicPrompt: 'Infographic combining coffee bean + muscle icon. Step 1: caffeine energy. Step 2: protein intake. Step 3: muscle support. Labels "protein," "energy," "recovery."'
  },
  {
    id: 'shilajit',
    name: 'Shilajit',
    category: 'supplements',
    coreAngles: ['Mineral support', 'Traditional use', 'Energy'],
    authorityWords: ['fulvic acid', 'mineral pitch', 'trace minerals'],
    demoIdeas: [
      'Explain what shilajit is',
      'Show resin form vs capsules'
    ],
    infographicConcept: 'Trace minerals → cellular support',
    infographicPrompt: 'Mineral and nutrient absorption diagram. Step 1: trace minerals. Step 2: cellular support. Labels "fulvic acid," "minerals."'
  },
  {
    id: 'testosterone',
    name: 'Testosterone Support',
    category: 'supplements',
    coreAngles: ["Men's vitality", 'Energy', 'Hormonal balance'],
    authorityWords: ['zinc', 'D-aspartic acid', 'tribulus', 'hormonal support'],
    demoIdeas: [
      'Target men 30+',
      'Mention natural support'
    ],
    infographicConcept: 'Endocrine system → hormone support → balance',
    infographicPrompt: 'Hormone pathway diagram. Step 1: endocrine system. Step 2: hormone support. Labels "zinc," "D-aspartic acid," "hormonal balance."'
  },

  // 💄 BEAUTY
  {
    id: 'retinol',
    name: 'Retinol Serum',
    category: 'beauty',
    coreAngles: ['Skin texture', 'Cell turnover', 'Anti-aging support'],
    authorityWords: ['retinol', 'cell turnover', 'texture', 'anti-aging', 'serum'],
    demoIdeas: [
      'Show application technique',
      'Mention nighttime use only'
    ],
    infographicConcept: 'Surface texture → cell turnover → smoother skin',
    infographicPrompt: 'Skin layer diagram. Step 1: surface texture. Step 2: cell turnover. Step 3: smoother appearance. Labels "retinol," "cell turnover," "skin texture."'
  },
  {
    id: 'vitamin-c',
    name: 'Vitamin C Serum',
    category: 'beauty',
    coreAngles: ['Brightening', 'Antioxidant protection', 'Even tone'],
    authorityWords: ['ascorbic acid', 'brightening', 'antioxidant', 'hyperpigmentation'],
    demoIdeas: [
      'Show dropper application',
      'Mention morning routine'
    ],
    infographicConcept: 'Dull skin → antioxidant support → brighter appearance',
    infographicPrompt: 'Skin brightening infographic. Step 1: dull skin. Step 2: antioxidant support. Step 3: brighter appearance. Labels "vitamin C," "antioxidant."'
  },
  {
    id: 'hair-oil',
    name: 'Hair Growth Oil',
    category: 'beauty',
    coreAngles: ['Scalp health', 'Hair thickness', 'Natural oils'],
    authorityWords: ['scalp', 'follicles', 'castor oil', 'rosemary oil'],
    demoIdeas: [
      'Show scalp application',
      'Mention massage technique'
    ],
    infographicConcept: 'Scalp → follicle nourishment → thicker hair',
    infographicPrompt: 'Scalp cross-section diagram. Step 1: hair follicle. Step 2: scalp nourishment. Step 3: thicker hair appearance. Labels "follicle," "scalp."'
  },

  // 🧔 MEN'S GROOMING
  {
    id: 'cologne',
    name: 'Cologne',
    category: 'grooming',
    coreAngles: ['Longevity', 'Projection', 'Scent profile'],
    authorityWords: ['longevity', 'sillage', 'projection', 'atomizer', 'dry-down', 'base notes'],
    demoIdeas: [
      'Show atomizer spray',
      'Explain note pyramid',
      'Mention 6-8 hour longevity'
    ],
    infographicConcept: 'Top notes → mid notes → base notes',
    infographicPrompt: 'Fragrance pyramid infographic. Top notes → mid notes → base notes. Labels "longevity," "projection," "dry-down."'
  },
  {
    id: 'beard-oil',
    name: 'Beard Oil',
    category: 'grooming',
    coreAngles: ['Beard conditioning', 'Softness', 'Skin underneath'],
    authorityWords: ['carrier oil', 'jojoba', 'argan oil', 'conditioning'],
    demoIdeas: [
      'Show application to beard',
      'Mention daily use'
    ],
    infographicConcept: 'Dry beard → oil absorption → conditioned beard',
    infographicPrompt: 'Beard hair cross-section diagram. Step 1: dry beard hair. Step 2: oil absorption. Step 3: conditioned beard. Labels "argan oil," "conditioning."'
  },

  // 🧠 WELLNESS DEVICES
  {
    id: 'red-light',
    name: 'Red Light Therapy',
    category: 'wellness',
    coreAngles: ['Light wavelength', 'Skin support', 'Recovery'],
    authorityWords: ['wavelength', 'nm', 'mitochondrial support', 'recovery'],
    demoIdeas: [
      'Show device in use',
      'Explain wavelength numbers'
    ],
    infographicConcept: 'Red light waves → skin penetration → cellular support',
    infographicPrompt: 'Light wavelength diagram. Step 1: red light waves. Step 2: skin penetration. Step 3: cellular support. Labels "wavelength," "nm."'
  },
  {
    id: 'massage-gun',
    name: 'Massage Gun',
    category: 'wellness',
    coreAngles: ['Percussion therapy', 'Muscle recovery', 'Deep tissue'],
    authorityWords: ['percussion', 'RPM', 'attachments', 'deep tissue'],
    demoIdeas: [
      'Show on muscle groups',
      'Demonstrate attachments'
    ],
    infographicConcept: 'Percussion waves → muscle → recovery',
    infographicPrompt: 'Muscle diagram with percussion waves. Labels "percussion," "deep tissue," "recovery."'
  },

  // 🏠 HOUSEHOLD
  {
    id: 'water-bottle',
    name: 'Insulated Water Bottle',
    category: 'household',
    coreAngles: ['Temperature retention', 'Durability', 'Capacity'],
    authorityWords: ['double-wall', 'insulation', 'ounces', 'leakproof', 'stainless'],
    demoIdeas: [
      'Show ice still frozen hours later',
      'Demonstrate leakproof'
    ],
    infographicConcept: 'Double-wall → insulation → temperature retention',
    infographicPrompt: 'Double-wall bottle diagram showing insulation layers. Labels "double-wall," "temperature retention."'
  },
  {
    id: 'air-fryer',
    name: 'Air Fryer',
    category: 'household',
    coreAngles: ['Rapid air cooking', 'Healthier frying', 'Convenience'],
    authorityWords: ['wattage', 'capacity', 'presets', 'nonstick basket'],
    demoIdeas: [
      'Show food cooking',
      'Mention presets'
    ],
    infographicConcept: 'Hot air circulation → even cooking',
    infographicPrompt: 'Air circulation diagram. Step 1: hot air. Step 2: food cooking evenly. Labels "rapid air," "wattage."'
  },
  {
    id: 'portable-blender',
    name: 'Portable Blender',
    category: 'household',
    coreAngles: ['Portability', 'USB charging', 'Quick blending'],
    authorityWords: ['RPM', 'USB-C charging', 'blades', 'capacity'],
    demoIdeas: [
      'Show blending on the go',
      'Demonstrate USB charging'
    ],
    infographicConcept: 'Motor + blades → smooth blend',
    infographicPrompt: 'Blender motor and blade diagram. Labels "RPM," "stainless blades," "USB charging."'
  }
];

// Helper to get template by ID
export function getTemplateById(id: string): LiveTemplate | undefined {
  return liveTemplates.find(t => t.id === id);
}

// Helper to get templates by category
export function getTemplatesByCategory(category: LiveTemplate['category']): LiveTemplate[] {
  return liveTemplates.filter(t => t.category === category);
}

// Category labels
export const templateCategories = [
  { value: 'supplements', label: '🧪 Supplements' },
  { value: 'beauty', label: '💄 Beauty' },
  { value: 'grooming', label: '🧔 Men\'s Grooming' },
  { value: 'wellness', label: '🧠 Wellness Devices' },
  { value: 'household', label: '🏠 Household' },
];

