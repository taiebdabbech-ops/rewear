import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { API_URL } from './api';
import { newId, PublicUser, toPublicUser, User } from './models';
import { UserService } from './user.service';

/** Key of the logged-in user in localStorage (keeps the session after a page reload). */
const STORAGE_KEY = 'rewear.currentUser';

/** Fields typed in the sign-up form (the id, badge and date are added by the service). */
export type SignupData = Omit<User, 'id' | 'badge' | 'memberSince'>;

/** Profile fields a member may change himself (e-mail, badge and dates stay fixed). */
export type ProfileChanges = Pick<User, 'firstName' | 'lastName' | 'phone' | 'city'>;

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

  /**
   * GET /users?email=… then compares the password (simulation).
   * Emits true if the e-mail and password match, false otherwise.
   */
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

  /**
   * Creates an account: refuses an e-mail already used, otherwise POST /users
   * with the badge 'Basic', then logs the new member in.
   */
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

  /** Saves the profile (PATCH /users/:id) and refreshes the logged-in user everywhere. */
  updateProfile(changes: ProfileChanges): Observable<PublicUser> {
    const current = this._user();
    if (!current) return throwError(() => new Error('Not logged in'));
    return this.http.patch<User>(`${API_URL}/users/${current.id}`, changes).pipe(
      tap((updated) => {
        this.users.replaceLocal(updated);
        this.setUser(updated);
      }),
      map((updated) => toPublicUser(updated)),
    );
  }

  /**
   * Simulated password change: reads the account, checks the current password,
   * then saves the new one. A real back-end would do this check on the server.
   */
  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Observable<'ok' | 'wrong-password'> {
    const current = this._user();
    if (!current) return throwError(() => new Error('Not logged in'));
    const url = `${API_URL}/users/${current.id}`;
    return this.http
      .get<User>(url)
      .pipe(
        switchMap((user) =>
          user.password !== currentPassword
            ? of('wrong-password' as const)
            : this.http.patch<User>(url, { password: newPassword }).pipe(map(() => 'ok' as const)),
        ),
      );
  }

  /** Forgets the logged-in user (signal and localStorage). */
  logout(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Keeps the user without his password, in the signal and in localStorage. */
  private setUser(user: User): void {
    const publicUser = toPublicUser(user);
    this._user.set(publicUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(publicUser));
  }

  /** Reads the user saved by a previous visit (null if none or if the data is broken). */
  private restore(): PublicUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PublicUser) : null;
    } catch {
      return null;
    }
  }
}
