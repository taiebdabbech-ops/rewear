import { Badge, Condition, Listing, SIZES } from './models';

export type SortOption = 'newest' | 'price-asc' | 'price-desc';

export interface ListingFilters {
  category?: string;
  query?: string;
  sizes: string[];
  conditions: Condition[];
  badges: Badge[];
  brand: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
}

export const EMPTY_FILTERS: ListingFilters = {
  sizes: [],
  conditions: [],
  badges: [],
  brand: '',
  minPrice: null,
  maxPrice: null,
  sort: 'newest',
};

/**
 * Pure function: returns the listings that match every filter, sorted.
 * Kept outside the component so it is easy to read and to test.
 */
export function filterListings(
  listings: Listing[],
  filters: ListingFilters,
  badgeOf: (sellerId: string) => Badge | undefined,
): Listing[] {
  const query = (filters.query ?? '').trim().toLowerCase();
  const brand = filters.brand.trim().toLowerCase();
  const category = (filters.category ?? '').toLowerCase();

  const result = listings.filter((l) => {
    if (category && l.category.toLowerCase() !== category) return false;
    if (query) {
      const text = `${l.title} ${l.brand} ${l.type} ${l.color} ${l.category}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    if (filters.sizes.length > 0 && !filters.sizes.includes(l.size)) return false;
    if (filters.conditions.length > 0 && !filters.conditions.includes(l.condition)) return false;
    if (brand && !l.brand.toLowerCase().includes(brand)) return false;
    if (filters.minPrice !== null && l.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && l.price > filters.maxPrice) return false;
    if (filters.badges.length > 0) {
      const badge = badgeOf(l.sellerId);
      if (!badge || !filters.badges.includes(badge)) return false;
    }
    return true;
  });

  return sortListings(result, filters.sort);
}

export function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  const copy = [...listings];
  if (sort === 'price-asc') return copy.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Sorts sizes in a natural order (XS, S, M… then shoe sizes, then kids sizes). */
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string): number => {
    const i = SIZES.indexOf(s);
    return i === -1 ? SIZES.length : i;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
