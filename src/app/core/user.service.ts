import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api';
import { Review, User } from './models';

export interface Rating {
  average: number;
  count: number;
}

/** Users (sellers) and the reviews they received. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly _users = signal<User[]>([]);
  private readonly _reviews = signal<Review[]>([]);

  readonly users = this._users.asReadonly();
  readonly reviews = this._reviews.asReadonly();

  load(): void {
    this.http.get<User[]>(`${API_URL}/users`).subscribe({
      next: (users) => this._users.set(users),
      error: () => undefined,
    });
    this.http.get<Review[]>(`${API_URL}/reviews`).subscribe({
      next: (reviews) => this._reviews.set(reviews),
      error: () => undefined,
    });
  }

  byId(id: string): User | undefined {
    return this._users().find((u) => u.id === id);
  }

  reviewsFor(sellerId: string): Review[] {
    return this._reviews()
      .filter((r) => r.sellerId === sellerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  rating(sellerId: string): Rating {
    const list = this.reviewsFor(sellerId);
    const count = list.length;
    const average = count === 0 ? 0 : list.reduce((sum, r) => sum + r.rating, 0) / count;
    return { average: Math.round(average * 10) / 10, count };
  }

  /** Adds a user created at sign-up to the local list. */
  addLocal(user: User): void {
    this._users.update((list) => [...list, user]);
  }

  /** Replaces a user in the local list after a profile update. */
  replaceLocal(user: User): void {
    this._users.update((list) => list.map((u) => (u.id === user.id ? user : u)));
  }

  addReview(review: Review): Observable<Review> {
    return this.http
      .post<Review>(`${API_URL}/reviews`, review)
      .pipe(tap((created) => this._reviews.update((list) => [created, ...list])));
  }
}
