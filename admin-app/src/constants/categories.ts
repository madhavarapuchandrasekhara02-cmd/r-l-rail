export type RitualCategorySlug = 'hair-rituals' | 'face-rituals' | 'wellness-rituals' | 'baby-rituals';

export interface CategoryConfig {
  id: string;
  label: string;
  slug: RitualCategorySlug;
  description: string;
  skuPrefix: string;
}

export const CATEGORY_CONFIG: Record<RitualCategorySlug, CategoryConfig> = {
  'hair-rituals': {
    id: 'hair-rituals',
    label: 'Hair Rituals',
    slug: 'hair-rituals',
    description: 'Luxury botanical rituals for healthy, beautiful hair',
    skuPrefix: 'HAIR',
  },
  'face-rituals': {
    id: 'face-rituals',
    label: 'Face Rituals',
    slug: 'face-rituals',
    description: 'Glow through timeless Ayurvedic care',
    skuPrefix: 'FACE',
  },
  'wellness-rituals': {
    id: 'wellness-rituals',
    label: 'Wellness Rituals',
    slug: 'wellness-rituals',
    description: 'Ancient nourishment for modern living',
    skuPrefix: 'WELL',
  },
  'baby-rituals': {
    id: 'baby-rituals',
    label: 'Baby Rituals',
    slug: 'baby-rituals',
    description: 'Gentle Ayurvedic care for delicate beginnings',
    skuPrefix: 'BABY',
  },
};

export const CATEGORY_LIST = Object.values(CATEGORY_CONFIG);
