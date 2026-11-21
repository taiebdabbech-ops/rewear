import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CATEGORIES } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../icon/icon';

/**
 * Site header: logo, search bar, favourites, account menu and "Sell" button,
 * plus the category bar. On phones the categories open from the menu button.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly categories = CATEGORIES;
  /** Phone menu (categories) open or closed. */
  readonly menuOpen = signal(false);
  /** Account drop-down menu (My listings, My messages, Log out…) open or closed. */
  readonly accountOpen = signal(false);
  /** Text shown in the search bar: it follows the ?q= of the current page. */
  readonly searchTerm = signal('');

  // Keep the search bar in step with the address: /shop?q=jeans shows "jeans".
  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const q = this.router.parseUrl(event.urlAfterRedirects).queryParams['q'];
        this.searchTerm.set(typeof q === 'string' ? q : '');
      }
    });
  }

  /** Letters shown in the round avatar, e.g. "SB" for Sarra Ben Ali. */
  readonly initials = computed(() => {
    const user = this.auth.user();
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  /** Search form: opens the shop with ?q=… (or the whole shop if the text is empty). */
  search(event: Event): void {
    event.preventDefault();
    const q = this.searchTerm().trim();
    this.closeMenus();
    this.router.navigate(['/shop'], { queryParams: q ? { q } : {} });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    this.accountOpen.set(false);
  }

  toggleAccount(): void {
    this.accountOpen.update((open) => !open);
  }

  /** Closes both menus (after a click on a link or a search). */
  closeMenus(): void {
    this.menuOpen.set(false);
    this.accountOpen.set(false);
  }

  /** Logs out, then goes back to the home page with a toast. */
  logout(): void {
    this.auth.logout();
    this.closeMenus();
    this.toast.show('You are logged out. See you soon!', 'info');
    this.router.navigate(['/']);
  }
}
