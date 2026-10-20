import { CategoryMeta, FoodCategory } from '../types/fifo';

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'Fresh',
    label: 'Fresh',
    emoji: '🥬',
    accentColor: '#10B981',
    softBg: '#ECFDF5',
    borderColor: '#A7F3D0',
    description: 'Fruit, veg, herbs & salad leaves',
  },
  {
    id: 'Fridge',
    label: 'Fridge',
    emoji: '🧀',
    accentColor: '#0D9488',
    softBg: '#F0FDFA',
    borderColor: '#99F6E4',
    description: 'Chilled meals, deli, eggs & dips',
  },
  {
    id: 'Dairy',
    label: 'Dairy',
    emoji: '🥛',
    accentColor: '#0284C7',
    softBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    description: 'Milk, yogurt, cream, butter & cheese',
  },
  {
    id: 'Raw',
    label: 'Raw',
    emoji: '🥩',
    accentColor: '#E11D48',
    softBg: '#FFF1F2',
    borderColor: '#FECDD3',
    description: 'Uncooked meat, poultry & seafood',
  },
  {
    id: 'Frozen',
    label: 'Frozen',
    emoji: '❄️',
    accentColor: '#2563EB',
    softBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    description: 'Freezer drawer & batch-cooked items',
  },
  {
    id: 'Pantry',
    label: 'Pantry',
    emoji: '🥫',
    accentColor: '#D97706',
    softBg: '#FFFBEB',
    borderColor: '#FDE68A',
    description: 'Dry goods, jars, bread & condiments',
  },
];

export const CATEGORY_MAP: Record<FoodCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<FoodCategory, CategoryMeta>
);

export function getCategoryMeta(category: FoodCategory): CategoryMeta {
  return CATEGORY_MAP[category] ?? CATEGORIES[0];
}
