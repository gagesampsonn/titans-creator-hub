export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  tagline: string;
  description: string;
  gmv7Day: number; // Raw number for sorting
  gmv7DayLabel: string; // "High", "Exploding"
  commissionRate: number;
  sampleAvailable: boolean;
  tags: string[];
  hooks: string[];
  contentTypes: string[];
}

export interface UserStats {
  savedProducts: number;
  linksCopied: number;
  samplesRequested: number;
  gmvGenerated: number;
}

export interface Brand {
  name: string;
  logo: string;
}

export type Category = "All" | "Beauty" | "Supplements" | "Pets" | "Lifestyle" | "Tech" | "Fashion";
