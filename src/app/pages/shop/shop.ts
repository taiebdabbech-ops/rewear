import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  WritableSignal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EMPTY_FILTERS, filterListings, SortOption, sortSizes } from '../../core/listing-filter';
import { ListingService } from '../../core/listing.service';
import { Badge, CATEGORIES, Condition, CONDITIONS } from '../../core/models';
import { UserService } from '../../core/user.service';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';

/** A small "chip" above the results that shows an active filter; its × removes it. */
interface FilterChip {
  key: string;
  label: string;
  remove: () => void;
}

/**
 * Shop page (/shop, /shop/:category, /shop?q=…): side filters, sort, chips and pagination.
 * Everything is computed from signals, so the results change as soon as a filter changes.
 */
@Component({
  selector: 'app-shop',
  imports: [RouterLink, RouterLinkActive, ProductCard, Icon],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The Escape key closes the filter sheet on phones.
  host: { '(document:keydown.escape)': 'filtersOpen.set(false)' },
})
export class Shop {
  /** Route parameter /shop/:category (bound automatically by the router). */
  readonly category = input<string>();
  /** Query parameter ?q= coming from the search bar. */
  readonly q = input<string>();

  private readonly listingService = inject(ListingService);
  private readonly users = inject(UserService);
  private readonly router = inject(Router);

  readonly categories = CATEGORIES;
  readonly conditions = CONDITIONS;
  readonly badgeOptions: Badge[] = ['Verified', 'Trusted'];
  readonly loading = this.listingService.loading;
  readonly error = this.listingService.error;
  readonly pageSize = 12;
  /** Number of grey cards shown while the items are loading. */
  readonly placeholders = [1, 2, 3, 4, 5, 6];

  // ----- filter state (signals) -----
  readonly selectedSizes = signal<string[]>([]);
  readonly selectedConditions = signal<Condition[]>([]);
  readonly selectedBadges = signal<Badge[]>([]);
  readonly brand = signal('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly sort = signal<SortOption>('newest');
  readonly page = signal(1);
  /** Phone only: the filter panel slides up from the bottom of the screen. */
  readonly filtersOpen = signal(false);

  /** Page title: the category name, or "All items". */
  readonly title = computed(() => {
    const c = (this.category() ?? '').toLowerCase();
    return this.categories.find((name) => name.toLowerCase() === c) ?? 'All items';
  });

  /** Listings of the current category and search, before the side filters. */
  private readonly base = computed(() =>
    filterListings(
      this.listingService.active(),
      { ...EMPTY_FILTERS, category: this.category(), query: this.q() },
      () => undefined,
    ),
  );

  /** Sizes that really exist in the current category. */
  readonly availableSizes = computed(() => sortSizes([...new Set(this.base().map((l) => l.size))]));

  /** Items that match every filter, sorted (see core/listing-filter.ts). */
  readonly results = computed(() =>
    filterListings(
      this.listingService.active(),
      {
        category: this.category(),
        query: this.q(),
        sizes: this.selectedSizes(),
        conditions: this.selectedConditions(),
        badges: this.selectedBadges(),
        brand: this.brand(),
        minPrice: this.minPrice(),
        maxPrice: this.maxPrice(),
        sort: this.sort(),
      },
      (sellerId) => this.users.byId(sellerId)?.badge,
    ),
  );

  /** Pagination: 12 items per page. */
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.results().length / this.pageSize)),
  );
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  readonly pageItems = computed(() => {
    const start = (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize;
    return this.results().slice(start, start + this.pageSize);
  });

  /** One chip per active filter. */
  readonly chips = computed<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    for (const size of this.selectedSizes()) {
      chips.push({ key: `s-${size}`, label: `Size ${size}`, remove: () => this.toggleSize(size) });
    }
    for (const condition of this.selectedConditions()) {
      chips.push({
        key: `c-${condition}`,
        label: condition,
        remove: () => this.toggleCondition(condition),
      });
    }
    for (const badge of this.selectedBadges()) {
      chips.push({
        key: `b-${badge}`,
        label: `${badge} sellers`,
        remove: () => this.toggleBadge(badge),
      });
    }
    if (this.brand().trim()) {
      chips.push({
        key: 'brand',
        label: `Brand: ${this.brand().trim()}`,
        remove: () => this.brand.set(''),
      });
    }
    const min = this.minPrice();
    const max = this.maxPrice();
    if (min !== null || max !== null) {
      chips.push({
        key: 'price',
        label: `${min ?? 0} – ${max ?? '∞'} TND`,
        remove: () => {
          this.minPrice.set(null);
          this.maxPrice.set(null);
        },
      });
    }
    return chips;
  });

  constructor() {
    // Back to page 1 whenever the category or the search changes.
    effect(() => {
      this.category();
      this.q();
      untracked(() => this.page.set(1));
    });
  }

  /** Adds or removes a filter value (sizes, conditions, badges). */
  toggleSize(size: string): void {
    this.toggleIn(this.selectedSizes, size);
  }

  toggleCondition(condition: Condition): void {
    this.toggleIn(this.selectedConditions, condition);
  }

  toggleBadge(badge: Badge): void {
    this.toggleIn(this.selectedBadges, badge);
  }

  /** Brand and price fields: every change goes back to page 1. */
  onBrand(event: Event): void {
    this.brand.set((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  onMinPrice(event: Event): void {
    this.minPrice.set(this.readNumber(event));
    this.page.set(1);
  }

  onMaxPrice(event: Event): void {
    this.maxPrice.set(this.readNumber(event));
    this.page.set(1);
  }

  /** Sort list: newest first, or by price. */
  onSort(event: Event): void {
    this.sort.set((event.target as HTMLSelectElement).value as SortOption);
  }

  /** "Reset filters": removes every side filter (not the category or the search). */
  clearFilters(): void {
    this.selectedSizes.set([]);
    this.selectedConditions.set([]);
    this.selectedBadges.set([]);
    this.brand.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.page.set(1);
  }

  /** Removes ?q= from the address, which empties the search. */
  clearSearch(): void {
    this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge' });
  }

  /** Pagination button: shows another page and scrolls back to the top. */
  goToPage(page: number): void {
    this.page.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Generic helper: adds the value to the list if missing, removes it otherwise. */
  private toggleIn<T>(target: WritableSignal<T[]>, value: T): void {
    target.update((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
    this.page.set(1);
  }

  /** Reads a price field: an empty field means "no limit" (null). */
  private readNumber(event: Event): number | null {
    const value = (event.target as HTMLInputElement).value;
    return value === '' ? null : Number(value);
  }
}
