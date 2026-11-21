import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Icon } from '../icon/icon';

type NavItem = 'home' | 'shop' | 'sell' | 'favourites' | 'account';

/**
 * Bottom navigation bar for phones (< 600 px), as drawn in the Objective 2 mobile prototype:
 * Home, Shop, Sell, Favourites and Account stay under the thumb. Hidden on larger screens.
 */
@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, Icon],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNav {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  private readonly url = signal('/');

  /** Which tab is highlighted, worked out from the current address. */
  readonly active = computed<NavItem | null>(() => {
    const tree = this.router.parseUrl(this.url());
    const path = this.url().split(/[?#]/)[0];
    if (path === '/' || path === '') return 'home';
    if (path.startsWith('/shop') || path.startsWith('/product') || path.startsWith('/seller')) return 'shop';
    if (path.startsWith('/sell')) return 'sell';
    if (path.startsWith('/account')) return tree.queryParams['tab'] === 'favourites' ? 'favourites' : 'account';
    if (path.startsWith('/login') || path.startsWith('/forgot-password')) return 'account';
    return null;
  });

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.url.set(event.urlAfterRedirects);
      }
    });
  }
}
