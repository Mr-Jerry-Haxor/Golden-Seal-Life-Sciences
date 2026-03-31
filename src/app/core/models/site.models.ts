import { GOLDEN_SEAL_LOGO_URL } from '../config/brand-assets.config';

export type ProductCategory =
  | 'Aqua Probiotics'
  | 'Agricultural Micronutrients'
  | 'Fine Chemicals'
  | 'Custom Solutions';

export interface HeroContent {
  heading: string;
  subheading: string;
  ctaPrimaryLabel: string;
  ctaPrimaryLink: string;
  ctaSecondaryLabel: string;
  ctaSecondaryLink: string;
  backgroundImageUrl: string;
}

export interface HomeSection {
  id: string;
  title: string;
  summary: string;
  productIds: string[];
}

export type AnnouncementMode = 'text' | 'image';
export type AnnouncementSeparator = 'star' | 'announcement';

export interface AnnouncementTextItem {
  id: string;
  text: string;
}

export interface AnnouncementImageItem {
  id: string;
  imageUrl: string;
  caption: string;
  alt: string;
}

export interface AnnouncementContent {
  enabled: boolean;
  mode: AnnouncementMode;
  separator: AnnouncementSeparator;
  scrollSpeedSeconds: number;
  slideshowIntervalMs: number;
  textItems: AnnouncementTextItem[];
  imageItems: AnnouncementImageItem[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  highlighted: boolean;
  sectionId: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SiteTheme {
  brandPrimary: string;
  brandSecondary: string;
  accent: string;
  backgroundStart: string;
  backgroundEnd: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
  pointerColor: string;
}

export interface SiteSettings {
  companyName: string;
  companyTagline: string;
  companyStory: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
}

export interface MediaItem {
  id: string;
  name: string;
  hash: string;
  storagePath: string;
  downloadUrl: string;
  cloudinaryPublicId?: string;
  cloudinaryDeleteToken?: string;
  createdAt: number;
}

export interface AnalyticsEvent {
  eventType: string;
  path: string;
  referrer: string;
  sessionId: string;
  screen: string;
  timezone: string;
  language: string;
  cookieKeys: string[];
  createdAt: number;
}

export interface LeadCapture {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  sourcePath: string;
  consent: boolean;
  createdAt: number;
}

export type LeadStatus = 'new' | 'in-progress' | 'closed';

export interface LeadRecord extends LeadCapture {
  id: string;
  status: LeadStatus;
  updatedAt: number;
  adminNotes?: string;
}

export interface HomeContent {
  hero: HeroContent;
  sections: HomeSection[];
  highlights: string[];
  announcement: AnnouncementContent;
}

export interface SiteSnapshot {
  content: HomeContent;
  products: Product[];
  theme: SiteTheme;
  settings: SiteSettings;
  media: MediaItem[];
}

export const DEFAULT_THEME: SiteTheme = {
  brandPrimary: '#1A7A50',
  brandSecondary: '#6DBB7A',
  accent: '#E9B44C',
  backgroundStart: '#f5fbf7',
  backgroundEnd: '#e7f4eb',
  surface: '#ffffff',
  textPrimary: '#122117',
  textMuted: '#4a5d50',
  pointerColor: '#e9b44c'
};

export const DEFAULT_SETTINGS: SiteSettings = {
  companyName: 'Golden Seal Life Sciences',
  companyTagline: 'Advanced biotech and chemical solutions for sustainable growth.',
  companyStory:
    'Golden Seal Life Sciences bridges molecular science and field-level application across aqua probiotics, agricultural micronutrients, and high-purity fine chemicals.',
  logoUrl: GOLDEN_SEAL_LOGO_URL,
  contactEmail: 'info@goldenseallifesciences.com',
  contactPhone: '+91-00000-00000',
  whatsappNumber: '+91-00000-00000',
  address: 'India'
};

export const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    heading: 'Molecular Science, Field-Ready Results',
    subheading:
      'High-performance aqua probiotics, agricultural micronutrients, and fine chemicals designed for yield, resilience, and ecological balance.',
    ctaPrimaryLabel: 'Explore Products',
    ctaPrimaryLink: '/products',
    ctaSecondaryLabel: 'Talk to Experts',
    ctaSecondaryLink: '/contact',
    backgroundImageUrl: ''
  },
  sections: [
    {
      id: 'aqua',
      title: 'Aqua Probiotics',
      summary: 'Boost aquatic health and growth with targeted microbial performance.',
      productIds: []
    },
    {
      id: 'agri',
      title: 'Agricultural Micronutrients',
      summary: 'Precision nutrition for crop vitality and predictable productivity.',
      productIds: []
    },
    {
      id: 'fine-chem',
      title: 'Fine Chemicals',
      summary: 'Reliable purity standards for industrial and laboratory-grade applications.',
      productIds: []
    }
  ],
  highlights: [
    'Research-led formulations',
    'Field-tested outcomes',
    'Sustainability-forward chemistry'
  ],
  announcement: {
    enabled: true,
    mode: 'text',
    separator: 'star',
    scrollSpeedSeconds: 28,
    slideshowIntervalMs: 4500,
    textItems: [
      {
        id: 'ann-text-1',
        text: 'Now accepting strategic distribution partnerships in high-growth aquaculture markets.'
      },
      {
        id: 'ann-text-2',
        text: 'New micronutrient optimization line launched for resilient yield under variable conditions.'
      }
    ],
    imageItems: []
  }
};
