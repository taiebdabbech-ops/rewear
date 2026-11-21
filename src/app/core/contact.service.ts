import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api';
import { ContactMessage } from './models';

/** Contact form of the Support pages: messages are stored by json-server (simulation). */
@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  send(message: ContactMessage): Observable<ContactMessage> {
    return this.http.post<ContactMessage>(`${API_URL}/contactMessages`, message);
  }
}
