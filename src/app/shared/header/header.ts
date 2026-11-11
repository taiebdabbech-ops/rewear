import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CATEGORIES } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../icon/icon';

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
  readonly menuOpen = signal(false);
  readonly accountOpen = signal(false);
  /** Text shown in the search bar: it follows the ?q= of the current page. */
  readonly searchTerm = signal('');

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const q = this.router.parseUrl(event.urlAfterRedirects).queryParams['q'];
        this.searchTerm.set(typeof q === 'string' ? q : '');
      }
    });
  }

  readonly initials = computed(() => {
    const user = this.auth.user();
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  });

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

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

  closeMenus(): void {
    this.menuOpen.set(false);
    this.accountOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.closeMenus();
    this.toast.show('You are logged out. See you soon!', 'info');
    this.router.navigate(['/']);
  }
}
