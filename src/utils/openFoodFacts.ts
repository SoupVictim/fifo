import { FoodCategory } from '../types/fifo';

export interface BarcodeProductInfo {
  barcode: string;
  name: string;
  brand?: string;
  category: FoodCategory;
  imageUrl?: string;
}

function inferCategoryFromTags(tags: string[], name: string): FoodCategory {
  const combined = [...tags, name].join(' ').toLowerCase();
  if (/(frozen|ice-cream|freezer)/.test(combined)) return 'Frozen';
  if (/(meat|poultry|chicken|beef|pork|salmon|fish|seafood|lamb|mince|fillet)/.test(combined)) {
    return 'Raw';
  }
  if (/(dairy|milk|yogurt|yoghurt|cheese|butter|cream|kefir)/.test(combined)) {
    return 'Dairy';
  }
  if (/(vegetable|fruit|salad|spinach|berries|herbs|produce|fresh-vegetables)/.test(combined)) {
    return 'Fresh';
  }
  if (/(chilled|eggs|hummus|deli|juice|ready-meals)/.test(combined)) {
    return 'Fridge';
  }
  return 'Fridge';
}

export async function lookupBarcodeOpenFoodFacts(
  barcode: string
): Promise<BarcodeProductInfo | null> {
  const cleanCode = barcode.replace(/[^0-9]/g, '');
  if (!cleanCode || cleanCode.length < 8) return null;

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${cleanCode}.json?fields=product_name,brands,categories_tags,image_front_small_url`,
      {
        headers: {
          'User-Agent': 'FifoExpiryApp/1.0 (Mobile Food Tracker)',
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    if (data?.status !== 1 || !data?.product) return null;

    const p = data.product;
    const rawName = (p.product_name || '').trim();
    const brand = (p.brands || '').split(',')[0]?.trim();
    if (!rawName && !brand) return null;

    const name = rawName || `${brand} Item`;
    const tags: string[] = Array.isArray(p.categories_tags) ? p.categories_tags : [];
    const category = inferCategoryFromTags(tags, name);

    return {
      barcode: cleanCode,
      name,
      brand: brand || undefined,
      category,
      imageUrl: p.image_front_small_url || undefined,
    };
  } catch {
    return null;
  }
}
