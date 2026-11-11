import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ListingService } from '../../core/listing.service';
import { Category } from '../../core/models';
import { UserService } from '../../core/user.service';
import { Icon } from '../../shared/icon/icon';
import { ProductCard } from '../../shared/product-card/product-card';

interface CategoryTile {
  name: Category;
  image: string;
  text: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, Icon],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly listingService = inject(ListingService);
  private readonly users = inject(UserService);

  readonly loading = this.listingService.loading;
  readonly error = this.listingService.error;
  readonly soldCount = this.listingService.soldCount;
  readonly placeholders = [1, 2, 3, 4];

  readonly recent = computed(() => this.listingService.active().slice(0, 8));
  readonly trusted = computed(() =>
    this.listingService
      .active()
      .filter((l) => this.users.byId(l.sellerId)?.badge === 'Trusted')
      .slice(0, 4),
  );
  readonly activeCount = computed(() => this.listingService.active().length);

  readonly tiles: CategoryTile[] = [
    { name: 'Women', image: 'images/dress-burgundy.svg', text: 'Dresses, coats, skirts' },
    { name: 'Men', image: 'images/jacket-blue.svg', text: 'Jackets, jeans, sneakers' },
    { name: 'Kids', image: 'images/tshirt-yellow.svg', text: 'They grow fast, save more' },
    { name: 'Vintage', image: 'images/jacket-brown.svg', text: 'Unique pieces with history' },
    { name: 'Streetwear', image: 'images/hoodie-black.svg', text: 'Hoodies, cargos, sneakers' },
  ];

  retry(): void {
    this.listingService.load();
    this.users.load();
  }
}
