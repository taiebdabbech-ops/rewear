import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api';
import { Listing } from './models';

/**
 * Single source of truth for listings.
 * Components read the signals; every change goes through the REST API first.
 */
@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/listings`;

  private readonly _listings = signal<Listing[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly listings = this._listings.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  /** Published listings, newest first. */
  readonly active = computed(() =>
    this._listings()
      .filter((l) => l.status === 'active')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  /** Number of items sold on REWEAR (shown as the impact counter). */
  readonly soldCount = computed(() => this._listings().filter((l) => l.status === 'sold').length);

  /** GET /listings once at start-up; loading and error drive the skeletons and alerts. */
  load(): void {
    this._loading.set(true);
    this._error.set(null);
    this.http.get<Listing[]>(this.url).subscribe({
      next: (data) => {
        this._listings.set(data);
        this._loading.set(false);
      },
      error: () => {
        this._error.set(
          'Cannot reach the REWEAR API. Start it with: npx json-server --watch db.json --port 3000',
        );
        this._loading.set(false);
      },
    });
  }

  /** Finds a listing in the list already loaded. */
  byId(id: string): Listing | undefined {
    return this._listings().find((l) => l.id === id);
  }

  /** All the listings of one seller (active, sold and drafts). */
  bySeller(sellerId: string): Listing[] {
    return this._listings().filter((l) => l.sellerId === sellerId);
  }

  /** POST /listings, then adds the new item at the top of the local list. */
  create(listing: Listing): Observable<Listing> {
    return this.http
      .post<Listing>(this.url, listing)
      .pipe(tap((created) => this._listings.update((list) => [created, ...list])));
  }

  /** PATCH /listings/:id (edit, mark as sold, views), then updates the local copy. */
  update(id: string, changes: Partial<Listing>): Observable<Listing> {
    return this.http
      .patch<Listing>(`${this.url}/${id}`, changes)
      .pipe(
        tap((updated) =>
          this._listings.update((list) => list.map((l) => (l.id === id ? updated : l))),
        ),
      );
  }

  /** DELETE /listings/:id, then removes it from the local list. */
  remove(id: string): Observable<unknown> {
    return this.http
      .delete(`${this.url}/${id}`)
      .pipe(tap(() => this._listings.update((list) => list.filter((l) => l.id !== id))));
  }

  /** Counts a visit on a product page. Errors are ignored: it is only a statistic. */
  addView(listing: Listing): void {
    this.update(listing.id, { views: listing.views + 1 }).subscribe({ error: () => undefined });
  }
}
