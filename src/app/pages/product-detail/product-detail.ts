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

  private readonly listingService = inject(ListingService);
  private readonly users = inject(UserService);
  private readonly favourites = inject(FavouriteService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = this.listingService.loading;
  readonly conditionInfo = CONDITION_INFO;

  readonly listing = computed(() => this.listingService.byId(this.id()));
  readonly seller = computed(() => {
    const listing = this.listing();
    return listing ? this.users.byId(listing.sellerId) : undefined;
  });
  readonly rating = computed(() => {
    const seller = this.seller();
    return seller ? this.users.rating(seller.id) : { average: 0, count: 0 };
  });
  readonly sales = computed(() => {
    const seller = this.seller();
    return seller ? this.listingService.bySeller(seller.id).filter((l) => l.status === 'sold').length : 0;
  });
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
  readonly isOwner = computed(() => {
    const user = this.auth.user();
    const listing = this.listing();
    return !!user && !!listing && user.id === listing.sellerId;
  });
  readonly posted = computed(() => {
    const listing = this.listing();
    return listing ? timeAgo(listing.createdAt) : '';
  });

  readonly selectedPhoto = signal(0);
  readonly mainPhoto = computed(() => {
    const listing = this.listing();
    return listing?.photos[this.selectedPhoto()] ?? listing?.photos[0] ?? 'images/placeholder.svg';
  });
  readonly contactOpen = signal(false);
  readonly messageText = signal('');
  readonly sending = signal(false);

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

  initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  toggleFavourite(): void {
    const listing = this.listing();
    if (!listing) return;
    const result = this.favourites.toggle(listing.id);
    if (result === 'login-required') {
      this.goToLogin('Log in to save your favourites.');
      return;
    }
    this.toast.show(result === 'added' ? 'Added to your favourites' : 'Removed from your favourites');
  }

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

  private goToLogin(message: string): void {
    this.toast.show(message, 'info');
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}
