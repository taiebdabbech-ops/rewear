import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { Message } from './models';

/** "Contact seller" is simulated: the message is only stored by json-server. */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);

  send(message: Message): Observable<Message> {
    return this.http.post<Message>(`${API_URL}/messages`, message);
  }
}
