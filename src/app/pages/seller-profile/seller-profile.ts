import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ListingService } from '../../core/listing.service';
import { newId } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { UserService } from '../../core/user.service';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';
import { SellerBadge } from '../../shared/seller-badge/seller-badge';
import { StarRating } from '../../shared/star-rating/star-rating';

/** The two tabs of the public profile. */
type SellerTab = 'listings' | 'reviews';

/**
 * Public profile of a seller: badge, mark, number of sales, items for sale and reviews.
 * Logged-in members can leave a review (POST /reviews).
 */
@Component({
  selector: 'app-seller-profile',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, ProductCard, SellerBadge, StarRating, Icon],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProfile {
  /** Route parameter /seller/:id. */
  readonly id = input.required<string>();

  private readonly users = inject(UserService);
  private readonly listingService = inject(ListingService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly tab = signal<SellerTab>('listings');
  readonly ratingOptions = [5, 4, 3, 2, 1];
  readonly submitting = signal(false);

  readonly seller = computed(() => this.users.byId(this.id()));
  /** Items this seller has for sale now. */
  readonly listings = computed(() =>
    this.listingService.active().filter((l) => l.sellerId === this.id()),
  );
  readonly sales = computed(
    () => this.listingService.bySeller(this.id()).filter((l) => l.status === 'sold').length,
  );
  readonly reviews = computed(() => this.users.reviewsFor(this.id()));
  readonly rating = computed(() => this.users.rating(this.id()));

  /** Share of reviews for each number of stars (5 to 1). */
  readonly breakdown = computed(() => {
    const reviews = this.reviews();
    return this.ratingOptions.map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      return {
        stars,
        count,
        percent: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
      };
    });
  });

  /** A logged-in user can review any seller except himself. */
  readonly canReview = computed(() => {
    const user = this.auth.user();
    return !!user && user.id !== this.id();
  });

  /** Review form: mark from 1 to 5 and a comment of 10 to 300 characters. */
  readonly reviewForm = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
  });

  /** Letters of the seller avatar. */
  initials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /** Publishes the review, then empties the form. */
  submitReview(): void {
    const user = this.auth.user();
    if (!user) return;
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    const { rating, comment } = this.reviewForm.getRawValue();
    this.submitting.set(true);
    this.users
      .addReview({
        id: newId(),
        sellerId: this.id(),
        authorName: `${user.firstName} ${user.lastName.charAt(0)}.`,
        rating: Number(rating),
        comment: comment.trim(),
        date: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.toast.show('Thank you! Your review is published.');
        },
        error: () => {
          this.submitting.set(false);
          this.toast.show('The review could not be saved.', 'error');
        },
      });
  }
}
