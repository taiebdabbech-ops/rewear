import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { FavouriteService } from '../../core/favourite.service';
import { ListingService } from '../../core/listing.service';
import { BADGE_INFO, Listing, ListingStatus } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { UserService } from '../../core/user.service';
import { ConditionLabel } from '../../shared/condition-label/condition-label';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';
import { SellerBadge } from '../../shared/seller-badge/seller-badge';
import { StarRating } from '../../shared/star-rating/star-rating';
import { AccountMessages } from './account-messages/account-messages';
import { ProfileSettings } from './profile-settings/profile-settings';

type AccountTab = 'listings' | 'favourites' | 'messages' | 'reputation' | 'profile';

@Component({
  selector: 'app-account',
  imports: [RouterLink, ProductCard, ConditionLabel, SellerBadge, StarRating, Icon, AccountMessages, ProfileSettings],
  templateUrl: './account.html',
  styleUrl: './account.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account {
  /** Query parameter ?tab=… (from the header menu). */
  readonly tab = input<string>();

  readonly auth = inject(AuthService);
  private readonly listingService = inject(ListingService);
  private readonly favourites = inject(FavouriteService);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly tabs: { id: AccountTab; label: string }[] = [
    { id: 'listings', label: 'My listings' },
    { id: 'favourites', label: 'My favourites' },
    { id: 'messages', label: 'My messages' },
    { id: 'reputation', label: 'My reputation' },
    { id: 'profile', label: 'Profile' },
  ];
  readonly statuses: { id: ListingStatus; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'sold', label: 'Sold' },
    { id: 'draft', label: 'Drafts' },
  ];
  readonly badgeInfo = BADGE_INFO;

  readonly status = signal<ListingStatus>('active');
  readonly pendingDelete = signal<string | null>(null);

  readonly currentTab = computed<AccountTab>(() => {
    const t = this.tab();
    return this.tabs.some((x) => x.id === t) ? (t as AccountTab) : 'listings';
  });

  readonly myListings = computed(() => {
    const user = this.auth.user();
    return user ? this.listingService.bySeller(user.id) : [];
  });
  readonly filteredListings = computed(() =>
    this.myListings()
      .filter((l) => l.status === this.status())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  readonly favouriteListings = computed(() => {
    const ids = this.favourites.ids();
    return this.listingService.listings().filter((l) => ids.has(l.id));
  });
  readonly rating = computed(() => {
    const user = this.auth.user();
    return user ? this.users.rating(user.id) : { average: 0, count: 0 };
  });
  readonly reviews = computed(() => {
    const user = this.auth.user();
    return user ? this.users.reviewsFor(user.id) : [];
  });
  readonly totalViews = computed(() => this.myListings().reduce((sum, l) => sum + l.views, 0));
  readonly soldCount = computed(() => this.myListings().filter((l) => l.status === 'sold').length);

  countFor(status: ListingStatus): number {
    return this.myListings().filter((l) => l.status === status).length;
  }

  selectTab(tab: AccountTab): void {
    this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge' });
  }

  setStatus(listing: Listing, status: ListingStatus): void {
    this.listingService.update(listing.id, { status }).subscribe({
      next: () => {
        const messages: Record<ListingStatus, string> = {
          sold: 'Marked as sold. Congratulations!',
          active: 'Your item is online again.',
          draft: 'Moved to drafts.',
        };
        this.toast.show(messages[status]);
      },
      error: () => this.toast.show('The change could not be saved.', 'error'),
    });
  }

  confirmDelete(listing: Listing): void {
    this.listingService.remove(listing.id).subscribe({
      next: () => {
        this.pendingDelete.set(null);
        this.toast.show('Listing deleted.', 'info');
      },
      error: () => this.toast.show('The listing could not be deleted.', 'error'),
    });
  }

  logout(): void {
    this.auth.logout();
    this.toast.show('You are logged out.', 'info');
    this.router.navigate(['/']);
  }
}
