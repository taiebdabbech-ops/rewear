import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { API_URL } from './api';
import { Message } from './models';

/** Messages received and sent by one user, newest first. */
export interface Inbox {
  received: Message[];
  sent: Message[];
}

/**
 * "Contact seller" is simulated: messages are only stored by json-server
 * (no e-mail or notification is sent). Members read them in My account › My messages.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);

  /** POST /messages: the "Contact seller" form of a product page. */
  send(message: Message): Observable<Message> {
    return this.http.post<Message>(`${API_URL}/messages`, message);
  }

  /** Loads the messages a user received (as a seller) and the ones he sent, in parallel. */
  inbox(userId: string): Observable<Inbox> {
    const newestFirst = (list: Message[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));
    return forkJoin({
      received: this.http.get<Message[]>(`${API_URL}/messages`, {
        params: new HttpParams().set('sellerId', userId),
      }),
      sent: this.http.get<Message[]>(`${API_URL}/messages`, {
        params: new HttpParams().set('fromUserId', userId),
      }),
    }).pipe(
      map(({ received, sent }) => ({ received: newestFirst(received), sent: newestFirst(sent) })),
    );
  }
}
