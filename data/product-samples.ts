/**
 * Product Samples Data
 * 
 * Simple list of sample links - just brand, title, and link.
 */

export interface ProductSample {
  id: string;
  brand: string;
  title: string;
  tiktokLink: string;
  productCount?: number; // For bundles
  bundleProducts?: string[]; // Just names for bundles
  isGmvMax?: boolean;
}

// ===========================================
// SAMPLES
// ===========================================

export const PRODUCT_SAMPLES: ProductSample[] = [
  // ===== BUNDLES =====
  {
    id: 'her-fantasy-box',
    brand: 'Her Fantasy Box',
    title: '6 Products Bundle',
    tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE1rE1VWZKj',
    productCount: 6,
    bundleProducts: [
      'Body Magic Chlorophyll Pill',
      'The Balance Bundle - Feminine Hygiene Self Care',
      'Slippery Box',
      'Renew Her Oil For Hydrated, Glowing Skin',
      'Probiotics for Odor Control',
      'Plant Based pH Balance Gel Wash',
    ],
  },
  {
    id: 'nello-x-titans-bundle',
    brand: 'Nello x Titans',
    title: '5 Products Bundle',
    tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJHEC6cWt82f',
    productCount: 5,
  },
  {
    id: 'titans-product-list-bundle',
    brand: 'Product List x Titans',
    title: '9 Products Bundle',
    tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJHy9vyAe8oR',
    productCount: 9,
    bundleProducts: [
      'BoomBoom Nasal Stick (Featured on Shark Tank)',
      'Akunbem Electric Shaver for Women',
      'GuruNanda Cocomint Pulling Oil with 7 Essential Oils',
      'GuruNanda Whitening Strips 7-day Treatment',
      'EZ BOMBS BirriaBombs 2 Bombs Per Pack',
      'BACtrack Go Keychain Breathalyzer',
      'Akunbem Bikini Trimmer for Women',
      'Yerba Magic Instant Tea Powder',
      'Philips Norelco OneBlade 360 Face',
    ],
  },
  {
    id: 'fashion-brands-bundle',
    brand: 'LEVI\'S x NIKE x ADIDAS',
    title: '10 Products Bundle',
    tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJHyB2iEGMhS',
    productCount: 10,
    bundleProducts: [
      'LEVI\'S Superlow Loose Womens Jeans',
      'LEVI\'S \'94 Baggy Womens Jean',
      'NIKE SB Force 58 Mens Shoes',
      'NIKE V5 RNR Mens Shoes',
      'NIKE Calm Mens Slides',
      'NIKE V5 RNR Womens Shoes',
      'NIKE Sportswear Club Fleece Womens Wide Leg Pants',
      'LEVI\'S Vintage Denim Womens Overalls',
      'ADIDAS VL Court Bold Womens Platform Shoes',
      'LEVI\'S Superlow Womens Loose Jeans - Twisted Vibe',
    ],
  },

  // ===== SINGLE PRODUCTS =====
  { id: 'bucked-up', brand: 'Bucked Up', title: 'Ready-to-Drink Lightly-Carbonated', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE1tkBbM2yr' },
  // ===== FEATURED INSTANT SAMPLES =====
  { id: 'goli', brand: 'Goli Nutrition', title: '3 Bottles Best Seller Bundle — Ashwagandha, ACV & Matcha Mind', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJB5Ljr3LF8b', productCount: 3, bundleProducts: ['Ashwagandha Gummies', 'Apple Cider Vinegar Gummies', 'Matcha Mind Gummies'] },

  // ===== INDIVIDUAL SAMPLES =====
  { id: 'vyhthy', brand: 'VYHTHY', title: 'Creatine Monohydrate Gummies', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJHbXlJq2ETB' },
  { id: 'yerba-magic', brand: 'Yerba Magic', title: 'Yerba Magic Capsules', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJHbKNAjtIY6' },
  { id: 'biohealth', brand: 'BIOHEALTH', title: 'Probioderm 3D Lifting Cream Mist', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJH7HL4sXyPJ' },
  { id: 'dr-mopick', brand: 'Dr.Mopick', title: 'Anti-Wrinkle Essence', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJGfZNHp3PqB' },
  { id: 'flynew', brand: 'Flynew', title: 'Optimal Potency Shilajit Ultra 60 Capsules', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJGGSxSc1jJ4' },
  { id: 'kirkland', brand: 'Kirkland Signature', title: 'Minoxidil Liquid Extra Strength Hair Loss', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJFSDWK9Nlcc' },
  { id: 'yerba-hydration', brand: 'Yerba', title: 'Hydration & Energy Drink Mix', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJEjeljfTzvJ' },
  { id: 'total-male', brand: 'Total Male', title: '3-in-1 Alpha Blend Vitality Nitric Oxide', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE1tkBbM2yr' },
  { id: 'ceelike', brand: 'CEELIKE', title: 'BOGO! Probiotic Oral Spray', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE1tkBbM2yr' },
  { id: 'flimeal', brand: 'Flimeal', title: 'Crunchy Protein Powder', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE1tkBbM2yr' },
  { id: 'batavia', brand: 'Batavia Health', title: 'Brenox Sleepy Melatonin 5mg + Vitamin B6', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJHy7BuWOLOd' },

  // ===== GMV MAX BRANDS =====
  { id: 'ycz', brand: 'YCZ', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE4OD41XbXJ', isGmvMax: true },
  { id: 'whynot', brand: 'WhyNot Natural', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE4ML4zDLAE', isGmvMax: true },
  { id: 'nello-supercalm', brand: 'Nello SuperCalm', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE1s2acs3lU', isGmvMax: true },
  { id: 'ekkovision', brand: 'Ekkovision', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJAmjmisgxl0', isGmvMax: true },
  { id: 'heraure', brand: 'HerAuré', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJ99RSA0HWvh', isGmvMax: true },
  { id: 'selerb', brand: 'Selerb', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJAXuMmscNYh', isGmvMax: true },
  { id: 'natural-stacks', brand: 'Natural Stacks', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJBFE3YpbQX9', isGmvMax: true },
  { id: 'gnc', brand: 'GNC', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE4Lc2Hbn7S', isGmvMax: true },
  { id: 'dr-melaxin', brand: 'Dr. Melaxin', title: 'GMV Max', tiktokLink: 'https://affiliate-us.tiktok.com/api/v1/share/AJE4LgeHqeUJ', isGmvMax: true },
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export const getGmvMaxProducts = (samples: ProductSample[]) =>
  samples.filter(s => s.isGmvMax);

export const getNonGmvMaxProducts = (samples: ProductSample[]) =>
  samples.filter(s => !s.isGmvMax);

export const getBundles = (samples: ProductSample[]) =>
  samples.filter(s => s.productCount && s.productCount > 1);
