import { Injectable, signal } from '@angular/core';

/** Colour of a notification: green (success), neutral (info) or red (error). */
export type ToastKind = 'success' | 'info' | 'error';

/** One notification in the list shown by ToastContainer. */
export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

/** Small notifications shown at the bottom of the screen. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  /** Shows a notification that disappears by itself after 3.5 seconds. */
  show(text: string, kind: ToastKind = 'success'): void {
    const toast: Toast = { id: this.nextId++, text, kind };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 3500);
  }

  /** Removes a notification (close button or end of the timer). */
  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
