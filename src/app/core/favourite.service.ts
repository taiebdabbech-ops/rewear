import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { API_URL } from './api';
import { AuthService } from './auth.service';
import { Favourite, newId } from './models';

export type FavouriteResult = 'added' | 'removed' | 'login-required';

@Injectable({ providedIn: 'root' })
export class FavouriteService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly _favourites = signal<Favourite[]>([]);

  /** Ids of the listings saved by the current user. */
  readonly ids = computed(() => new Set(this._favourites().map((f) => f.listingId)));

  constructor() {
    // Reload the favourites every time the logged-in user changes.
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        this._favourites.set([]);
        return;
      }
      const params = new HttpParams().set('userId', user.id);
      this.http.get<Favourite[]>(`${API_URL}/favourites`, { params }).subscribe({
        next: (list) => this._favourites.set(list),
        error: () => undefined,
      });
    });
  }

  /** Optimistic update: the heart changes at once, and is restored if the API call fails. */
  toggle(listingId: string): FavouriteResult {
    const user = this.auth.user();
    if (!user) return 'login-required';

    const existing = this._favourites().find((f) => f.listingId === listingId);
    if (existing) {
      this._favourites.update((list) => list.filter((f) => f.id !== existing.id));
      this.http.delete(`${API_URL}/favourites/${existing.id}`).subscribe({
        error: () => this._favourites.update((list) => [...list, existing]),
      });
      return 'removed';
    }

    const favourite: Favourite = { id: newId(), userId: user.id, listingId };
    this._favourites.update((list) => [...list, favourite]);
    this.http.post<Favourite>(`${API_URL}/favourites`, favourite).subscribe({
      error: () => this._favourites.update((list) => list.filter((f) => f.id !== favourite.id)),
    });
    return 'added';
  }
}
