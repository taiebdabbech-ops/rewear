import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { API_URL } from './api';
import { newId, PublicUser, toPublicUser, User } from './models';
import { UserService } from './user.service';

const STORAGE_KEY = 'rewear.currentUser';

export type SignupData = Omit<User, 'id' | 'badge' | 'memberSince'>;

/**
 * Simulated authentication (as announced in our sitemap): accounts are stored by json-server
 * and the logged-in user is kept in localStorage. Not secure, for demonstration only.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);

  private readonly _user = signal<PublicUser | null>(this.restore());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  login(email: string, password: string): Observable<boolean> {
    const params = new HttpParams().set('email', email.trim().toLowerCase());
    return this.http.get<User[]>(`${API_URL}/users`, { params }).pipe(
      map((found) => found.find((u) => u.password === password) ?? null),
      tap((user) => {
        if (user) this.setUser(user);
      }),
      map((user) => user !== null),
    );
  }

  signup(data: SignupData): Observable<'ok' | 'email-taken'> {
    const email = data.email.trim().toLowerCase();
    const params = new HttpParams().set('email', email);
    return this.http.get<User[]>(`${API_URL}/users`, { params }).pipe(
      switchMap((existing) => {
        if (existing.length > 0) return of('email-taken' as const);
        const user: User = {
          ...data,
          email,
          id: newId(),
          badge: 'Basic',
          memberSince: new Date().toISOString().slice(0, 7),
        };
        return this.http.post<User>(`${API_URL}/users`, user).pipe(
          tap((created) => {
            this.users.addLocal(created);
            this.setUser(created);
          }),
          map(() => 'ok' as const),
        );
      }),
    );
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private setUser(user: User): void {
    const publicUser = toPublicUser(user);
    this._user.set(publicUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(publicUser));
  }

  private restore(): PublicUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PublicUser) : null;
    } catch {
      return null;
    }
  }
}
