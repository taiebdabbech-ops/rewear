import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { FavouriteService } from '../../core/favourite.service';
import { timeAgo } from '../../core/image-utils';
import { ListingService } from '../../core/listing.service';
import { MessageService } from '../../core/message.service';
import { CONDITION_INFO, newId } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { UserService } from '../../core/user.service';
import { ConditionLabel } from '../../shared/condition-label/condition-label';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';
import { SellerBadge } from '../../shared/seller-badge/seller-badge';
import { StarRating } from '../../shared/star-rating/star-rating';

/**
 * Product page: photo gallery, price, condition, details, seller card, favourite,
 * "Contact seller" form and more items from the same seller.
 */
@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, DatePipe, ConditionLabel, SellerBadge, StarRating, ProductCard, Icon],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetail {
  /** Route parameter /product/:id. */
  readonly id = input.required<string>();
  /** Query parameter ?published=new, added by the Sell page right after a publication. */
  readonly published = input<string>();

  private readonly listingService = inject(ListingService);
  private readonly users = inject(UserService);
  private readonly favourites = inject(FavouriteService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = this.listingService.loading;
  readonly conditionInfo = CONDITION_INFO;

  /** The item of the address /product/:id (undefined while loading or if it was deleted). */
  readonly listing = computed(() => this.listingService.byId(this.id()));
  readonly seller = computed(() => {
    const listing = this.listing();
    return listing ? this.users.byId(listing.sellerId) : undefined;
  });
  /** Seller information for the seller card: mark, number of sales. */
  readonly rating = computed(() => {
    const seller = this.seller();
    return seller ? this.users.rating(seller.id) : { average: 0, count: 0 };
  });
  readonly sales = computed(() => {
    const seller = this.seller();
    return seller
      ? this.listingService.bySeller(seller.id).filter((l) => l.status === 'sold').length
      : 0;
  });
  /** Up to 4 other items for sale by the same seller. */
  readonly moreFromSeller = computed(() => {
    const listing = this.listing();
    if (!listing) return [];
    return this.listingService
      .active()
      .filter((l) => l.sellerId === listing.sellerId && l.id !== listing.id)
      .slice(0, 4);
  });
  readonly isFavourite = computed(() => {
    const listing = this.listing();
    return listing ? this.favourites.ids().has(listing.id) : false;
  });
  /** True when the logged-in member is the seller (the page then shows "This is your listing"). */
  readonly isOwner = computed(() => {
    const user = this.auth.user();
    const listing = this.listing();
    return !!user && !!listing && user.id === listing.sellerId;
  });
  /** Publish confirmation (sitemap: Sell › Publish confirmation), shown to the seller only. */
  readonly confirmationClosed = signal(false);
  readonly showConfirmation = computed(
    () => this.published() === 'new' && this.isOwner() && !this.confirmationClosed(),
  );
  /** "Posted 3 days ago". */
  readonly posted = computed(() => {
    const listing = this.listing();
    return listing ? timeAgo(listing.createdAt) : '';
  });

  /** Index of the photo shown in large; the thumbnails change it. */
  readonly selectedPhoto = signal(0);
  readonly mainPhoto = computed(() => {
    const listing = this.listing();
    return listing?.photos[this.selectedPhoto()] ?? listing?.photos[0] ?? 'images/placeholder.svg';
  });
  /** "Contact seller" form open or closed, and the text being typed. */
  readonly contactOpen = signal(false);
  readonly messageText = signal('');
  readonly sending = signal(false);

  /** Last item counted as a view (a view is counted once per item opened). */
  private viewedId: string | null = null;

  constructor() {
    // Count one view per product opened (the check on viewedId avoids an endless loop).
    effect(() => {
      const listing = this.listing();
      if (listing && this.viewedId !== listing.id) {
        this.viewedId = listing.id;
        untracked(() => {
          this.selectedPhoto.set(0);
          this.listingService.addView(listing);
        });
      }
    });
  }

  /** Letters of the seller avatar, e.g. "AM". */
  initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /** Heart button: same behaviour as on the product cards. */
  toggleFavourite(): void {
    const listing = this.listing();
    if (!listing) return;
    const result = this.favourites.toggle(listing.id);
    if (result === 'login-required') {
      this.goToLogin('Log in to save your favourites.');
      return;
    }
    this.toast.show(
      result === 'added' ? 'Added to your favourites' : 'Removed from your favourites',
    );
  }

  /** Visitors must log in before writing to a seller. */
  openContact(): void {
    if (!this.auth.isLoggedIn()) {
      this.goToLogin('Log in to contact the seller.');
      return;
    }
    this.contactOpen.set(true);
  }

  onMessage(event: Event): void {
    this.messageText.set((event.target as HTMLTextAreaElement).value);
  }

  /** Sends the message (at least 5 characters) with POST /messages (simulation). */
  sendMessage(): void {
    const listing = this.listing();
    const user = this.auth.user();
    const text = this.messageText().trim();
    if (!listing || !user || text.length < 5) return;

    this.sending.set(true);
    this.messages
      .send({
        id: newId(),
        listingId: listing.id,
        sellerId: listing.sellerId,
        fromUserId: user.id,
        text,
        date: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.contactOpen.set(false);
          this.messageText.set('');
          this.toast.show('Message sent to the seller (simulation).');
        },
        error: () => {
          this.sending.set(false);
          this.toast.show('The message could not be sent. Is the API running?', 'error');
        },
      });
  }

  /** Toast + Log in page, then back to this product after log-in (returnUrl). */
  private goToLogin(message: string): void {
    this.toast.show(message, 'info');
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}
