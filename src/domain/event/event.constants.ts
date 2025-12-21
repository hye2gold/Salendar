import { Category, EventType } from './event.types';

export const CATEGORY_LIST = [
  Category.ALL,
  Category.BEAUTY,
  Category.FASHION,
  Category.FOOD,
  Category.ACCOMMODATION,
  Category.CULTURE,
  Category.OTHER,
];

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.ALL]: 'bg-gray-800 text-white',
  [Category.BEAUTY]: 'bg-pink-100 text-pink-600 border border-pink-200',
  [Category.FASHION]: 'bg-indigo-100 text-indigo-600 border border-indigo-200',
  [Category.FOOD]: 'bg-orange-100 text-orange-600 border border-orange-200',
  [Category.ACCOMMODATION]: 'bg-teal-100 text-teal-600 border border-teal-200',
  [Category.CULTURE]: 'bg-purple-100 text-purple-600 border border-purple-200',
  [Category.OTHER]: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export const TYPE_BADGE_COLORS: Record<EventType, string> = {
  // Slightly darker tones so white text is readable
  [EventType.DISCOUNT]: '#E06A6A',
  [EventType.GIFT]: '#C7C500',
  [EventType.REWARD]: '#6FAF3C',
  [EventType.TIMEDEAL]: '#5C7BD6',
  [EventType.EXCLUSIVE]: '#A06AD1',
};

// Helper to get logo URL (use Supabase value if provided)
export const getBrandLogo = (brandName: string, brandLogos?: Record<string, string>) => {
  if (brandLogos && brandLogos[brandName]) {
    return brandLogos[brandName];
  }
  const seed = encodeURIComponent(brandName);
  return `https://ui-avatars.com/api/?name=${seed}&background=random&color=fff&size=128&bold=true&font-size=0.4`;
};
