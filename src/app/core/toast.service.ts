import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'info' | 'error';

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

  show(text: string, kind: ToastKind = 'success'): void {
    const toast: Toast = { id: this.nextId++, text, kind };
    this._toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 3500);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
