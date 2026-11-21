import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FavouriteService } from '../../core/favourite.service';
import { Listing } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { UserService } from '../../core/user.service';
import { ConditionLabel } from '../condition-label/condition-label';
import { Icon } from '../icon/icon';
import { SellerBadge } from '../seller-badge/seller-badge';

/** Card used on every listing grid: photo, name, price, size, condition and seller badge. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, ConditionLabel, SellerBadge, Icon],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCard {
  readonly listing = input.required<Listing>();

  private readonly users = inject(UserService);
  private readonly favourites = inject(FavouriteService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Seller of the item (for the badge), read from the users already loaded. */
  readonly seller = computed(() => this.users.byId(this.listing().sellerId));
  readonly isFavourite = computed(() => this.favourites.ids().has(this.listing().id));
  /** First photo, or a neutral drawing when the item has none. */
  readonly photo = computed(() => this.listing().photos[0] ?? 'images/placeholder.svg');

  /**
   * Click on the heart. The card is a link, so the click must not open the product page.
   * Visitors are sent to Log in; members see a toast "Added / Removed".
   */
  toggleFavourite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const result = this.favourites.toggle(this.listing().id);
    if (result === 'login-required') {
      this.toast.show('Log in to save your favourites.', 'info');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.toast.show(
      result === 'added' ? 'Added to your favourites' : 'Removed from your favourites',
    );
  }
}
